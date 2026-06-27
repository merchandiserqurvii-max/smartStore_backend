const itemsService = require('../services/items.service');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/items?location_name=shipping+table  OR  /api/items (all) */
const getItems = asyncHandler(async (req, res) => {
  const { location_name } = req.query;
  const items = location_name
    ? await itemsService.getItemsForLocation(location_name)   // normalizes internally
    : await itemsService.getAllItems();
  res.status(200).json(new ApiResponse(200, items, 'Items fetched'));
});

/** POST /api/items  (admin only) */
const createItem = asyncHandler(async (req, res) => {
  const { name, image_url, unit, goes_to_admin } = req.body;
  if (!name) throw new ApiError(400, 'name is required');
  const item = await itemsService.createItem({ name, image_url, unit, goes_to_admin });
  res.status(201).json(new ApiResponse(201, item, 'Item created'));
});

/** PUT /api/items/:id  (admin only) */
const updateItem = asyncHandler(async (req, res) => {
  const { name, image_url, unit, status, goes_to_admin } = req.body;
  const item = await itemsService.updateItem(req.params.id, { name, image_url, unit, status, goes_to_admin });
  res.status(200).json(new ApiResponse(200, item, 'Item updated'));
});

/** GET /api/items/:id/locations  (admin only) */
const getItemLocations = asyncHandler(async (req, res) => {
  const locations = await itemsService.getItemLocations(req.params.id);
  res.status(200).json(new ApiResponse(200, locations, 'Item locations fetched'));
});

/** PUT /api/items/:id/locations  (admin only) — body: { location_names: ['shipping table', ...] } */
const updateItemLocations = asyncHandler(async (req, res) => {
  const { location_names } = req.body;
  if (!Array.isArray(location_names)) throw new ApiError(400, 'location_names must be an array');
  await itemsService.updateItemLocations(req.params.id, location_names);
  res.status(200).json(new ApiResponse(200, null, 'Item locations updated'));
});

module.exports = { getItems, createItem, updateItem, getItemLocations, updateItemLocations };
