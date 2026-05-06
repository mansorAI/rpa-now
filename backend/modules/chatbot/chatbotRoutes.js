const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./chatbotController');

const upload = multer({
  dest: path.join(__dirname, '../../../uploads/chatbot/'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv', '.pdf', '.txt', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Public endpoint (no auth)
router.post('/public/:botId', ctrl.publicChat);

// Authenticated routes
router.use(authenticate, attachWorkspace);

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getBots);
router.post('/', ctrl.createBot);
router.put('/:id', ctrl.updateBot);
router.delete('/:id', ctrl.deleteBot);

router.get('/:id/knowledge', ctrl.getKnowledge);
router.post('/knowledge/upload', upload.single('file'), ctrl.uploadKnowledge);
router.post('/knowledge/manual', ctrl.addManualKnowledge);
router.delete('/:id/knowledge', ctrl.deleteKnowledge);

router.get('/:id/conversations', ctrl.getConversations);
router.get('/conversations/:convId/messages', ctrl.getMessages);

router.post('/conversations/start', ctrl.startConversation);
router.post('/conversations/:convId/message', ctrl.sendMessage);

module.exports = router;
