const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/notification.controller');
const { verifyToken, isStore } = require('../middleware/auth.middleware');

router.get('/',            verifyToken, isStore, ctrl.getAll);
router.get('/unread-count', verifyToken, isStore, ctrl.getUnreadCount);
router.put('/mark-read',   verifyToken, isStore, ctrl.markRead);

module.exports = router;
