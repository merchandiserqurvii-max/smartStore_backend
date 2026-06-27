const jwt      = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const verifyToken = function(req, res, next) {
  var authHeader = req.headers['authorization'];
  var token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new ApiError(401, 'Access token is required'));
  }

  try {
    var secret  = process.env.JWT_SECRET || 'smartstore_secret_key';
    var decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

var isStore = function(req, res, next) {
  if (req.user && req.user.role === 'store') {
    return next();
  }
  return next(new ApiError(403, 'Access restricted to Store employees'));
};

var isAdmin = function(req, res, next) {
  if (req.user && (req.user.is_admin || req.user.location_name_en === 'admin')) {
    return next();
  }
  return next(new ApiError(403, 'Access restricted to Admin'));
};

module.exports = { verifyToken: verifyToken, isStore: isStore, isAdmin: isAdmin };
