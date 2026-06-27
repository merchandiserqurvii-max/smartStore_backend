const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/scan.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/order/:orderId',         verifyToken, ctrl.getOrderDetails);
router.get('/style/:styleNumber',     verifyToken, ctrl.getStyleDetails);
router.get('/accessories/:orderId',   verifyToken, ctrl.getAccessories);
router.post('/record',                verifyToken, ctrl.saveRecord);
router.get('/records',                verifyToken, ctrl.getRecords);

module.exports = router;
