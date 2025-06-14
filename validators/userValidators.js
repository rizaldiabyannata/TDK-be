const { body } = require('express-validator');

// Aturan untuk rute login
const loginRules = () => {
  return [
    body('name').notEmpty().withMessage('Name field is required.'),
    body('password').notEmpty().withMessage('Password field is required.'),
  ];
};

// Aturan untuk rute reset password
const resetPasswordRules = () => {
  return [
    body('otp')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long.')
      .isNumeric().withMessage('OTP must only contain numbers.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
      .matches(/\d/).withMessage('Password must contain at least one number.')
      .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.'),
  ];
};

// Aturan untuk rute update user (misalnya, email)
const updateUserRules = () => {
    return [
      body('email')
        .optional() // Membuat field ini tidak wajib
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(), // Membersihkan email (misal: menghapus titik di gmail)
    ];
  };

module.exports = {
  loginRules,
  resetPasswordRules,
  updateUserRules,
};