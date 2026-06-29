const express             = require('express');
const router              = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isStore, isAdmin } = require('../middleware/auth.middleware');

router.get('/',               verifyToken,           inventoryController.getAll);
router.post('/',              verifyToken, isStore,   inventoryController.create);
router.post('/bulk',          verifyToken, isStore,   inventoryController.bulkUpsert);
router.delete('/all',         verifyToken, isAdmin,   inventoryController.clearAll);   // ← admin only, before /:id
router.get('/:code',          verifyToken,            inventoryController.getByCode);
router.put('/:id',            verifyToken, isStore,   inventoryController.update);
router.put('/:id/stock',      verifyToken, isStore,   inventoryController.setStock);
router.delete('/:id',         verifyToken, isAdmin,   inventoryController.deleteOne);  // single item, admin only

module.exports = router;
