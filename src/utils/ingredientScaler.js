/**
 * Parse and scale ingredient quantities
 */

/**
 * Scale an ingredient string by a multiplier
 * @param {string} ingredient - Ingredient string like "2 cups flour" or "1/2 tsp salt"
 * @param {number} multiplier - Scaling factor (e.g., 2 for double, 0.5 for half)
 * @returns {string} Scaled ingredient string
 */
export function scaleIngredient(ingredient, multiplier) {
  if (multiplier === 1) return ingredient;
  
  // Pattern to match numbers (including fractions and decimals) at the start
  const numberPattern = /^(\d+\/\d+|\d+\.\d+|\d+)\s*/;
  const match = ingredient.match(numberPattern);
  
  if (!match) {
    // No number found - return as is (e.g., "salt to taste")
    return ingredient;
  }
  
  const originalNumber = match[1];
  const restOfIngredient = ingredient.slice(match[0].length);
  
  // Parse the number (handle fractions)
  let value;
  if (originalNumber.includes('/')) {
    const [num, den] = originalNumber.split('/').map(Number);
    value = num / den;
  } else {
    value = parseFloat(originalNumber);
  }
  
  // Scale the value
  const scaledValue = value * multiplier;
  
  // Format the scaled value
  const formattedValue = formatNumber(scaledValue);
  
  return `${formattedValue} ${restOfIngredient}`;
}

/**
 * Format a number as a fraction or decimal
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(value) {
  // If it's close to a whole number, return it as such
  if (Math.abs(value - Math.round(value)) < 0.01) {
    return Math.round(value).toString();
  }
  
  // Check for common fractions
  const fractions = [
    [1/8, '1/8'], [1/4, '1/4'], [1/3, '1/3'], [1/2, '1/2'],
    [2/3, '2/3'], [3/4, '3/4'], [5/8, '5/8'], [7/8, '7/8']
  ];
  
  const wholePart = Math.floor(value);
  const fractionalPart = value - wholePart;
  
  // Check if fractional part matches a common fraction
  for (const [decimal, fraction] of fractions) {
    if (Math.abs(fractionalPart - decimal) < 0.01) {
      return wholePart > 0 ? `${wholePart} ${fraction}` : fraction;
    }
  }
  
  // For other values, use decimal with 2 places max
  return value.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Scale all ingredients by a multiplier
 * @param {Array} ingredients - Array of ingredient objects with 'name' property
 * @param {number} multiplier - Scaling factor
 * @returns {Array} Scaled ingredients
 */
export function scaleIngredients(ingredients, multiplier) {
  return ingredients.map(ing => ({
    ...ing,
    name: scaleIngredient(ing.name, multiplier),
    originalName: ing.originalName || ing.name
  }));
}

/**
 * Reset ingredients to their original quantities
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Array} Ingredients with original names
 */
export function resetIngredients(ingredients) {
  return ingredients.map(ing => ({
    ...ing,
    name: ing.originalName || ing.name
  }));
}
