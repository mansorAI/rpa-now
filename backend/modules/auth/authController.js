const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
      [userId, email, password_hash, full_name]
    );

    // Create default workspace
    const workspaceId = uuidv4();
    await query(
      'INSERT INTO workspaces (id, name, owner_id, plan) VALUES ($1, $2, $3, $4)',
      [workspaceId, `مساحة ${full_name}`, userId, 'personal']
    );
    await query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceId, userId, 'owner']
    );

    const token = generateToken(userId);
    res.status(201).json({
      token,
      user: { id: userId, email, full_name, role: 'user' },
      workspace: { id: workspaceId },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
    }

    const workspace = await query(
      `SELECT w.* FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1 ORDER BY w.created_at ASC LIMIT 1`,
      [user.id]
    );

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      workspace: workspace.rows[0] || null,
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { rows: workspaces } = await query(
      `SELECT w.* FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1`,
      [req.user.id]
    );
    res.json({ user: req.user, workspaces });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await bcrypt.compare(current_password, rows[0].password_hash))) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
