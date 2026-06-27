const { getPool } = require('../config/db');

const createNotification = async ({ request_id, employee_name, department, work_location, material_name, quantity, unit }) => {
  const pool    = getPool();
  const message = `${employee_name} (${work_location}) requested ${quantity} ${unit} of ${material_name}`;

  const result = await pool.query(
    `INSERT INTO notifications (request_id, message, employee_name, department, work_location, material_name, quantity, unit)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [request_id, message, employee_name, department, work_location, material_name, quantity, unit || 'pcs']
  );
  return result.rows[0];
};

const getNotifications = async ({ is_read, limit = 50 }) => {
  const pool   = getPool();
  let   query  = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];
  let   idx    = 1;

  if (is_read !== undefined && is_read !== null) {
    query += ` AND is_read = $${idx++}`;
    params.push(is_read === 'true' || is_read === true);
  }

  query += ` ORDER BY created_at DESC LIMIT $${idx}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

const markAllRead = async () => {
  const pool = getPool();
  await pool.query(`UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE`);
};

const getUnreadCount = async () => {
  const pool   = getPool();
  const result = await pool.query(`SELECT COUNT(*) AS count FROM notifications WHERE is_read = FALSE`);
  return parseInt(result.rows[0].count, 10);
};

module.exports = { createNotification, getNotifications, markAllRead, getUnreadCount };
