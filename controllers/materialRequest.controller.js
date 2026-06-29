const requestService      = require('../services/materialRequest.service');
const itemsService        = require('../services/items.service');
const notificationService = require('../services/notification.service');
const ApiResponse         = require('../utils/ApiResponse');
const ApiError            = require('../utils/ApiError');
const { getPool }         = require('../config/db');
const asyncHandler        = require('../utils/asyncHandler');

// Create request — supports both item_id-based and material_code-based requests
const create = asyncHandler(async (req, res) => {
  const { item_id, material_code, material_name, quantity, unit, style_number, notes } = req.body;

  if ((!item_id && !material_name) || !quantity) {
    throw new ApiError(400, 'material_name (or item_id) and quantity are required');
  }
  if (quantity <= 0) {
    throw new ApiError(400, 'Quantity must be greater than 0');
  }

  const { employee_id, employee_name, department, work_location } = req.user;

  // If item_id provided, fetch item details to get name, unit, destination
  let resolvedName   = material_name;
  let resolvedUnit   = unit;
  let destination    = 'store';

  if (item_id) {
    const allItems  = await itemsService.getAllItems();
    const item      = allItems.find((i) => i.id === parseInt(item_id, 10));
    if (!item) throw new ApiError(404, 'Item not found');
    resolvedName  = item.name;
    resolvedUnit  = item.unit;
    destination   = item.goes_to_admin ? 'admin' : 'store';
  }

  const { request: newRequest, autoAccepted } = await requestService.createRequest({
    employee_id, employee_name,
    department:    department || work_location,
    work_location,
    item_id:       item_id   || null,
    material_code: material_code || null,
    material_name: resolvedName,
    quantity, unit: resolvedUnit || unit || 'pcs',
    style_number, notes, destination,
  });

  const notification = await notificationService.createNotification({
    request_id:    newRequest.request_id,
    employee_name: newRequest.employee_name,
    department:    newRequest.department,
    work_location: newRequest.work_location,
    material_name: newRequest.material_name,
    quantity:      newRequest.quantity,
    unit:          newRequest.unit,
  });

  const io = req.app.get('io');
  if (io) {
    if (destination === 'store') {
      io.to('store-room').emit('new-request', { request: newRequest, notification, autoAccepted });
    } else {
      // Admin items: notify admin room
      io.to('admin-room').emit('new-request', { request: newRequest, notification, autoAccepted });
    }
    if (autoAccepted) {
      io.emit('request-updated', newRequest);
    }
  }

  res.status(201).json(new ApiResponse(201, newRequest, autoAccepted
    ? 'Material request created and auto-accepted (stock sufficient)'
    : 'Material request created'
  ));
});

const getMyRequests = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;
  const requests = await requestService.getMyRequests(req.user.employee_id, { status, limit });
  res.status(200).json(new ApiResponse(200, requests, 'Requests fetched'));
});

const getStoreRequests = asyncHandler(async (req, res) => {
  const { status, department, work_location, date, search, limit } = req.query;
  const requests = await requestService.getStoreRequests({ status, department, work_location, date, search, limit });
  res.status(200).json(new ApiResponse(200, requests, 'Store requests fetched'));
});

const getAdminRequests = asyncHandler(async (req, res) => {
  const { status, search, limit } = req.query;
  const requests = await requestService.getAdminRequests({ status, search, limit });
  res.status(200).json(new ApiResponse(200, requests, 'Admin requests fetched'));
});

const getTodaySummary = asyncHandler(async (req, res) => {
  const summary = await requestService.getTodaySummary();
  res.status(200).json(new ApiResponse(200, summary, 'Today summary'));
});

const acceptRequest = asyncHandler(async (req, res) => {
  const updated = await requestService.acceptRequest(req.params.id);
  const io = req.app.get('io');
  if (io) io.emit('request-updated', updated);
  res.status(200).json(new ApiResponse(200, updated, 'Request accepted'));
});

const issueRequest = asyncHandler(async (req, res) => {
  const updated = await requestService.issueRequest(req.params.id);
  const io = req.app.get('io');
  if (io) {
    io.emit('request-updated', updated);
    io.to(`user-${updated.employee_id}`).emit('request-updated', updated);
  }
  res.status(200).json(new ApiResponse(200, updated, 'Material issued'));
});

// Employee marks material as received
const markReceived = asyncHandler(async (req, res) => {
  const updated = await requestService.markReceived(req.params.id, req.user.employee_id);
  const io = req.app.get('io');
  if (io) {
    io.emit('request-updated', updated);
  }
  res.status(200).json(new ApiResponse(200, updated, 'Marked as received'));
});



// GET /api/material-request/report  — Admin: all requests datewise with analytics
const getReport = asyncHandler(async (req, res) => {
  const pool = getPool();
  const { date_from, date_to, work_location, limit } = req.query;

  const conditions = [];
  const values     = [];
  let   idx        = 1;

  if (date_from)     { conditions.push('created_at >= $' + idx++); values.push(date_from); }
  if (date_to)       { conditions.push('created_at <= $' + idx++); values.push(date_to); }
  if (work_location) { conditions.push('work_location ILIKE $' + idx++); values.push('%' + work_location + '%'); }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const maxRows = parseInt(limit) || 1000;

  // All requests
  const rowsRes = await pool.query(
    'SELECT request_id, employee_name, work_location, material_name, quantity, unit, status, destination, style_number, notes, created_at' +
    ' FROM material_requests' + where +
    ' ORDER BY created_at DESC LIMIT $' + idx,
    values.concat([maxRows])
  );

  // Item usage summary
  const summaryRes = await pool.query(
    'SELECT material_name, SUM(quantity) AS total_qty, COUNT(*) AS total_requests,' +
    '  COUNT(CASE WHEN status=\'Issued\' OR status=\'Received\' THEN 1 END) AS fulfilled' +
    ' FROM material_requests' + where +
    ' GROUP BY material_name ORDER BY total_requests DESC LIMIT 30',
    values
  );

  // Top employees
  const empRes = await pool.query(
    'SELECT employee_name, work_location, COUNT(*) AS total_requests, SUM(quantity) AS total_qty' +
    ' FROM material_requests' + where +
    ' GROUP BY employee_name, work_location ORDER BY total_requests DESC LIMIT 20',
    values
  );

  res.status(200).json(new ApiResponse(200, {
    rows:       rowsRes.rows,
    item_summary: summaryRes.rows,
    emp_summary:  empRes.rows,
  }, 'Report fetched'));
});

// POST /api/material-request/bulk — Create multiple requests at once (cart checkout)
const createBulk = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'items array required');
  }
  const { employee_id, employee_name, department, work_location } = req.user;
  const userData = { employee_id, employee_name, department: department || work_location, work_location };
  const allItems = await itemsService.getAllItems();
  const io       = req.app.get('io');
  const results  = [];

  // Pre-validate stock for all store items
  const pool = getPool();
  for (const entry of items) {
    const { item_id, quantity } = entry;
    if (!item_id || !quantity) continue;
    const item = allItems.find((i) => i.id === parseInt(item_id, 10));
    if (!item || item.goes_to_admin) continue; // admin items skip stock check
    const invRow = await pool.query(
      'SELECT available_quantity FROM inventory_items WHERE LOWER(material_name) = LOWER($1) AND status = $2',
      [item.name, 'active']
    );
    if (invRow.rows.length > 0) {
      const available = Number(invRow.rows[0].available_quantity);
      if (available < Number(quantity)) {
        throw new ApiError(400, `"${item.name}" mein sirf ${available} ${item.unit} available hai. Aapne ${quantity} request kiya.`);
      }
    }
  }

  for (const entry of items) {
    const { item_id, quantity, notes } = entry;
    if (!item_id || !quantity) continue;
    const item = allItems.find((i) => i.id === parseInt(item_id, 10));
    if (!item) continue;
    const destination = item.goes_to_admin ? 'admin' : 'store';
    const { request: newReq, autoAccepted } = await requestService.createRequest({
      ...userData,
      item_id:       item.id,
      material_name: item.name,
      quantity,
      unit:          item.unit,
      notes:         notes || null,
      destination,
    });
    if (io) {
      const room = destination === 'store' ? 'store-room' : 'admin-room';
      io.to(room).emit('new-request', { request: newReq, autoAccepted });
      if (autoAccepted) io.emit('request-updated', newReq);
    }
    results.push(newReq);
  }

  res.status(201).json(new ApiResponse(201, results, `${results.length} request(s) created`));
});

// PUT /api/material-request/:id/assign — Assign task to an employee before printing
const assignTask = asyncHandler(async (req, res) => {
  const { assigned_to_name } = req.body;
  if (!assigned_to_name) throw new ApiError(400, 'assigned_to_name required');
  const updated = await requestService.assignTask(req.params.id, assigned_to_name);
  const io = req.app.get('io');
  if (io) io.emit('request-updated', updated);
  res.status(200).json(new ApiResponse(200, updated, 'Task assigned'));
});

// DELETE /api/material-request/all  — Admin: wipe all requests + notifications
const clearAllRequests = asyncHandler(async (req, res) => {
  const pool = getPool();
  await pool.query('TRUNCATE TABLE material_requests RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE notifications    RESTART IDENTITY CASCADE');
  res.status(200).json(new ApiResponse(200, null, 'All requests and notifications deleted'));
});

module.exports = {
  create, createBulk, getMyRequests, getStoreRequests, getAdminRequests,
  getTodaySummary, acceptRequest, issueRequest, markReceived, getReport, assignTask,
  clearAllRequests,
};
