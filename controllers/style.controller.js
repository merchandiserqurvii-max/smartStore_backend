const ApiResponse  = require('../utils/ApiResponse');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Mock style database — replace with real external API call in production
const MOCK_STYLES = {
  ST1001: {
    styleNumber: 'ST1001',
    styleName:   "Women's Kurti",
    materials: [
      { materialCode: 'TH001', materialName: 'White Thread' },
      { materialCode: 'BT001', materialName: 'Metal Button' },
      { materialCode: 'LB001', materialName: 'Brand Label' },
    ],
  },
  ST1002: {
    styleNumber: 'ST1002',
    styleName:   "Men's Shirt",
    materials: [
      { materialCode: 'TH002', materialName: 'Black Thread' },
      { materialCode: 'BT002', materialName: 'Plastic Button' },
      { materialCode: 'LB002', materialName: 'Size Label' },
      { materialCode: 'SK001', materialName: 'Barcode Sticker' },
    ],
  },
  ST1003: {
    styleNumber: 'ST1003',
    styleName:   "Kids Frock",
    materials: [
      { materialCode: 'TH003', materialName: 'Red Thread' },
      { materialCode: 'EL001', materialName: 'Elastic Band 1 inch' },
      { materialCode: 'LB001', materialName: 'Brand Label' },
      { materialCode: 'TG001', materialName: 'Price Tag' },
    ],
  },
  ST1004: {
    styleNumber: 'ST1004',
    styleName:   "Women's Salwar",
    materials: [
      { materialCode: 'TH001', materialName: 'White Thread' },
      { materialCode: 'EL002', materialName: 'Elastic Band 2 inch' },
      { materialCode: 'LB002', materialName: 'Size Label' },
      { materialCode: 'PK001', materialName: 'Poly Bag Small' },
    ],
  },
};

const getStyleDetails = asyncHandler(async (req, res) => {
  const { styleNumber } = req.params;

  // If EXTERNAL_STYLE_API is configured, call the real endpoint
  if (process.env.EXTERNAL_STYLE_API) {
    const axios    = require('axios');
    const response = await axios.get(`${process.env.EXTERNAL_STYLE_API}/style-details/${styleNumber}`);
    return res.status(200).json(new ApiResponse(200, response.data, 'Style details fetched'));
  }

  // Fallback: mock data
  const style = MOCK_STYLES[styleNumber.toUpperCase()];
  if (!style) {
    throw new ApiError(404, `Style ${styleNumber} not found`);
  }
  res.status(200).json(new ApiResponse(200, style, 'Style details fetched'));
});

module.exports = { getStyleDetails };
