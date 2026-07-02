const itemsService = require('../services/items.service');
const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPool }  = require('../config/db');

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

/**
 * GET /api/items/access-list  (admin only)
 * Returns all active inventory_items, joined with their items-catalog entry + location access list.
 */
const getAccessList = asyncHandler(async (req, res) => {
  const pool = getPool();
  const result = await pool.query(`
    SELECT
      inv.id                  AS inv_id,
      inv.material_code,
      inv.material_name,
      inv.unit,
      inv.available_quantity,
      inv.category,
      inv.status              AS inv_status,
      it.id                   AS item_id,
      it.goes_to_admin,
      COALESCE(
        array_agg(ila.location_name ORDER BY ila.location_name)
          FILTER (WHERE ila.location_name IS NOT NULL),
        '{}'
      )                       AS locations
    FROM inventory_items inv
    LEFT JOIN items it ON LOWER(it.name) = LOWER(inv.material_name)
    LEFT JOIN item_location_access ila ON ila.item_id = it.id
    WHERE inv.status = 'active'
    GROUP BY inv.id, it.id
    ORDER BY inv.material_name
  `);
  res.status(200).json(new ApiResponse(200, result.rows, 'Access list fetched'));
});

/**
 * PUT /api/items/access-list/:inv_id/name  (admin only)
 * Updates material_name in inventory_items AND items catalog (if linked).
 */
const updateAccessItemName = asyncHandler(async (req, res) => {
  const { material_name } = req.body;
  if (!material_name || !material_name.trim()) throw new ApiError(400, 'material_name is required');
  const pool    = getPool();
  const invId   = parseInt(req.params.inv_id, 10);
  const newName = material_name.trim();

  const cur = await pool.query('SELECT material_name, unit FROM inventory_items WHERE id = $1', [invId]);
  if (!cur.rows.length) throw new ApiError(404, 'Inventory item not found');
  const oldName = cur.rows[0].material_name;

  // Update inventory
  await pool.query('UPDATE inventory_items SET material_name = $1, updated_at = NOW() WHERE id = $2', [newName, invId]);
  // Sync items catalog if linked
  await pool.query('UPDATE items SET name = $1 WHERE LOWER(name) = LOWER($2)', [newName, oldName]);

  res.status(200).json(new ApiResponse(200, { material_name: newName }, 'Name updated'));
});

/**
 * PUT /api/items/access-list/:inv_id/locations  (admin only)
 * Updates location access for the inventory item.
 * Auto-creates an items-catalog entry if none exists yet.
 */
const updateAccessItemLocations = asyncHandler(async (req, res) => {
  const { location_names } = req.body;
  if (!Array.isArray(location_names)) throw new ApiError(400, 'location_names must be an array');
  const pool  = getPool();
  const invId = parseInt(req.params.inv_id, 10);

  const invRow = await pool.query('SELECT material_name, unit FROM inventory_items WHERE id = $1', [invId]);
  if (!invRow.rows.length) throw new ApiError(404, 'Inventory item not found');
  const { material_name, unit } = invRow.rows[0];

  // Find or create catalog entry
  let itemRow = await pool.query('SELECT id FROM items WHERE LOWER(name) = LOWER($1)', [material_name]);
  let itemId;
  if (itemRow.rows.length === 0) {
    const created = await pool.query(
      'INSERT INTO items (name, unit, goes_to_admin) VALUES ($1, $2, false) RETURNING id',
      [material_name, unit || 'pcs']
    );
    itemId = created.rows[0].id;
  } else {
    itemId = itemRow.rows[0].id;
  }

  await itemsService.updateItemLocations(itemId, location_names);
  res.status(200).json(new ApiResponse(200, { item_id: itemId }, 'Locations updated'));
});

/**
 * PUT /api/items/access-list/:inv_id/category  (admin only)
 */
const updateAccessItemCategory = asyncHandler(async (req, res) => {
  const { category } = req.body;
  const pool  = getPool();
  const invId = parseInt(req.params.inv_id, 10);
  const cat   = (category || '').trim() || null;
  const row   = await pool.query(
    'UPDATE inventory_items SET category = $1 WHERE id = $2 RETURNING id, category',
    [cat, invId]
  );
  if (!row.rows.length) throw new ApiError(404, 'Inventory item not found');
  res.status(200).json(new ApiResponse(200, row.rows[0], 'Category updated'));
});

/**
 * POST /api/items/access-list/bulk-locations  (admin only)
 * Body: { updates: [{ material_name, location_names }] }
 * Matches inventory items by name (case-insensitive) and sets their locations.
 */
const bulkUpdateAccessLocations = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0)
    throw new ApiError(400, 'updates array is required');

  const pool    = getPool();
  const results = [];

  for (const upd of updates) {
    const locations = Array.isArray(upd.location_names) ? upd.location_names : [];
    const invIdRaw  = upd.inv_id     ? parseInt(upd.inv_id, 10)      : null;
    const code      = (upd.material_code  || '').trim();
    const name      = (upd.material_name  || '').trim();

    // Identify inventory row: prefer inv_id > material_code > material_name
    let invRow;
    if (invIdRaw) {
      invRow = await pool.query(
        "SELECT id, material_name, unit FROM inventory_items WHERE id = $1 AND status = 'active'",
        [invIdRaw]
      );
    } else if (code) {
      invRow = await pool.query(
        "SELECT id, material_name, unit FROM inventory_items WHERE UPPER(material_code) = UPPER($1) AND status = 'active'",
        [code]
      );
    } else if (name) {
      invRow = await pool.query(
        "SELECT id, material_name, unit FROM inventory_items WHERE LOWER(material_name) = LOWER($1) AND status = 'active'",
        [name]
      );
    } else {
      continue;
    }

    if (!invRow || !invRow.rows.length) {
      results.push({ material_name: name || code || String(invIdRaw), status: 'not_found' });
      continue;
    }
    const { id: invId, material_name: matName, unit } = invRow.rows[0];

    // Find or create catalog entry
    let itemRow = await pool.query('SELECT id FROM items WHERE LOWER(name) = LOWER($1)', [matName]);
    let itemId;
    if (!itemRow.rows.length) {
      const created = await pool.query(
        'INSERT INTO items (name, unit, goes_to_admin) VALUES ($1, $2, false) RETURNING id',
        [matName, unit || 'pcs']
      );
      itemId = created.rows[0].id;
    } else {
      itemId = itemRow.rows[0].id;
    }

    await itemsService.updateItemLocations(itemId, locations);
    results.push({ material_name: matName, status: 'updated', locations_count: locations.length });
  }

  res.status(200).json(new ApiResponse(200, results, 'Bulk update complete'));
});

/**
 * GET /api/items/all-locations  (admin only)
 * Returns all distinct location names known to the system (from item_location_access).
 */
const getAllKnownLocations = asyncHandler(async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    'SELECT DISTINCT location_name FROM item_location_access ORDER BY location_name'
  );
  res.status(200).json(new ApiResponse(200, result.rows.map((r) => r.location_name), 'Locations fetched'));
});

module.exports = {
  getItems, createItem, updateItem, getItemLocations, updateItemLocations,
  getAccessList, updateAccessItemName, updateAccessItemLocations, updateAccessItemCategory,
  getAllKnownLocations, bulkUpdateAccessLocations,
};
