const router = require('express').Router();
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const ctrl = require('./rpaController');

router.use(authenticate, attachWorkspace);

// Workflows
router.get('/workflows', ctrl.getWorkflows);
router.get('/workflows/:id', ctrl.getWorkflow);
router.post('/workflows', ctrl.createWorkflow);
router.put('/workflows/:id', ctrl.updateWorkflow);
router.delete('/workflows/:id', ctrl.deleteWorkflow);

// Execution
router.post('/workflows/:id/run', ctrl.runWorkflow);
router.get('/executions', ctrl.getExecutions);
router.get('/executions/:id', ctrl.getExecution);

// AI Builder
router.post('/ai/generate', ctrl.aiGenerateWorkflow);
router.post('/ai/optimize/:id', ctrl.aiOptimizeWorkflow);
router.get('/ai/suggestions', ctrl.aiGetSuggestions);
router.put('/ai/suggestions/:id', ctrl.updateSuggestion);

// Templates
router.get('/templates', ctrl.getTemplates);
router.post('/templates/:id/use', ctrl.useTemplate);

// Analytics
router.get('/analytics', ctrl.getAnalytics);

module.exports = router;
