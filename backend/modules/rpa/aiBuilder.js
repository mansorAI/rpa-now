const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function buildWorkflowFromText(description) {
  const systemPrompt = `You are an expert RPA workflow builder. Convert user descriptions into structured workflows.
Return ONLY valid JSON with this exact structure:
{
  "name": "workflow name",
  "description": "short description",
  "trigger_type": "manual|schedule|webhook|event",
  "trigger_config": {},
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger|condition|action|ai_action|delay|approval|notification|transform",
      "position": {"x": 100, "y": 100},
      "data": {
        "label": "Node Label",
        "config": {}
      }
    }
  ],
  "edges": [
    {"id": "e1", "source": "node_1", "target": "node_2"}
  ],
  "tags": ["tag1"]
}

Node spacing: x increases by 200 per step, y stays at 100 unless branching.
Always start with a trigger node.`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(res.choices[0].message.content);
}

async function optimizeWorkflow(workflow) {
  const systemPrompt = `You are an RPA optimization expert. Analyze this workflow and suggest improvements.
Return JSON:
{
  "suggestions": [
    {"type": "merge|remove|reorder|add", "description": "what to do", "node_ids": ["id1"]}
  ],
  "optimized_nodes": [...],
  "optimized_edges": [...],
  "summary": "brief summary of changes"
}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Optimize this workflow: ${JSON.stringify({ name: workflow.name, nodes: workflow.nodes, edges: workflow.edges })}` },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(res.choices[0].message.content);
}

async function generateSuggestions(workspaceLogs) {
  const systemPrompt = `You are an AI that analyzes business automation patterns and suggests new automations.
Return JSON:
{
  "suggestions": [
    {
      "title": "Suggestion title",
      "description": "What to automate and why",
      "type": "new_automation|optimization",
      "priority": "high|medium|low"
    }
  ]
}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Based on these execution patterns, suggest automations: ${JSON.stringify(workspaceLogs)}` },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(res.choices[0].message.content);
}

module.exports = { buildWorkflowFromText, optimizeWorkflow, generateSuggestions };
