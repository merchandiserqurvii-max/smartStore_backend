const { getPool }       = require('../config/db');
const ApiError          = require('../utils/ApiError');
const generateRequestId = require('../utils/generateRequestId');

/**
 * Create a new material request.
 * If inventory stock >= requested qty → auto-accept immediately.
 * Returns { request, autoAccepted }
 */
const createRequest = async (data) => {
  const pool = getPool();
  const client = await pool.connect();
  const {
    employee_id, employee_name, department, work_location,
    item_id, material_code, material_name, quantity, unit, style_number, notes, destination,
  } = data;

  try {
    await client.query('BEGIN');

    const request_id = generateRequestId();

    // Insert with Pending status
    const insertResult = await client.query(
      `INSERT INTO material_requests
         (request_id, employee_id, employee_name, department, work_location,
          material_code, material_name, quantity, unit, status, style_number, notes,
          destination, item_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending',$10,$11,$12,$13)
       RETURNING *`,
      [request_id, employee_id, employee_name, department || work_location, work_location,
       material_code || null, material_name, quantity, unit || 'pcs',
       style_number || null, notes || null,
       destination || 'store', item_id || null]
    );
    let req = insertResult.rows[0];
    let autoAccepted = false;

    // ── Auto-accept if stock is sufficient (only for inventory-backed requests) ──
    const invResult = req.material_code ? await client.query(
      'SELECT available_quantity FROM inventory_items WHERE material_code = $1',
      [req.material_code]
    ) : { rows: [] };

    if (
      invResult.rows.length > 0 &&
      Number(invResult.rows[0].available_quantity) >= Number(req.quantity)
    ) {
      const autoResult = await client.query(
        `UPDATE material_requests
         SET status = 'Accepted', accepted_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [req.id]
      );
      req = autoResult.rows[0];
      autoAccepted = true;
    }

    await client.query('COMMIT');
    return { request: req, autoAccepted };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getMyRequests = async (employee_id, { status, limit = 50 }) => {
  const pool   = getPool();
  let   query  = 'SELECT * FROM material_requests WHERE employee_id = $1';
  const params = [employee_id];
  let   idx    = 2;

  if (status) {
    query += ` AND status = $${idx++}`;
    params.push(status);
  }
  query += ` ORDER BY created_at DESC LIMIT $${idx}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

const getStoreRequests = async ({ status, department, work_location, date, search, limit = 100 }) => {
  const pool   = getPool();
  // Store only sees destination='store' requests; admin items route to admin queue
  let   query  = "SELECT * FROM material_requests WHERE destination = 'store'";
  const params = [];
  let   idx    = 1;

  if (status) {
    query += ` AND status = $${idx++}`;
    params.push(status);
  }
  if (department) {
    query += ` AND department ILIKE $${idx++}`;
    params.push(`%${department}%`);
  }
  if (work_location) {
    query += ` AND work_location = $${idx++}`;
    params.push(work_location);
  }
  if (date) {
    query += ` AND DATE(created_at) = $${idx++}`;
    params.push(date);
  }
  if (search) {
    query += ` AND (employee_name ILIKE $${idx} OR material_name ILIKE $${idx} OR request_id ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${idx}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

const getTodaySummary = async () => {
  const pool   = getPool();
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'Pending')   AS pending,
       COUNT(*) FILTER (WHERE status = 'Accepted')  AS accepted,
       COUNT(*) FILTER (WHERE status = 'Issued')    AS issued,
       COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
       COUNT(*)                                      AS total
     FROM material_requests
     WHERE DATE(created_at) = CURRENT_DATE`
  );
  return result.rows[0];
};

const acceptRequest = async (id) => {
  const pool   = getPool();
  const result = await pool.query(
    `UPDATE material_requests
     SET status = 'Accepted', accepted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'Pending'
     RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Request not found or already processed');
  }
  return result.rows[0];
};

const issueRequest = async (id) => {
  const pool   = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE material_requests
       SET status = 'Issued', issued_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'Accepted'
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Request not found or not in Accepted state');
    }
    const req = result.rows[0];

    // Decrement inventory (floor at 0)
    await client.query(
      `UPDATE inventory_items
       SET available_quantity = GREATEST(0, available_quantity - $1),
           updated_at = NOW()
       WHERE material_code = $2`,
      [req.quantity, req.material_code]
    );

    await client.query('COMMIT');
    return req;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Employee marks material as received → status Issued → Completed.
 */
const markReceived = async (id, employee_id) => {
  const pool   = getPool();
  const result = await pool.query(
    `UPDATE material_requests
     SET status = 'Completed', completed_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND employee_id = $2 AND status = 'Issued'
     RETURNING *`,
    [id, employee_id]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Request not found or not in Issued state');
  }
  return result.rows[0];
};

/**
 * Get requests destined for admin (IT/admin items).
 * Visible only to users with location_id = 151.
 */
const getAdminRequests = async ({ status, search, limit = 100 }) => {
  const pool   = getPool();
  let   query  = "SELECT * FROM material_requests WHERE destination = 'admin'";
  const params = [];
  let   idx    = 1;

  if (status) {
    query += ` AND status = $${idx++}`;
    params.push(status);
  }
  if (search) {
    query += ` AND (employee_name ILIKE $${idx} OR material_name ILIKE $${idx} OR request_id ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${idx}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

module.exports = {
  createRequest, getMyRequests, getStoreRequests, getAdminRequests,
  getTodaySummary, acceptRequest, issueRequest, markReceived,
};
