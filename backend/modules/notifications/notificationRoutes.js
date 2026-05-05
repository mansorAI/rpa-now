const router = require('express').Router();
const { authenticate } = require('../auth/authMiddleware');
const { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } = require('./notificationService');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await getUserNotifications(req.user.id, parseInt(req.query.limit) || 20);
    const unread = await getUnreadCount(req.user.id);
    res.json({ notifications, unread });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    await markAsRead(req.params.id, req.user.id);
    res.json({ message: 'تم تحديث الإشعار' });
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: 'تم تحديث جميع الإشعارات' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
