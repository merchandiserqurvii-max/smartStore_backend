var axios        = require('axios');
var getPool      = require('../config/db').getPool;
var ApiResponse  = require('../utils/ApiResponse');
var ApiError     = require('../utils/ApiError');
var asyncHandler = require('../utils/asyncHandler');

var NOCODB_TOKEN   = 'QXOzKHJ982NgA2AIc8jDqK0lC5CdWEcCwacCIsaJ';
var NOCODB_BASE    = 'https://nocodb.qurvii.com/api/v2/tables';
var STYLEWISE_BASE = 'https://stylewise-backend-uqx8.onrender.com/api/v1/stylewise/regular-style/style-details';
var CUTTING_MASTER_LOCATION_ID = 128;

// Normalize name: "Sudhan / सुधन" -> "Sudhan"
function normalizeName(name) {
  return (name || '').split('/')[0].trim();
}

// GET /api/scan/order/:orderId
// Returns: order_id, style_number, size, channel, cutting_master, raw_list
var getOrderDetails = asyncHandler(async function(req, res) {
  var orderId = req.params.orderId;

  var response = await axios.get(NOCODB_BASE + '/m9lzzdoc2x4zxun/records', {
    params: {
      offset: '0',
      limit:  '50',
      where:  '(order_id,eq,' + orderId + ')'
    },
    headers: { 'xc-token': NOCODB_TOKEN },
    timeout: 15000
  });

  var list = (response.data && response.data.list) ? response.data.list : [];
  if (list.length === 0) {
    throw new ApiError(404, 'Order ' + orderId + ' not found');
  }

  // style_number is a direct field on each record (not nested)
  var first       = list[0];
  var styleNumber = first.style_number ? String(first.style_number) : null;
  var size        = first.size    || first.Size    || '';
  var channel     = first.channel || first.Channel || '';
  var color       = first.color   || first.Color   || '';

  // Cutting master: query scan-tracking table separately with viewId that has linked records
  var cuttingMaster = '';
  try {
    var trackRes = await axios.get(NOCODB_BASE + '/m9lzzdoc2x4zxun/records', {
      params: {
        offset:  '0',
        limit:   '50',
        where:   '(order_id,eq,' + orderId + ')',
        viewId:  'vwwsae9mswybppcm'
      },
      headers: { 'xc-token': NOCODB_TOKEN },
      timeout: 10000
    });
    var trackList = (trackRes.data && trackRes.data.list) ? trackRes.data.list : [];
    var cmRecords = trackList.filter(function(r) {
      return r.user_location_id === CUTTING_MASTER_LOCATION_ID ||
        (r.locations && r.locations.id === CUTTING_MASTER_LOCATION_ID);
    });
    cmRecords.sort(function(a, b) {
      return new Date(b.scanned_timestamp) - new Date(a.scanned_timestamp);
    });
    if (cmRecords.length > 0) {
      var rawName = cmRecords[0].employees && cmRecords[0].employees.user_name
        ? cmRecords[0].employees.user_name : '';
      cuttingMaster = normalizeName(rawName);
    }
  } catch(e) {
    console.log('[scan] cutting master lookup failed:', e.message);
  }

  if (!styleNumber) throw new ApiError(404, 'Style number not found for order ' + orderId);

  res.status(200).json(new ApiResponse(200, {
    order_id:       String(orderId),
    style_number:   styleNumber,
    size:           size,
    channel:        channel,
    color:          color,
    cutting_master: cuttingMaster,
  }, 'Order fetched'));
});

// GET /api/scan/style/:styleNumber
var getStyleDetails = asyncHandler(async function(req, res) {
  var styleNumber = req.params.styleNumber;
  var response = await axios.get(STYLEWISE_BASE, {
    params:  { styleNumber: styleNumber },
    timeout: 20000
  });
  var data = (response.data && response.data.data) ? response.data.data : [];
  if (data.length === 0) throw new ApiError(404, 'Style ' + styleNumber + ' not found');
  res.status(200).json(new ApiResponse(200, data[0], 'Style fetched'));
});

// GET /api/scan/accessories/:orderId
var getAccessories = asyncHandler(async function(req, res) {
  var orderId = req.params.orderId;
  var response = await axios.get(NOCODB_BASE + '/misuaa9cvim4h13/records', {
    params: {
      offset:  '0',
      limit:   '25',
      where:   '(order_id,eq,' + orderId + ')',
      viewId:  'vwx3yogyd9jcoqbk'
    },
    headers: { 'xc-token': NOCODB_TOKEN },
    timeout: 15000
  });
  var list = (response.data && response.data.list) ? response.data.list : [];
  res.status(200).json(new ApiResponse(200, list, 'Accessories fetched'));
});

// POST /api/scan/record  — save scan record for datewise reporting
var saveRecord = asyncHandler(async function(req, res) {
  var order_id     = req.body.order_id;
  var style_number = req.body.style_number;
  var size         = req.body.size;
  var channel      = req.body.channel;
  var record_type  = req.body.record_type;
  var record_data  = req.body.record_data;

  if (!order_id || !record_type) {
    throw new ApiError(400, 'order_id and record_type are required');
  }

  var pool   = getPool();
  var result = await pool.query(
    'INSERT INTO scan_records' +
    ' (order_id, style_number, size, channel, location_name, employee_id, employee_name, record_type, record_data)' +
    ' VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [
      String(order_id),
      style_number  ? String(style_number)  : null,
      size          ? String(size)          : null,
      channel       ? String(channel)       : null,
      req.user.work_location || req.user.location_name_en || '',
      req.user.employee_id,
      req.user.employee_name || req.user.user_name || '',
      record_type,
      JSON.stringify(record_data || {})
    ]
  );
  res.status(201).json(new ApiResponse(201, result.rows[0], 'Record saved'));
});

// GET /api/scan/records  — fetch records for reports
var getRecords = asyncHandler(async function(req, res) {
  var order_id     = req.query.order_id;
  var style_number = req.query.style_number;
  var record_type  = req.query.record_type;
  var date_from    = req.query.date_from;
  var date_to      = req.query.date_to;
  var limit        = parseInt(req.query.limit) || 200;

  var conditions = [];
  var values     = [];
  var idx        = 1;

  if (order_id)     { conditions.push('order_id = $'     + idx++); values.push(String(order_id)); }
  if (style_number) { conditions.push('style_number = $' + idx++); values.push(String(style_number)); }
  if (record_type)  { conditions.push('record_type = $'  + idx++); values.push(record_type); }
  if (date_from)    { conditions.push('created_at >= $'  + idx++); values.push(date_from); }
  if (date_to)      { conditions.push('created_at <= $'  + idx++); values.push(date_to); }

  // LEFT JOIN material_requests to get live status for shortage records
  // sr. prefix needed since both tables have order_id etc.
  var prefixed = conditions.map(function(c) {
    return c.replace(/^(order_id|style_number|record_type|created_at)/, 'sr.$1');
  });
  var where = prefixed.length > 0 ? ' WHERE ' + prefixed.join(' AND ') : '';
  var pool  = getPool();

  var sql =
    'SELECT sr.*,' +
    ' mr.status     AS request_status,' +
    ' mr.request_id AS mat_request_id_ref' +
    ' FROM scan_records sr' +
    ' LEFT JOIN material_requests mr ON (' +
    "  sr.record_type IN ('fabric_shortage_request','material_request') AND (" +
    "    (mr.request_id = (sr.record_data->>'mat_request_id') AND (sr.record_data->>'mat_request_id') <> '')" +
    '    OR (' +
    "      mr.employee_id = sr.employee_id AND DATE(mr.created_at) = DATE(sr.created_at)" +
    "      AND mr.material_name ILIKE ('%' || SPLIT_PART(sr.record_data->>'fabric_name',' ',1) || '%')" +
    '    )' +
    '  )' +
    ')' +
    where +
    ' ORDER BY sr.created_at DESC LIMIT $' + idx;

  var result = await pool.query(sql, values.concat([limit]));
  res.status(200).json(new ApiResponse(200, result.rows, 'Records fetched'));
});

module.exports = {
  getOrderDetails: getOrderDetails,
  getStyleDetails: getStyleDetails,
  getAccessories:  getAccessories,
  saveRecord:      saveRecord,
  getRecords:      getRecords
};
