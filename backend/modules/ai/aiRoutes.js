const router = require('express').Router();
const { authenticate, attachWorkspace } = require('../auth/authMiddleware');
const { analyzeMessage, buildAutomationFromText, suggestAutomations, processNLP } = require('./aiService');

router.use(authenticate, attachWorkspace);

router.post('/analyze', async (req, res, next) => {
  try {
    const { message, prompt } = req.body;
    if (!message) return res.status(400).json({ error: 'الرسالة مطلوبة' });
    const result = await analyzeMessage(message, prompt);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post('/build-automation', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'وصف الأتمتة مطلوب' });
    const automation = await buildAutomationFromText(prompt);
    res.json({ automation });
  } catch (err) {
    next(err);
  }
});

router.post('/suggest', async (req, res, next) => {
  try {
    const suggestions = await suggestAutomations(req.body);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

router.post('/nlp', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'النص مطلوب' });
    const result = await processNLP(text);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
