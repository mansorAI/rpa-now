const { pool } = require('../../config/database');
const { executeWorkflow } = require('./workflowEngine');
const { buildWorkflowFromText, optimizeWorkflow, generateSuggestions } = require('./aiBuilder');
const fs = require('fs');
const path = require('path');

// ── Workflows ────────────────────────────────────────────────────────────────

exports.getWorkflows = async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = 'SELECT * FROM rpa_workflows WHERE workspace_id=$1';
    const params = [req.workspace.id];
    if (status) { q += ` AND status=$${params.push(status)}`; }
    if (search) { q += ` AND name ILIKE $${params.push(`%${search}%`)}`; }
    q += ' ORDER BY updated_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getWorkflow = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM rpa_workflows WHERE id=$1 AND workspace_id=$2',
      [req.params.id, req.workspace.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_config, nodes, edges, tags } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO rpa_workflows (workspace_id, name, description, trigger_type, trigger_config, nodes, edges, tags, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.workspace.id, name, description, trigger_type || 'manual',
       JSON.stringify(trigger_config || {}), JSON.stringify(nodes || []),
       JSON.stringify(edges || []), tags || [], req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateWorkflow = async (req, res) => {
  try {
    const fields = ['name','description','status','trigger_type','trigger_config','nodes','edges','tags'];
    const updates = [];
    const params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        params.push(typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(new Date(), req.params.id, req.workspace.id);
    const { rows } = await pool.query(
      `UPDATE rpa_workflows SET ${updates.join(',')}, updated_at=$${params.length - 2}
       WHERE id=$${params.length - 1} AND workspace_id=$${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteWorkflow = async (req, res) => {
  try {
    await pool.query('DELETE FROM rpa_workflows WHERE id=$1 AND workspace_id=$2',
      [req.params.id, req.workspace.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Execution ────────────────────────────────────────────────────────────────

exports.runWorkflow = async (req, res) => {
  try {
    const executionId = await executeWorkflow(req.params.id, req.body.input_data || {}, 'manual');
    res.json({ execution_id: executionId, status: 'running' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getExecutions = async (req, res) => {
  try {
    const { workflow_id, status } = req.query;
    let q = 'SELECT e.*, w.name as workflow_name FROM rpa_executions e JOIN rpa_workflows w ON w.id=e.workflow_id WHERE e.workspace_id=$1';
    const params = [req.workspace.id];
    if (workflow_id) { q += ` AND e.workflow_id=$${params.push(workflow_id)}`; }
    if (status) { q += ` AND e.status=$${params.push(status)}`; }
    q += ' ORDER BY e.started_at DESC LIMIT 100';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getExecution = async (req, res) => {
  try {
    const [execRes, stepsRes] = await Promise.all([
      pool.query('SELECT * FROM rpa_executions WHERE id=$1 AND workspace_id=$2',
        [req.params.id, req.workspace.id]),
      pool.query('SELECT * FROM rpa_execution_steps WHERE execution_id=$1 ORDER BY step_order',
        [req.params.id]),
    ]);
    if (!execRes.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...execRes.rows[0], steps: stepsRes.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── AI Builder ───────────────────────────────────────────────────────────────

exports.aiGenerateWorkflow = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description required' });
    const workflow = await buildWorkflowFromText(description);
    workflow.ai_generated = true;
    workflow.workspace_id = req.workspace.id;
    workflow.created_by = req.user.id;
    const { rows } = await pool.query(
      `INSERT INTO rpa_workflows (workspace_id, name, description, trigger_type, trigger_config, nodes, edges, tags, ai_generated, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.workspace.id, workflow.name, workflow.description, workflow.trigger_type || 'manual',
       JSON.stringify(workflow.trigger_config || {}), JSON.stringify(workflow.nodes || []),
       JSON.stringify(workflow.edges || []), workflow.tags || [], true, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.aiOptimizeWorkflow = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rpa_workflows WHERE id=$1 AND workspace_id=$2',
      [req.params.id, req.workspace.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const result = await optimizeWorkflow(rows[0]);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.aiGetSuggestions = async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      `SELECT * FROM rpa_ai_suggestions WHERE workspace_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 10`,
      [req.workspace.id]
    );
    if (existing.length) return res.json(existing);

    const { rows: logs } = await pool.query(
      `SELECT w.name, e.status, COUNT(*) as count
       FROM rpa_executions e JOIN rpa_workflows w ON w.id=e.workflow_id
       WHERE e.workspace_id=$1 GROUP BY w.name, e.status LIMIT 20`,
      [req.workspace.id]
    );

    const result = await generateSuggestions(logs);
    const suggestions = result.suggestions || [];

    for (const s of suggestions) {
      await pool.query(
        `INSERT INTO rpa_ai_suggestions (workspace_id, type, title, description)
         VALUES ($1,$2,$3,$4)`,
        [req.workspace.id, s.type || 'new_automation', s.title, s.description]
      );
    }

    const { rows: newRows } = await pool.query(
      `SELECT * FROM rpa_ai_suggestions WHERE workspace_id=$1 AND status='pending' ORDER BY created_at DESC LIMIT 10`,
      [req.workspace.id]
    );
    res.json(newRows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSuggestion = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE rpa_ai_suggestions SET status=$1 WHERE id=$2 AND workspace_id=$3',
      [status, req.params.id, req.workspace.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Templates ────────────────────────────────────────────────────────────────

exports.getTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    let q = 'SELECT * FROM rpa_templates WHERE is_public=true';
    const params = [];
    if (category) { q += ` AND category=$${params.push(category)}`; }
    q += ' ORDER BY use_count DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.useTemplate = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rpa_templates WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Template not found' });
    const tpl = rows[0];
    await pool.query('UPDATE rpa_templates SET use_count=use_count+1 WHERE id=$1', [tpl.id]);
    const { rows: wfRows } = await pool.query(
      `INSERT INTO rpa_workflows (workspace_id, name, description, trigger_type, trigger_config, nodes, edges, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.workspace.id, tpl.name, tpl.description, tpl.trigger_type,
       JSON.stringify(tpl.trigger_config), JSON.stringify(tpl.nodes),
       JSON.stringify(tpl.edges), req.user.id]
    );
    res.json(wfRows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Analytics ────────────────────────────────────────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const [statsRes, topRes, failRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(DISTINCT w.id) as total_workflows,
           SUM(w.run_count) as total_runs,
           SUM(w.success_count) as total_success,
           SUM(w.fail_count) as total_failures,
           ROUND(AVG(w.avg_duration_ms)) as avg_duration_ms,
           SUM(w.run_count * w.avg_duration_ms / 60000.0) as total_minutes_saved
         FROM rpa_workflows w WHERE w.workspace_id=$1`,
        [req.workspace.id]
      ),
      pool.query(
        `SELECT name, run_count, success_count, fail_count, avg_duration_ms
         FROM rpa_workflows WHERE workspace_id=$1 ORDER BY run_count DESC LIMIT 5`,
        [req.workspace.id]
      ),
      pool.query(
        `SELECT w.name, e.error_message, COUNT(*) as count
         FROM rpa_executions e JOIN rpa_workflows w ON w.id=e.workflow_id
         WHERE e.workspace_id=$1 AND e.status='failed'
         GROUP BY w.name, e.error_message ORDER BY count DESC LIMIT 5`,
        [req.workspace.id]
      ),
    ]);

    const stats = statsRes.rows[0];
    const successRate = stats.total_runs > 0
      ? Math.round((stats.total_success / stats.total_runs) * 100)
      : 0;

    res.json({
      total_workflows: parseInt(stats.total_workflows) || 0,
      total_runs: parseInt(stats.total_runs) || 0,
      success_rate: successRate,
      total_failures: parseInt(stats.total_failures) || 0,
      avg_duration_ms: parseInt(stats.avg_duration_ms) || 0,
      time_saved_hours: Math.round((parseFloat(stats.total_minutes_saved) || 0) / 60),
      top_workflows: topRes.rows,
      failure_patterns: failRes.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
