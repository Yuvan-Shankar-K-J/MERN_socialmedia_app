const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/search', auth, userController.searchUsers);
router.put('/me', auth, userController.updateMe);

// New settings routes
router.put('/change-password', auth, userController.changePassword);
router.put('/toggle-2fa', auth, userController.toggleTwoFactor);
router.get('/login-history', auth, userController.getLoginHistory);
router.get('/linked-accounts', auth, userController.getLinkedAccounts);
router.post('/link-account', auth, userController.linkAccount);
router.post('/unlink-account', auth, userController.unlinkAccount);

// Public profile route
router.get('/profile/:id', auth, userController.getUserProfile);

module.exports = router;
