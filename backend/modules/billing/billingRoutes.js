const router = require('express').Router();
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./billingController');

router.post('/webhook', ctrl.handleWebhook);

router.use(authenticate, attachWorkspace);

router.get('/plans', ctrl.getPlans);
router.get('/subscription', ctrl.getSubscription);
router.post('/checkout', ctrl.createCheckout);
router.post('/portal', ctrl.createPortal);
router.get('/transactions', ctrl.getTransactions);

module.exports = router;
