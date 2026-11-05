/**
 * Quantity units supported across the portal
 */
const VALID_UNITS = ['kg', 'quintal', 'tonne', 'bags', 'pieces', 'litres'];

// Conversion factors to standard 'kg' where safely applicable
// Bags and pieces CANNOT be converted automatically without item-specific definitions
const WEIGHT_CONVERSIONS_TO_KG = {
  kg: 1,
  quintal: 100,
  tonne: 1000
};

/**
 * Check if two units match or can be compared safely
 */
const areUnitsCompatible = (unitA, unitB) => {
  if (!unitA || !unitB) return false;
  return unitA.toLowerCase() === unitB.toLowerCase();
};

/**
 * Format currency with Rupee symbol
 */
const formatINR = (amount) => {
  if (typeof amount !== 'number') return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
};

module.exports = {
  VALID_UNITS,
  WEIGHT_CONVERSIONS_TO_KG,
  areUnitsCompatible,
  formatINR
};
