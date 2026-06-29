const express    = require('express');
const router     = express.Router();
const { getPool } = require('../config/db');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken, isStore } = require('../middleware/auth.middleware');

// GET /api/units — all units
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const pool   = getPool();
  const result = await pool.query('SELECT name FROM units ORDER BY id');
  res.json(new ApiResponse(200, result.rows.map((r) => r.name), 'Units fetched'));
}));

// POST /api/units — create custom unit
router.post('/', verifyToken, isStore, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'unit name required');
  const pool   = getPool();
  const result = await pool.query(
    'INSERT INTO units (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING name',
    [name.trim().toLowerCase()]
  );
  res.status(201).json(new ApiResponse(201, result.rows[0].name, 'Unit created'));
}));

module.exports = router;
