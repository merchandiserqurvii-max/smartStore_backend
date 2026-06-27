const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login',  authController.login);
router.get('/me',      verifyToken, authController.getMe);
router.get('/users',   authController.getExternalUsers); // proxy — no token needed on login page

module.exports = router;
