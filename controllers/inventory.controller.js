const inventoryService = require('../services/inventory.service');
const ApiResponse      = require('../utils/ApiResponse');
const ApiError         = require('../utils/ApiError');
const asyncHandler     = require('../utils/asyncHandler');


const getAll = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const items = await inventoryService.getAllItems({ search, status });
  res.status(200).json(new ApiResponse(200, items, 'Inventory items fetched'));
});

const getByCode = asyncHandler(async (req, res) => {
  const item = await inventoryService.getItemByCode(req.params.code);
  res.status(200).json(new ApiResponse(200, item, 'Item fetched'));
});

const create = asyncHandler(async (req, res) => {
  const { material_code, material_name, available_quantity, unit, status } = req.body;
  if (!material_code || !material_name) {
    throw new ApiError(400, 'material_code and material_name are required');
  }
  const item = await inventoryService.createItem({ material_code, material_name, available_quantity, unit, status });
  res.status(201).json(new ApiResponse(201, item, 'Item created'));
});

const update = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateItem(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, item, 'Item updated'));
});

const bulkUpsert = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'items array is required and must not be empty');
  }
  if (items.length > 500) {
    throw new ApiError(400, 'Maximum 500 items per bulk upload');
  }
  const result = await inventoryService.bulkUpsert(items);
  res.status(200).json(new ApiResponse(200, { inserted: result.length, items: result }, `${result.length} items processed`));
});

const clearAll = asyncHandler(async (req, res) => {
  const deleted = await inventoryService.clearAll();
  res.status(200).json(new ApiResponse(200, { deleted }, `${deleted} items deleted`));
});

const setStock = asyncHandler(async (req, res) => {
  const { actual_quantity } = req.body;
  if (actual_quantity === undefined || actual_quantity === null) {
    throw new ApiError(400, 'actual_quantity is required');
  }
  const item = await inventoryService.setStock(req.params.id, actual_quantity);
  res.status(200).json(new ApiResponse(200, item, 'Stock updated'));
});

module.exports = { getAll, getByCode, create, update, bulkUpsert, clearAll, setStock };
