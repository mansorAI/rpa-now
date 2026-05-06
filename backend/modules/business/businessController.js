const { pool } = require('../../config/database');
const { generateBusinessSetup } = require('./onboardingAI');

// ── Onboarding ────────────────────────────────────────────────────────────────

exports.saveOnboarding = async (req, res) => {
  try {
    const answers = req.body;
    const workspaceId = req.workspace.id;

    const aiConfig = await generateBusinessSetup(answers);

    const { rows } = await pool.query(
      `INSERT INTO business_profiles
         (workspace_id, business_name, business_type, description, team_size,
          customer_channels, daily_customers, common_questions, challenges,
          first_goal, ai_config, onboarding_done)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
       ON CONFLICT (workspace_id) DO UPDATE SET
         business_name=$2, business_type=$3, description=$4, team_size=$5,
         customer_channels=$6, daily_customers=$7, common_questions=$8,
         challenges=$9, first_goal=$10, ai_config=$11,
         onboarding_done=true, updated_at=NOW()
       RETURNING *`,
      [
        workspaceId,
        answers.business_name,
        answers.business_type,
        answers.description,
        answers.team_size,
        JSON.stringify(answers.customer_channels || []),
        answers.daily_customers,
        answers.common_questions,
        JSON.stringify(answers.challenges || []),
        answers.first_goal,
        JSON.stringify(aiConfig),
      ]
    );

    // Auto-create chatbot from AI config
    const cc = aiConfig.chatbot_config;
    await pool.query(
      `INSERT INTO chatbots
         (workspace_id, name, business_type, description, greeting, personality, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [workspaceId, cc.name, answers.business_type, answers.description,
       cc.greeting, cc.personality, req.user.id]
    ).catch(() => {});

    await logAudit(workspaceId, req.user.id, req.user.full_name,
      'completed_onboarding', 'business_profile', answers.business_name, {});

    res.json({ success: true, profile: rows[0], ai_config: aiConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM business_profiles WHERE workspace_id=$1',
      [req.workspace.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Team ──────────────────────────────────────────────────────────────────────

exports.getTeam = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT tm.*, u.full_name, u.email
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.workspace_id=$1
       ORDER BY tm.created_at`,
      [req.workspace.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { email, role, department } = req.body;
    const userRes = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'المستخدم غير موجود في النظام' });

    const userId = userRes.rows[0].id;
    const { rows } = await pool.query(
      `INSERT INTO team_members (workspace_id, user_id, role, department, invited_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (workspace_id, user_id) DO UPDATE SET role=$3, department=$4
       RETURNING *`,
      [req.workspace.id, userId, role || 'employee', department, req.user.id]
    );

    await logAudit(req.workspace.id, req.user.id, req.user.full_name,
      'invited_member', 'team_member', email, { role });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { role, department } = req.body;
    const { rows } = await pool.query(
      `UPDATE team_members SET role=$1, department=$2
       WHERE id=$3 AND workspace_id=$4 RETURNING *`,
      [role, department, req.params.id, req.workspace.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'العضو غير موجود' });
    await logAudit(req.workspace.id, req.user.id, req.user.full_name,
      'updated_member_role', 'team_member', rows[0].id, { role });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM team_members WHERE id=$1 AND workspace_id=$2',
      [req.params.id, req.workspace.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const { rows } = await pool.query(
      `SELECT * FROM audit_logs WHERE workspace_id=$1
       ORDER BY created_at DESC LIMIT $2`,
      [req.workspace.id, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Helper ────────────────────────────────────────────────────────────────────

async function logAudit(workspaceId, userId, userName, action, resourceType, resourceName, details) {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (workspace_id, user_id, user_name, action, resource_type, resource_name, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [workspaceId, userId, userName, action, resourceType, resourceName, JSON.stringify(details)]
    );
  } catch {}
}

module.exports.logAudit = logAudit;
