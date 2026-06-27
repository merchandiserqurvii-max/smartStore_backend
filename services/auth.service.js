const jwt    = require('jsonwebtoken');
const axios  = require('axios');
const ApiError = require('../utils/ApiError');

const EXTERNAL_USERS_API = 'https://fastapi.qurvii.com/getUsers';

// Normalize location name: take English part before '/', trim, lowercase
// "Shipping Table / ..." -> "shipping table"
// "FashionDesigner"      -> "fashiondesigner"
// "Tailor scan 2"        -> "tailor scan 2"
const normalizeLocation = function(name) {
  return (name || '').split('/')[0].trim().toLowerCase();
};

const STORE_LOCATION_NAME = 'store helper';
const ADMIN_LOCATION_NAME = 'admin';

// Fetch all users from external API
const getExternalUsers = async function() {
  try {
    const response = await axios.get(EXTERNAL_USERS_API, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });
    return (response.data && response.data.data) ? response.data.data : [];
  } catch (err) {
    throw new ApiError(503, 'Unable to reach external user system. Please try again.');
  }
};

// Login: validate user_id + location_id against external API, issue JWT
const login = async function(user_id, location_id) {
  const users = await getExternalUsers();

  const uid = parseInt(user_id, 10);
  const lid = parseInt(location_id, 10);

  const user = users.find(function(u) { return u.id === uid; });
  if (!user) {
    throw new ApiError(401, 'User not found in the system');
  }

  const location = user.locations.find(function(l) { return l.id === lid; });
  if (!location) {
    throw new ApiError(401, 'This location does not belong to the selected user');
  }

  const normLoc  = normalizeLocation(location.name);
  const role     = normLoc === STORE_LOCATION_NAME ? 'store' : 'employee';
  const adminFlag = normLoc === ADMIN_LOCATION_NAME;

  const payload = {
    id:              user.id,
    employee_id:     String(user.id),
    user_name:       user.user_name,
    employee_name:   user.user_name,
    location_id:     location.id,
    location_name:   location.name,
    location_name_en: normLoc,
    work_location:   normLoc,
    department:      normLoc,
    role:            role,
    is_admin:        adminFlag,
  };

  const secret  = process.env.JWT_SECRET    || 'smartstore_secret_key';
  const expires = process.env.JWT_EXPIRES_IN || '8h';
  const token   = jwt.sign(payload, secret, { expiresIn: expires });

  return { token: token, employee: payload };
};

module.exports = { login: login, getExternalUsers: getExternalUsers, normalizeLocation: normalizeLocation };
