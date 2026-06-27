/**
 * Generates a unique request ID like REQ-20240623-0001
 */
const generateRequestId = () => {
  const now    = new Date();
  const date   = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `REQ-${date}-${random}`;
};

module.exports = generateRequestId;
