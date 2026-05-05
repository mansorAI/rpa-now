const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, changePassword } = require('./authController');
const { authenticate } = require('./authMiddleware');

const validateRegister = [
  body('email').isEmail().withMessage('بريد إلكتروني غير صالح'),
  body('password').isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  body('full_name').notEmpty().withMessage('الاسم الكامل مطلوب'),
];

const validateLogin = [
  body('email').isEmail().withMessage('بريد إلكتروني غير صالح'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
