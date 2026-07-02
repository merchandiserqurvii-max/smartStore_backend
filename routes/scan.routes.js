const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scan.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/order/:orderId',         verifyToken, ctrl.getOrderDetails);
router.get('/style/:styleNumber',     verifyToken, ctrl.getStyleDetails);
router.get('/accessories/:orderId',   verifyToken, ctrl.getAccessories);
router.post('/record',                verifyToken, ctrl.saveRecord);
router.get('/records',                verifyToken, ctrl.getRecords);

// Cutting masters management
router.get('/cutting-masters',        verifyToken, ctrl.getCuttingMasters);
router.post('/cutting-masters',       verifyToken, isAdmin, ctrl.addCuttingMaster);
router.delete('/cutting-masters/:id', verifyToken, isAdmin, ctrl.deleteCuttingMaster);

module.exports = router;
