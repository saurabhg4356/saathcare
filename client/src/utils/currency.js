/**
 * Converts integer paise to formatted INR string (e.g. 150050 -> ₹1,500.50)
 * @param {number} paise 
 * @returns {string}
 */
export function formatPaiseToINR(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees);
}

/**
 * Converts a rupee float/number to integer paise (e.g. 1500.5 -> 150050)
 * Safely avoids floating-point drift with Math.round
 * @param {number|string} rupees 
 * @returns {number}
 */
export function rupeesToPaise(rupees) {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/**
 * Converts paise to numeric rupees (e.g. 150050 -> 1500.5)
 * @param {number} paise 
 * @returns {number}
 */
export function paiseToRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}
