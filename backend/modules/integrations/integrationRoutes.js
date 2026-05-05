const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const twilioService = require('./twilioService');
const whatsappService = require('./whatsappService');
const gmailService = require('./gmailService');

// Public webhooks (no auth)
router.post('/twilio/sms', twilioService.handleIncomingSMS);
router.get('/whatsapp/webhook', whatsappService.verifyWebhook);
router.post('/whatsapp/webhook', whatsappService.handleWebhook);

// Protected routes
router.use(authenticate, attachWorkspace);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, type, name, is_active, last_used_at, created_at FROM integrations WHERE workspace_id = $1`,
      [req.workspace.id]
    );
    res.json({ integrations: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { type, name, credentials } = req.body;
    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO integrations (id, workspace_id, type, name, credentials) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, req.workspace.id, type, name, JSON.stringify(credentials || {})]
    );
    res.status(201).json({ integration: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM integrations WHERE id = $1 AND workspace_id = $2', [req.params.id, req.workspace.id]);
    res.json({ message: 'تم حذف التكامل' });
  } catch (err) {
    next(err);
  }
});

router.post('/test/sms', async (req, res, next) => {
  try {
    const { to, message } = req.body;
    const result = await twilioService.sendSMS(to, message);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post('/test/whatsapp', async (req, res, next) => {
  try {
    const { to, message } = req.body;
    const result = await whatsappService.sendMessage(to, message);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post('/test/email', async (req, res, next) => {
  try {
    const { to, subject, body } = req.body;
    const result = await gmailService.sendEmail({ to, subject, body, workspaceId: req.workspace.id });
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.get('/gmail/auth', (req, res) => {
  const url = gmailService.getOAuthUrl();
  res.json({ url });
});

module.exports = router;
