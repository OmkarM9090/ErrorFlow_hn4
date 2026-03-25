const express = require('express');
const { body } = require('express-validator');

const { signup, verifyOtp, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  signup
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
  ],
  verifyOtp
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/protected', authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Protected route accessed successfully',
    user: req.user,
  });
});

module.exports = router;
