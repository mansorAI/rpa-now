require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./modules/auth/authRoutes');
const automationRoutes = require('./modules/automation/automationRoutes');
const aiRoutes = require('./modules/ai/aiRoutes');
const billingRoutes = require('./modules/billing/billingRoutes');
const integrationRoutes = require('./modules/integrations/integrationRoutes');
const notificationRoutes = require('./modules/notifications/notificationRoutes');
const socialRoutes = require('./modules/social/socialRoutes');
const rpaRoutes = require('./modules/rpa/rpaRoutes');
const chatbotRoutes = require('./modules/chatbot/chatbotRoutes');
const { startScheduler } = require('./modules/social/scheduler');
const path = require('path');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Raw body for Stripe webhooks
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://rpa-now.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'طلبات كثيرة جداً، حاول لاحقاً' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/rpa', rpaRoutes);
app.use('/api/chatbots', chatbotRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  startScheduler();
});

module.exports = app;
