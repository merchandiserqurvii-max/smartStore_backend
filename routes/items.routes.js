const express         = require('express');
const router          = express.Router();
const itemsController = require('../controllers/items.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Any authenticated user can fetch items (filtered by their location_id via query)
router.get('/', verifyToken, itemsController.getItems);

// Admin-only: manage items and their location access
router.post('/',                  verifyToken, isAdmin, itemsController.createItem);
router.put('/:id',                verifyToken, isAdmin, itemsController.updateItem);
router.get('/:id/locations',      verifyToken, isAdmin, itemsController.getItemLocations);
router.put('/:id/locations',      verifyToken, isAdmin, itemsController.updateItemLocations);

module.exports = router;
