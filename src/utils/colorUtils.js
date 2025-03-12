/**
 * Utility functions for color manipulation and management
 */

/**
 * Calculates a contrasting text color (black or white) based on the background color
 * Uses the YIQ formula to determine brightness and return appropriate contrast color
 * 
 * @param {string} hexColor - Hex color code (with or without the # prefix)
 * @returns {string} - Either '#000000' (black) or '#ffffff' (white) for best contrast
 */
export const getContrastColor = (hexColor) => {
  if (!hexColor) return '#000000';
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // If less than 6 characters, pad it (e.g. "f00" becomes "ff0000")
  if (hexColor.length < 6) {
    hexColor = hexColor.split('').map(char => char + char).join('');
  }
  
  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate brightness using YIQ formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark backgrounds, black for light backgrounds
  return brightness > 128 ? '#000000' : '#ffffff';
};

/**
 * Adjusts the brightness of a color by a given percentage
 * 
 * @param {string} hexColor - Hex color code
 * @param {number} percent - Percentage to adjust brightness (-100 to 100)
 * @returns {string} - Adjusted hex color
 */
export const adjustBrightness = (hexColor, percent) => {
  if (!hexColor) return hexColor;
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + (r * percent / 100)));
  g = Math.max(0, Math.min(255, g + (g * percent / 100)));
  b = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  // Convert back to hex
  const newR = Math.round(r).toString(16).padStart(2, '0');
  const newG = Math.round(g).toString(16).padStart(2, '0');
  const newB = Math.round(b).toString(16).padStart(2, '0');
  
  return `#${newR}${newG}${newB}`;
};

/**
 * Generates a random hex color
 * 
 * @returns {string} - Random hex color code
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Create a named object before exporting
const colorUtils = {
  getContrastColor,
  adjustBrightness,
  getRandomColor
};

// Export the named object
export default colorUtils; 