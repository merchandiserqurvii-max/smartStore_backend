const { getPool } = require('../config/db');
const ApiError    = require('../utils/ApiError');

// Normalize a location name to English-only lowercase
// "Shipping Table / ..."  -> "shipping table"
// "Cuting Helper / ..."   -> "cuting helper"
// "FashionDesigner"       -> "fashiondesigner"
const normalizeLocation = function(name) {
  return (name || '').split('/')[0].trim().toLowerCase();
};

// Return all active items accessible for the given location name
const getItemsForLocation = async function(location_name) {
  var pool       = getPool();
  var normalized = normalizeLocation(location_name);

  var result = await pool.query(
    'SELECT i.*' +
    ' FROM items i' +
    ' JOIN item_location_access ila ON ila.item_id = i.id' +
    ' WHERE ila.location_name = $1' +
    '   AND i.status = $2' +
    ' ORDER BY i.goes_to_admin, i.name',
    [normalized, 'active']
  );
  return result.rows;
};

// Return ALL items (admin view)
const getAllItems = async function() {
  var pool = getPool();
  var result = await pool.query('SELECT * FROM items ORDER BY goes_to_admin, name');
  return result.rows;
};

// Return location_names that have access to an item
const getItemLocations = async function(item_id) {
  var pool = getPool();
  var result = await pool.query(
    'SELECT location_name FROM item_location_access WHERE item_id = $1 ORDER BY location_name',
    [parseInt(item_id, 10)]
  );
  return result.rows.map(function(r) { return r.location_name; });
};

// Replace an item's location access list
const updateItemLocations = async function(item_id, location_names) {
  var pool   = getPool();
  var client = await pool.connect();
  var id     = parseInt(item_id, 10);

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM item_location_access WHERE item_id = $1', [id]);

    if (Array.isArray(location_names) && location_names.length > 0) {
      for (var i = 0; i < location_names.length; i++) {
        var nm = normalizeLocation(location_names[i]);
        await client.query(
          'INSERT INTO item_location_access (item_id, location_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, nm]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Update item details
const updateItem = async function(id, opts) {
  var name          = opts.name;
  var image_url     = opts.image_url;
  var unit          = opts.unit;
  var status        = opts.status;
  var goes_to_admin = opts.goes_to_admin;

  var pool   = getPool();
  var result = await pool.query(
    'UPDATE items' +
    '   SET name          = COALESCE($2, name),' +
    '       image_url     = COALESCE($3, image_url),' +
    '       unit          = COALESCE($4, unit),' +
    '       status        = COALESCE($5, status),' +
    '       goes_to_admin = COALESCE($6, goes_to_admin)' +
    ' WHERE id = $1' +
    ' RETURNING *',
    [parseInt(id, 10), name, image_url, unit, status,
     goes_to_admin != null ? goes_to_admin : null]
  );

  if (result.rows.length === 0) throw new ApiError(404, 'Item not found');
  return result.rows[0];
};

// Create a new item
const createItem = async function(opts) {
  var name          = opts.name;
  var image_url     = opts.image_url;
  var unit          = opts.unit;
  var goes_to_admin = opts.goes_to_admin;

  var pool   = getPool();
  var result = await pool.query(
    'INSERT INTO items (name, image_url, unit, goes_to_admin)' +
    ' VALUES ($1, $2, $3, $4)' +
    ' RETURNING *',
    [name, image_url || null, unit || 'pcs', goes_to_admin || false]
  );
  return result.rows[0];
};

module.exports = {
  getItemsForLocation: getItemsForLocation,
  getAllItems:         getAllItems,
  getItemLocations:   getItemLocations,
  updateItemLocations: updateItemLocations,
  updateItem:         updateItem,
  createItem:         createItem,
};
