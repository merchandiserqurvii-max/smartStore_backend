const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/materialRequest.controller');
const { verifyToken, isStore, isAdmin } = require('../middleware/auth.middleware');

router.post('/',                  verifyToken,           ctrl.create);
router.post('/bulk',              verifyToken,           ctrl.createBulk);
router.get('/my-requests',        verifyToken,           ctrl.getMyRequests);
router.get('/store/requests',     verifyToken, isStore,  ctrl.getStoreRequests);
router.get('/store/summary',      verifyToken, isStore,  ctrl.getTodaySummary);
router.get('/admin/requests',     verifyToken, isAdmin,  ctrl.getAdminRequests);
router.put('/:id/accept',         verifyToken,           ctrl.acceptRequest);
router.put('/:id/issue',          verifyToken,           ctrl.issueRequest);
router.put('/:id/received',       verifyToken,           ctrl.markReceived);
router.put('/:id/assign',         verifyToken, isStore,  ctrl.assignTask);
router.get('/report',             verifyToken, isAdmin,  ctrl.getReport);
router.delete('/all',             verifyToken, isAdmin,  ctrl.clearAllRequests);

module.exports = router;
