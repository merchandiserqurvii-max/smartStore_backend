const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/style.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/:styleNumber', verifyToken, ctrl.getStyleDetails);

module.exports = router;
