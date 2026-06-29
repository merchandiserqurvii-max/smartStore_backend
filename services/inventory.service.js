const { getPool } = require('../config/db');
const ApiError    = require('../utils/ApiError');

const getAllItems = async ({ search, status, low_stock }) => {
  const pool  = getPool();
  let   query = 'SELECT * FROM inventory_items WHERE 1=1';
  const params = [];
  let   idx    = 1;

  if (status) {
    query += ` AND status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    query += ` AND (material_name ILIKE $${idx} OR CAST(material_code AS TEXT) ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  if (low_stock === 'true' || low_stock === true) {
    query += ' AND available_quantity <= min_quantity';
  }

  query += ' ORDER BY material_name ASC';
  const result = await pool.query(query, params);
  return result.rows;
};

const getItemByCode = async (material_code) => {
  const pool   = getPool();
  const result = await pool.query(
    'SELECT * FROM inventory_items WHERE material_code = $1',
    [material_code]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, `Material not found: ${material_code}`);
  }
  return result.rows[0];
};

const createItem = async ({ material_code, material_name, available_quantity, unit, status, min_quantity }) => {
  const pool   = getPool();
  const result = await pool.query(
    `INSERT INTO inventory_items (material_code, material_name, available_quantity, unit, status, min_quantity)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [material_code, material_name, available_quantity || 0, unit || 'pcs', status || 'active', min_quantity || 0]
  );
  return result.rows[0];
};

const updateItem = async (id, fields) => {
  const pool    = getPool();
  const allowed = ['material_name', 'available_quantity', 'unit', 'status', 'min_quantity'];
  const updates = [];
  const values  = [];
  let   idx     = 1;

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      updates.push(`${key} = $${idx++}`);
      values.push(fields[key]);
    }
  });

  if (updates.length === 0) {
    throw new ApiError(400, 'No valid fields provided for update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Inventory item not found');
  }
  return result.rows[0];
};

/**
 * Bulk upsert inventory items.
 * If material_code already exists → update quantity & name.
 * If new → insert.
 */
const bulkUpsert = async (items) => {
  const pool    = getPool();
  const client  = await pool.connect();
  const results = [];
  try {
    await client.query('BEGIN');
    for (const item of items) {
      const { material_code, material_name, available_quantity, unit, status, min_quantity } = item;
      if (!material_code || !material_name) continue;
      const validStatus = ['active', 'inactive'].includes((status || '').toLowerCase()) ? status.toLowerCase() : 'active';
      const r = await client.query(
        `INSERT INTO inventory_items (material_code, material_name, available_quantity, unit, status, min_quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (material_code) DO UPDATE
           SET material_name      = EXCLUDED.material_name,
               available_quantity = inventory_items.available_quantity + EXCLUDED.available_quantity,
               status             = EXCLUDED.status,
               min_quantity       = EXCLUDED.min_quantity,
               updated_at         = NOW()
         RETURNING *`,
        [parseInt(material_code, 10), material_name.toString().trim(), parseFloat(available_quantity) || 0, (unit || 'pcs').toString().trim(), validStatus, parseFloat(min_quantity) || 0]
      );
      results.push(r.rows[0]);
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Delete ALL inventory records.
 */
const clearAll = async () => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM inventory_items');
  return result.rowCount;
};

/**
 * Set (reset) the actual stock quantity of a single item.
 * Unlike updateItem, this only touches available_quantity.
 */
const setStock = async (id, actual_quantity) => {
  const pool = getPool();
  if (actual_quantity === undefined || actual_quantity === null || actual_quantity < 0) {
    throw new ApiError(400, 'actual_quantity must be a non-negative number');
  }
  const result = await pool.query(
    `UPDATE inventory_items
        SET available_quantity = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *`,
    [parseFloat(actual_quantity), id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Inventory item not found');
  return result.rows[0];
};

module.exports = { getAllItems, getItemByCode, createItem, updateItem, bulkUpsert, clearAll, setStock };
