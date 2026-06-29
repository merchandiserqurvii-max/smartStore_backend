const express    = require('express');
const router     = express.Router();
const { getPool } = require('../config/db');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// GET /api/store-workers — any authenticated user (used by AssignModal)
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM store_workers ORDER BY name');
  res.status(200).json(new ApiResponse(200, result.rows, 'Workers fetched'));
}));

// POST /api/store-workers — admin only
router.post('/', verifyToken, isAdmin, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'name is required');
  const pool = getPool();
  const result = await pool.query(
    'INSERT INTO store_workers (name) VALUES ($1) RETURNING *',
    [name.trim()]
  );
  res.status(201).json(new ApiResponse(201, result.rows[0], 'Worker added'));
}));

// DELETE /api/store-workers/:id — admin only
router.delete('/:id', verifyToken, isAdmin, asyncHandler(async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    'DELETE FROM store_workers WHERE id = $1 RETURNING *',
    [parseInt(req.params.id, 10)]
  );
  if (!result.rows.length) throw new ApiError(404, 'Worker not found');
  res.status(200).json(new ApiResponse(200, null, 'Worker removed'));
}));

module.exports = router;
