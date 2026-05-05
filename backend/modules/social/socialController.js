const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { query } = require('../../config/database');
const youtube = require('./platforms/youtube');
const twitter = require('./platforms/twitter');
const facebook = require('./platforms/facebook');
const instagram = require('./platforms/instagram');
const tiktok = require('./platforms/tiktok');
const snapchat = require('./platforms/snapchat');

const oauthStore = require('./oauthStore');

// --- Accounts ---
const getAccounts = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, platform, account_name, account_id, is_active, created_at FROM social_accounts WHERE workspace_id = $1',
      [req.workspace.id]
    );
    res.json({ accounts: rows });
  } catch (err) { next(err); }
};

const getAuthUrl = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const state = Buffer.from(JSON.stringify({ workspaceId: req.workspace.id, userId: req.user.id })).toString('base64url');

    let url;
    if (platform === 'twitter') {
      const result = twitter.getAuthUrl(state);
      oauthStore.set(state, { workspaceId: req.workspace.id, userId: req.user.id, codeVerifier: result.codeVerifier });
      url = result.url;
    } else if (platform === 'youtube') {
      url = youtube.getAuthUrl(state);
    } else if (platform === 'facebook') {
      url = facebook.getAuthUrl(state);
    } else if (platform === 'instagram') {
      url = instagram.getAuthUrl(state);
    } else if (platform === 'tiktok') {
      url = tiktok.getAuthUrl(state);
    } else if (platform === 'snapchat') {
      url = snapchat.getAuthUrl(state);
    } else {
      return res.status(400).json({ error: 'منصة غير مدعومة' });
    }

    res.json({ url });
  } catch (err) { next(err); }
};

const connectAccount = async (req, res, next) => {
  try {
    const { platform, credentials, account_name, account_id } = req.body;
    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO social_accounts (id, workspace_id, platform, account_name, account_id, credentials)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, platform, account_name, account_id, is_active`,
      [id, req.workspace.id, platform, account_name, account_id, JSON.stringify(credentials)]
    );
    res.status(201).json({ account: rows[0] });
  } catch (err) { next(err); }
};

const disconnectAccount = async (req, res, next) => {
  try {
    await query('DELETE FROM social_accounts WHERE id = $1 AND workspace_id = $2', [req.params.id, req.workspace.id]);
    res.json({ message: 'تم فصل الحساب' });
  } catch (err) { next(err); }
};

// --- Posts ---
const getPosts = async (req, res, next) => {
  try {
    const { platform, status } = req.query;
    let sql = `SELECT sp.*, sa.account_name, sa.platform as account_platform
               FROM social_posts sp LEFT JOIN social_accounts sa ON sa.id = sp.social_account_id
               WHERE sp.workspace_id = $1`;
    const params = [req.workspace.id];

    if (platform) { sql += ` AND sp.platform = $${params.length + 1}`; params.push(platform); }
    if (status)   { sql += ` AND sp.status = $${params.length + 1}`; params.push(status); }

    sql += ' ORDER BY sp.scheduled_at ASC';
    const { rows } = await query(sql, params);
    res.json({ posts: rows });
  } catch (err) { next(err); }
};

const createPost = async (req, res, next) => {
  try {
    const { social_account_id, platform, post_type, title, description, hashtags, scheduled_at, metadata } = req.body;
    const mediaFile = req.file;

    const id = uuidv4();
    const media_path = mediaFile ? mediaFile.filename : null;
    const media_url = req.body.media_url || null;

    const { rows } = await query(
      `INSERT INTO social_posts
       (id, workspace_id, social_account_id, platform, post_type, title, description, hashtags, media_url, media_path, scheduled_at, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, req.workspace.id, social_account_id, platform, post_type || 'video',
        title, description, hashtags || [],
        media_url, media_path,
        new Date(scheduled_at),
        JSON.stringify(metadata || {}),
        req.user.id]
    );

    res.status(201).json({ post: rows[0] });
  } catch (err) { next(err); }
};

const createBulkPosts = async (req, res, next) => {
  try {
    const { posts } = req.body;
    const created = [];

    for (const p of posts) {
      const id = uuidv4();
      const { rows } = await query(
        `INSERT INTO social_posts
         (id, workspace_id, social_account_id, platform, post_type, title, description, hashtags, media_url, scheduled_at, metadata, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [id, req.workspace.id, p.social_account_id, p.platform, p.post_type || 'video',
          p.title, p.description, p.hashtags || [], p.media_url,
          new Date(p.scheduled_at), JSON.stringify(p.metadata || {}), req.user.id]
      );
      created.push(rows[0]);
    }

    res.status(201).json({ posts: created, count: created.length });
  } catch (err) { next(err); }
};

const updatePost = async (req, res, next) => {
  try {
    const { title, description, hashtags, scheduled_at, status } = req.body;
    const { rows } = await query(
      `UPDATE social_posts SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        hashtags = COALESCE($3, hashtags),
        scheduled_at = COALESCE($4, scheduled_at),
        status = COALESCE($5, status)
       WHERE id = $6 AND workspace_id = $7 AND status = 'scheduled' RETURNING *`,
      [title, description, hashtags, scheduled_at ? new Date(scheduled_at) : null, status, req.params.id, req.workspace.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'المنشور غير موجود أو تم نشره بالفعل' });
    res.json({ post: rows[0] });
  } catch (err) { next(err); }
};

const deletePost = async (req, res, next) => {
  try {
    const { rows } = await query(
      'DELETE FROM social_posts WHERE id = $1 AND workspace_id = $2 AND status = $3 RETURNING media_path',
      [req.params.id, req.workspace.id, 'scheduled']
    );
    if (!rows[0]) return res.status(404).json({ error: 'لا يمكن حذف منشور تم نشره' });

    if (rows[0].media_path) {
      const filePath = path.join(__dirname, '../../../uploads', rows[0].media_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: 'تم حذف المنشور' });
  } catch (err) { next(err); }
};

// --- Upload Media ---
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });
    const id = uuidv4();
    await query(
      'INSERT INTO social_media_files (id, workspace_id, filename, original_name, file_path, file_size, mime_type) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, req.workspace.id, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
    );
    res.json({ file: { id, filename: req.file.filename, original_name: req.file.originalname, size: req.file.size } });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const [total, scheduled, posted, failed] = await Promise.all([
      query('SELECT COUNT(*) FROM social_posts WHERE workspace_id = $1', [req.workspace.id]),
      query("SELECT COUNT(*) FROM social_posts WHERE workspace_id = $1 AND status = 'scheduled'", [req.workspace.id]),
      query("SELECT COUNT(*) FROM social_posts WHERE workspace_id = $1 AND status = 'posted'", [req.workspace.id]),
      query("SELECT COUNT(*) FROM social_posts WHERE workspace_id = $1 AND status = 'failed'", [req.workspace.id]),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      scheduled: parseInt(scheduled.rows[0].count),
      posted: parseInt(posted.rows[0].count),
      failed: parseInt(failed.rows[0].count),
    });
  } catch (err) { next(err); }
};

module.exports = { getAccounts, getAuthUrl, connectAccount, disconnectAccount, getPosts, createPost, createBulkPosts, updatePost, deletePost, uploadMedia, getStats };
