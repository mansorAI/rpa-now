const router = require('express').Router();
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./businessController');

router.use(authenticate, attachWorkspace);

router.get('/profile', ctrl.getProfile);
router.post('/onboarding', ctrl.saveOnboarding);

router.get('/team', ctrl.getTeam);
router.post('/team/invite', ctrl.inviteMember);
router.put('/team/:id', ctrl.updateMember);
router.delete('/team/:id', ctrl.removeMember);

router.get('/audit', ctrl.getAuditLogs);

module.exports = router;
