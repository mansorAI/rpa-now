const router = require('express').Router();
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./automationController');

router.use(authenticate, attachWorkspace);

router.get('/stats', ctrl.getStats);
router.get('/logs', ctrl.getLogs);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.post('/natural-language', ctrl.createFromNaturalLanguage);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/test', ctrl.testRun);

module.exports = router;
