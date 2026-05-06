const router = require('express').Router();
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./whatsappController');

// Public webhook (Twilio calls this)
router.post('/webhook', ctrl.webhook);

// Authenticated routes
router.use(authenticate, attachWorkspace);

router.get('/bots', ctrl.getBots);
router.post('/bots', ctrl.createBot);
router.put('/bots/:id', ctrl.updateBot);
router.delete('/bots/:id', ctrl.deleteBot);
router.get('/conversations', ctrl.getConversations);

module.exports = router;
