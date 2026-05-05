const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./socialController');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${require('uuid').v4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authenticate, attachWorkspace);

// Stats
router.get('/stats', ctrl.getStats);

// Accounts
router.get('/accounts', ctrl.getAccounts);
router.get('/accounts/:platform/auth-url', ctrl.getAuthUrl);
router.post('/accounts', ctrl.connectAccount);
router.delete('/accounts/:id', ctrl.disconnectAccount);

// Posts
router.get('/posts', ctrl.getPosts);
router.post('/posts', upload.single('media'), ctrl.createPost);
router.post('/posts/bulk', ctrl.createBulkPosts);
router.put('/posts/:id', ctrl.updatePost);
router.delete('/posts/:id', ctrl.deletePost);

// Media upload
router.post('/upload', upload.single('media'), ctrl.uploadMedia);

module.exports = router;
