const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');
const automationEngine = require('./automationEngine');
const aiService = require('../ai/aiService');

const getAll = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.*, u.full_name as creator_name,
        (SELECT COUNT(*) FROM logs l WHERE l.automation_id = a.id) as total_runs
       FROM automations a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.workspace_id = $1
       ORDER BY a.created_at DESC`,
      [req.workspace.id]
    );
    res.json({ automations: rows });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM automations WHERE id = $1 AND workspace_id = $2',
      [req.params.id, req.workspace.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الأتمتة غير موجودة' });
    res.json({ automation: rows[0] });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, trigger_type, trigger_config, conditions, actions, ai_enabled, ai_prompt } = req.body;

    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO automations (id, workspace_id, name, description, trigger_type, trigger_config, conditions, actions, ai_enabled, ai_prompt, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [id, req.workspace.id, name, description, trigger_type,
        JSON.stringify(trigger_config || {}),
        JSON.stringify(conditions || []),
        JSON.stringify(actions || []),
        ai_enabled || false, ai_prompt, req.user.id]
    );

    res.status(201).json({ automation: rows[0] });
  } catch (err) {
    next(err);
  }
};

const createFromNaturalLanguage = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const automation = await aiService.buildAutomationFromText(prompt);

    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO automations (id, workspace_id, name, description, trigger_type, trigger_config, conditions, actions, ai_enabled, ai_prompt, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [id, req.workspace.id, automation.name, automation.description,
        automation.trigger_type, JSON.stringify(automation.trigger_config),
        JSON.stringify(automation.conditions), JSON.stringify(automation.actions),
        true, prompt, req.user.id]
    );

    res.status(201).json({ automation: rows[0], parsed: automation });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, description, trigger_type, trigger_config, conditions, actions, ai_enabled, ai_prompt, is_active } = req.body;

    const { rows } = await query(
      `UPDATE automations SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        trigger_type = COALESCE($3, trigger_type),
        trigger_config = COALESCE($4::jsonb, trigger_config),
        conditions = COALESCE($5::jsonb, conditions),
        actions = COALESCE($6::jsonb, actions),
        ai_enabled = COALESCE($7, ai_enabled),
        ai_prompt = COALESCE($8, ai_prompt),
        is_active = COALESCE($9, is_active)
       WHERE id = $10 AND workspace_id = $11 RETURNING *`,
      [name, description, trigger_type,
        trigger_config ? JSON.stringify(trigger_config) : null,
        conditions ? JSON.stringify(conditions) : null,
        actions ? JSON.stringify(actions) : null,
        ai_enabled, ai_prompt, is_active,
        req.params.id, req.workspace.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'الأتمتة غير موجودة' });
    res.json({ automation: rows[0] });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM automations WHERE id = $1 AND workspace_id = $2',
      [req.params.id, req.workspace.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'الأتمتة غير موجودة' });
    res.json({ message: 'تم حذف الأتمتة بنجاح' });
  } catch (err) {
    next(err);
  }
};

const testRun = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM automations WHERE id = $1 AND workspace_id = $2',
      [req.params.id, req.workspace.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الأتمتة غير موجودة' });

    const result = await automationEngine.execute(rows[0], req.body.test_data || {});
    res.json({ result });
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT l.*, a.name as automation_name FROM logs l
       JOIN automations a ON a.id = l.automation_id
       WHERE l.workspace_id = $1
       ORDER BY l.created_at DESC LIMIT $2 OFFSET $3`,
      [req.workspace.id, limit, offset]
    );

    const count = await query('SELECT COUNT(*) FROM logs WHERE workspace_id = $1', [req.workspace.id]);
    res.json({ logs: rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const [total, active, totalRuns, successRate] = await Promise.all([
      query('SELECT COUNT(*) FROM automations WHERE workspace_id = $1', [req.workspace.id]),
      query('SELECT COUNT(*) FROM automations WHERE workspace_id = $1 AND is_active = true', [req.workspace.id]),
      query('SELECT COUNT(*) FROM logs WHERE workspace_id = $1', [req.workspace.id]),
      query(
        `SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0), 1) as rate
         FROM logs WHERE workspace_id = $1`,
        [req.workspace.id]
      ),
    ]);

    res.json({
      total_automations: parseInt(total.rows[0].count),
      active_automations: parseInt(active.rows[0].count),
      total_runs: parseInt(totalRuns.rows[0].count),
      success_rate: parseFloat(successRate.rows[0].rate) || 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, createFromNaturalLanguage, update, remove, testRun, getLogs, getStats };
