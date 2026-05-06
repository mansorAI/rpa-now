const { pool } = require('../../config/database');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function executeWorkflow(workflowId, inputData = {}, triggeredBy = 'manual') {
  const client = await pool.connect();
  try {
    const wfRes = await client.query('SELECT * FROM rpa_workflows WHERE id = $1', [workflowId]);
    if (!wfRes.rows.length) throw new Error('Workflow not found');
    const workflow = wfRes.rows[0];

    const execRes = await client.query(
      `INSERT INTO rpa_executions (workflow_id, workspace_id, status, triggered_by, input_data)
       VALUES ($1, $2, 'running', $3, $4) RETURNING id`,
      [workflowId, workflow.workspace_id, triggeredBy, JSON.stringify(inputData)]
    );
    const executionId = execRes.rows[0].id;

    setImmediate(() => runNodes(workflow, executionId, inputData, client));
    return executionId;
  } catch (err) {
    client.release();
    throw err;
  }
}

async function runNodes(workflow, executionId, inputData, client) {
  const nodes = workflow.nodes || [];
  const context = { ...inputData };
  const startTime = Date.now();

  try {
    const sorted = topologicalSort(nodes, workflow.edges || []);

    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i];
      if (node.type === 'trigger') continue;

      const stepRes = await client.query(
        `INSERT INTO rpa_execution_steps
         (execution_id, node_id, node_type, node_name, status, input_data, actor, started_at, step_order)
         VALUES ($1,$2,$3,$4,'running',$5,$6,NOW(),$7) RETURNING id`,
        [executionId, node.id, node.type, node.data?.label || node.type,
         JSON.stringify(context), getActor(node.type), i]
      );
      const stepId = stepRes.rows[0].id;
      const stepStart = Date.now();

      try {
        const output = await executeNode(node, context);
        Object.assign(context, output || {});

        await client.query(
          `UPDATE rpa_execution_steps
           SET status='completed', output_data=$1, completed_at=NOW(), duration_ms=$2
           WHERE id=$3`,
          [JSON.stringify(output || {}), Date.now() - stepStart, stepId]
        );
      } catch (nodeErr) {
        await client.query(
          `UPDATE rpa_execution_steps
           SET status='failed', error_message=$1, completed_at=NOW(), duration_ms=$2
           WHERE id=$3`,
          [nodeErr.message, Date.now() - stepStart, stepId]
        );
        throw nodeErr;
      }
    }

    const duration = Date.now() - startTime;
    await client.query(
      `UPDATE rpa_executions SET status='completed', output_data=$1, completed_at=NOW(), duration_ms=$2 WHERE id=$3`,
      [JSON.stringify(context), duration, executionId]
    );
    await client.query(
      `UPDATE rpa_workflows SET run_count=run_count+1, success_count=success_count+1,
       avg_duration_ms=((avg_duration_ms * run_count) + $1) / (run_count + 1) WHERE id=$2`,
      [duration, workflow.id]
    );
  } catch (err) {
    const diagnosis = await diagnoseError(err.message, workflow);
    await client.query(
      `UPDATE rpa_executions SET status='failed', error_message=$1, ai_diagnosis=$2, completed_at=NOW(), duration_ms=$3 WHERE id=$4`,
      [err.message, diagnosis, Date.now() - startTime, executionId]
    );
    await client.query(
      `UPDATE rpa_workflows SET run_count=run_count+1, fail_count=fail_count+1 WHERE id=$1`,
      [workflow.id]
    );
  } finally {
    client.release();
  }
}

async function executeNode(node, context) {
  const config = node.data?.config || {};

  switch (node.type) {
    case 'condition': {
      const { field, operator, value } = config;
      const actual = context[field];
      const passed = evaluateCondition(actual, operator, value);
      return { [`condition_${node.id}`]: passed };
    }

    case 'ai_action': {
      const prompt = interpolate(config.prompt || '', context);
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an automation assistant. Return JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });
      try { return JSON.parse(res.choices[0].message.content); } catch { return {}; }
    }

    case 'delay': {
      const ms = (config.seconds || 1) * 1000;
      await new Promise(r => setTimeout(r, Math.min(ms, 30000)));
      return {};
    }

    case 'approval': {
      return { approval_status: 'auto_approved', approval_note: 'Auto-approved by system' };
    }

    case 'notification': {
      return { notification_sent: true, message: interpolate(config.message || '', context) };
    }

    case 'transform': {
      const output = {};
      (config.mappings || []).forEach(({ from, to }) => {
        if (context[from] !== undefined) output[to] = context[from];
      });
      return output;
    }

    case 'action':
    default:
      return { action_result: 'executed', action_type: config.action_type || 'generic' };
  }
}

function evaluateCondition(actual, operator, value) {
  switch (operator) {
    case 'eq': return actual == value;
    case 'neq': return actual != value;
    case 'gt': return Number(actual) > Number(value);
    case 'lt': return Number(actual) < Number(value);
    case 'contains': return String(actual).includes(value);
    default: return true;
  }
}

function interpolate(template, context) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? '');
}

function getActor(nodeType) {
  if (nodeType === 'ai_action') return 'ai';
  if (nodeType === 'approval') return 'user';
  return 'system';
}

function topologicalSort(nodes, edges) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));
  const visited = new Set();
  const result = [];

  function visit(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const incoming = edges.filter(e => e.target === nodeId).map(e => e.source);
    incoming.forEach(visit);
    if (map[nodeId]) result.push(map[nodeId]);
  }

  nodes.forEach(n => visit(n.id));
  return result;
}

async function diagnoseError(errorMessage, workflow) {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an RPA error diagnosis expert. Be concise.' },
        { role: 'user', content: `Workflow "${workflow.name}" failed with: ${errorMessage}. Diagnose and suggest a fix in 2 sentences.` },
      ],
    });
    return res.choices[0].message.content;
  } catch {
    return 'Could not diagnose error automatically.';
  }
}

module.exports = { executeWorkflow };
