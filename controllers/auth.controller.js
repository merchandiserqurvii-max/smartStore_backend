const authService  = require('../services/auth.service');
const ApiResponse  = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');

/** POST /api/auth/login  { user_id, location_id } */
const login = asyncHandler(async (req, res) => {
  const { user_id, location_id } = req.body;

  if (!user_id || !location_id) {
    throw new ApiError(400, 'user_id and location_id are required');
  }

  const data = await authService.login(user_id, location_id);
  res.status(200).json(new ApiResponse(200, data, 'Login successful'));
});

/** GET /api/auth/me */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'User profile'));
});

/** GET /api/auth/users — proxy to external API (avoids CORS) */
const getExternalUsers = asyncHandler(async (req, res) => {
  const users = await authService.getExternalUsers();
  res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
});

module.exports = { login, getMe, getExternalUsers };
