const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');

const createNotification = async ({ workspaceId, userId, type, title, message, data }) => {
  if (!userId) {
    const { rows } = await query(
      'SELECT user_id FROM workspace_members WHERE workspace_id = $1',
      [workspaceId]
    );
    for (const row of rows) {
      await createNotification({ workspaceId, userId: row.user_id, type, title, message, data });
    }
    return;
  }

  const id = uuidv4();
  await query(
    `INSERT INTO notifications (id, user_id, workspace_id, type, title, message, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, workspaceId, type, title, message, JSON.stringify(data || {})]
  );
};

const getUserNotifications = async (userId, limit = 20) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const markAsRead = async (notificationId, userId) => {
  await query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
};

const getUnreadCount = async (userId) => {
  const { rows } = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(rows[0].count);
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead, getUnreadCount };
