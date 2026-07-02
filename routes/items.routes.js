const express         = require('express');
const router          = express.Router();
const itemsController = require('../controllers/items.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Any authenticated user — fetch items filtered by location
router.get('/',    verifyToken, itemsController.getItems);

// ── Admin: access-list (must be before /:id to avoid conflict) ──────────
router.get('/access-list',                              verifyToken, isAdmin, itemsController.getAccessList);
router.get('/all-locations',                            verifyToken, isAdmin, itemsController.getAllKnownLocations);
router.post('/access-list/bulk-locations',              verifyToken, isAdmin, itemsController.bulkUpdateAccessLocations);
router.put('/access-list/:inv_id/name',                 verifyToken, isAdmin, itemsController.updateAccessItemName);
router.put('/access-list/:inv_id/locations',            verifyToken, isAdmin, itemsController.updateAccessItemLocations);

// ── Admin: item catalog management ──────────────────────────────────────
router.post('/',              verifyToken, isAdmin, itemsController.createItem);
router.put('/:id',            verifyToken, isAdmin, itemsController.updateItem);
router.get('/:id/locations',  verifyToken, isAdmin, itemsController.getItemLocations);
router.put('/:id/locations',  verifyToken, isAdmin, itemsController.updateItemLocations);

module.exports = router;
