const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/materialRequest.controller');
const { verifyToken, isStore, isAdmin } = require('../middleware/auth.middleware');

router.post('/',                  verifyToken,           ctrl.create);
router.get('/my-requests',        verifyToken,           ctrl.getMyRequests);
router.get('/store/requests',     verifyToken, isStore,  ctrl.getStoreRequests);
router.get('/store/summary',      verifyToken, isStore,  ctrl.getTodaySummary);
router.get('/admin/requests',     verifyToken, isAdmin,  ctrl.getAdminRequests);
router.put('/:id/accept',         verifyToken,           ctrl.acceptRequest);  // store or admin
router.put('/:id/issue',          verifyToken,           ctrl.issueRequest);   // store or admin
router.put('/:id/received',       verifyToken,           ctrl.markReceived);
router.get('/report',             verifyToken, isAdmin,  ctrl.getReport);

module.exports = router;
