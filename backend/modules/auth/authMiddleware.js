const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      'SELECT id, email, full_name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (!rows[0]) return res.status(401).json({ error: 'المستخدم غير موجود' });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'انتهت صلاحية الجلسة، سجل الدخول مجدداً' });
    }
    return res.status(401).json({ error: 'رمز التحقق غير صالح' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
  }
  next();
};

const attachWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;
    if (!workspaceId) return res.status(400).json({ error: 'يجب تحديد مساحة العمل' });

    const { rows } = await query(
      `SELECT w.* FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE w.id = $1 AND wm.user_id = $2`,
      [workspaceId, req.user.id]
    );

    if (!rows[0]) return res.status(403).json({ error: 'ليس لديك وصول لهذه المساحة' });

    req.workspace = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireRole, attachWorkspace };
