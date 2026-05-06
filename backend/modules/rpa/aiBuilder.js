const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(system, user) {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

async function buildWorkflowFromText(description) {
  const system = `You are an expert RPA workflow builder. Convert user descriptions into structured workflows.
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
      "data": { "label": "Node Label", "config": {} }
    }
  ],
  "edges": [{"id": "e1", "source": "node_1", "target": "node_2"}],
  "tags": ["tag1"]
}
Node spacing: x increases by 200 per step. Always start with a trigger node.`;

  return callClaude(system, description);
}

async function optimizeWorkflow(workflow) {
  const system = `You are an RPA optimization expert. Analyze workflows and suggest improvements.
Return ONLY valid JSON:
{
  "suggestions": [{"type": "merge|remove|reorder|add", "description": "what to do", "node_ids": ["id1"]}],
  "optimized_nodes": [],
  "optimized_edges": [],
  "summary": "brief summary"
}`;

  return callClaude(system, `Optimize this workflow: ${JSON.stringify({ name: workflow.name, nodes: workflow.nodes, edges: workflow.edges })}`);
}

async function generateSuggestions(workspaceLogs) {
  const system = `You are an AI that analyzes business automation patterns and suggests new automations.
Return ONLY valid JSON:
{
  "suggestions": [
    {"title": "Suggestion title", "description": "What to automate and why", "type": "new_automation|optimization", "priority": "high|medium|low"}
  ]
}`;

  return callClaude(system, `Based on these execution patterns, suggest automations: ${JSON.stringify(workspaceLogs)}`);
}

module.exports = { buildWorkflowFromText, optimizeWorkflow, generateSuggestions };
