const express             = require('express');
const router              = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, isStore } = require('../middleware/auth.middleware');

router.get('/',               verifyToken,          inventoryController.getAll);
router.post('/',              verifyToken, isStore,  inventoryController.create);
router.post('/bulk',          verifyToken, isStore,  inventoryController.bulkUpsert);
router.delete('/all',         verifyToken, isStore,  inventoryController.clearAll);   // ← before /:id
router.get('/:code',          verifyToken,           inventoryController.getByCode);
router.put('/:id',            verifyToken, isStore,  inventoryController.update);
router.put('/:id/stock',      verifyToken, isStore,  inventoryController.setStock);   // stock reset

module.exports = router;
