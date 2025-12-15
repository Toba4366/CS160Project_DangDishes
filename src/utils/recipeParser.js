/**
 * Shared recipe parsing utilities
 * ================================
 * Centralized functions for detecting tools and ingredients from recipe text.
 * Used by both GenerateTimeline.jsx (text recipes) and recipeService.js (API recipes).
 * 
 * WHY THIS EXISTS:
 * ================
 * Previously, tool detection was duplicated in two places with slightly different
 * keyword lists. This caused inconsistent results depending on the recipe source.
 * Now both text recipes and web recipes use the same detection logic.
 * 
 * HOW TO USE:
 * ===========
 * import { detectToolsFromText } from '../utils/recipeParser';
 * const tools = detectToolsFromText(instructions);
 * 
 * ADDING NEW TOOLS:
 * =================
 * To add a new tool keyword:
 * 1. Add it to the toolKeywords array below (lowercase)
 * 2. Test with recipes that use that tool
 * 3. The tool will be detected in both text input and web scraped recipes
 */

/**
 * Comprehensive list of kitchen tools to detect
 * Tools are detected if they appear anywhere in the instructions text
 */
const toolKeywords = [
  // Cookware
  'pan', 'pot', 'skillet', 'saucepan', 'stockpot', 'dutch oven',
  'wok', 'griddle', 'roasting pan',
  
  // Bakeware
  'baking sheet', 'baking pan', 'cookie sheet', 'muffin tin',
  'cake pan', 'loaf pan', 'pie dish', 'casserole dish',
  
  // Appliances
  'oven', 'stove', 'microwave', 'blender', 'food processor',
  'mixer', 'stand mixer', 'hand mixer', 'toaster', 'grill',
  
  // Utensils
  'knife', 'spoon', 'fork', 'spatula', 'whisk', 'tongs',
  'ladle', 'peeler', 'grater', 'zester', 'masher',
  'rolling pin', 'can opener', 'strainer', 'colander',
  
  // Prep tools
  'bowl', 'mixing bowl', 'cutting board', 'measuring cup',
  'measuring spoon', 'kitchen scale'
];

/**
 * Detect tools from instruction text
 * 
 * @param {string} instructions - Recipe instructions as a single string
 * @returns {string[]} Array of detected tools (capitalized, deduplicated)
 * 
 * DETECTION LOGIC:
 * ================
 * 1. Convert instructions to lowercase for case-insensitive matching
 * 2. Check if each tool keyword appears in the text
 * 3. Capitalize the first letter of detected tools
 * 4. Remove duplicates using Set
 * 
 * EXAMPLES:
 * =========
 * Input: "Heat a large skillet over medium heat. Use a whisk to combine."
 * Output: ["Skillet", "Whisk"]
 * 
 * Input: "Bake in preheated oven for 30 minutes."
 * Output: ["Oven"]
 * 
 * Input: "Mix ingredients in a bowl with a spoon."
 * Output: ["Bowl", "Spoon"]
 */
export const detectToolsFromText = (instructions) => {
  if (!instructions) return [];
  
  const lowerInstructions = instructions.toLowerCase();
  const detectedTools = [];
  
  toolKeywords.forEach(tool => {
    if (lowerInstructions.includes(tool)) {
      // Capitalize first letter for display
      const capitalizedTool = tool.charAt(0).toUpperCase() + tool.slice(1);
      detectedTools.push(capitalizedTool);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(detectedTools)];
};

/**
 * Extract cooking time from recipe text
 * @param {string} text - Recipe text (title, instructions, etc.)
 * @returns {number} Estimated time in minutes, or null if not found
 */
export const extractCookingTime = (text) => {
  if (!text) return null;
  
  const lower = text.toLowerCase();
  let totalMinutes = 0;
  
  // "X hours Y minutes" or "X hrs Y min"
  const hourMinPattern = /(\d+)\s*(?:hours?|hrs?)\s*(?:and\s*)?(\d+)?\s*(?:minutes?|mins?)?/gi;
  let match = hourMinPattern.exec(lower);
  if (match) {
    totalMinutes += parseInt(match[1]) * 60;
    if (match[2]) totalMinutes += parseInt(match[2]);
    return totalMinutes;
  }
  
  // "X-Y hours" (take average)
  const hourRangePattern = /(\d+)\s*-\s*(\d+)\s*(?:hours?|hrs?)/i;
  match = hourRangePattern.exec(lower);
  if (match) {
    const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
    return Math.round(avg * 60);
  }
  
  // "X hours"
  const hourPattern = /(\d+)\s*(?:hours?|hrs?)/i;
  match = hourPattern.exec(lower);
  if (match) {
    return parseInt(match[1]) * 60;
  }
  
  // "X-Y minutes" (take average)
  const minRangePattern = /(\d+)\s*-\s*(\d+)\s*(?:minutes?|mins?)/i;
  match = minRangePattern.exec(lower);
  if (match) {
    return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
  }
  
  // "X minutes"
  const minPattern = /(\d+)\s*(?:minutes?|mins?)/i;
  match = minPattern.exec(lower);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Prep + cook time
  const prepMatch = /prep(?:aration)?:\s*(\d+)\s*(?:min|minutes?)/i.exec(lower);
  const cookMatch = /cook(?:ing)?:\s*(\d+)\s*(?:min|minutes?)/i.exec(lower);
  if (prepMatch || cookMatch) {
    if (prepMatch) totalMinutes += parseInt(prepMatch[1]);
    if (cookMatch) totalMinutes += parseInt(cookMatch[1]);
    return totalMinutes;
  }
  
  return null;
};

/**
 * Calculate dish count from tools and context
 * @param {Array} tools - List of tools used in recipe
 * @param {Array|string} instructions - Recipe instructions
 * @returns {number} Estimated number of dishes to wash
 */
export const calculateDishCount = (tools = [], instructions = []) => {
  const toolsArray = Array.isArray(tools) ? tools : [];
  const instructionsText = Array.isArray(instructions) 
    ? instructions.join(' ').toLowerCase() 
    : (instructions || '').toLowerCase();
  
  // Exclude appliances that don't get washed
  const nonDishAppliances = ['oven', 'stove', 'stovetop', 'microwave', 'toaster', 'grill'];
  const washableTools = toolsArray.filter(tool => {
    const lower = tool.toLowerCase();
    return !nonDishAppliances.some(app => lower.includes(app));
  });
  
  let dishCount = washableTools.length;
  
  // Add utensils mentioned in instructions
  const utensilKeywords = ['spoon', 'fork', 'knife', 'spatula', 'whisk', 'tongs', 'ladle'];
  utensilKeywords.forEach(utensil => {
    if (instructionsText.includes(utensil) && !washableTools.some(t => t.toLowerCase().includes(utensil))) {
      dishCount++;
    }
  });
  
  // Add serving dishes if plating is mentioned
  if (instructionsText.includes('serve') || instructionsText.includes('plate')) {
    dishCount += 2;
  }
  
  return Math.max(3, Math.min(dishCount, 15)); // Min 3, max 15
};

/**
 * Improve recipe metadata accuracy
 * @param {Object} recipeData - Recipe data object
 * @returns {Object} Recipe data with improved calculations
 */
export const improveRecipeMetadata = (recipeData) => {
  if (!recipeData) return recipeData;
  
  const improved = { ...recipeData };
  
  // Improve time calculation
  if (!improved.time || improved.time === 0) {
    const titleTime = extractCookingTime(improved.name || '');
    const instructionTime = extractCookingTime(
      Array.isArray(improved.instructions) 
        ? improved.instructions.join(' ') 
        : improved.instructions || ''
    );
    improved.time = titleTime || instructionTime || 30;
  }
  
  // Improve dish count
  if (!improved.dishes || improved.dishes === 0) {
    improved.dishes = calculateDishCount(improved.tools, improved.instructions);
  }
  
  // Ensure tools list
  if (!improved.tools || improved.tools.length === 0) {
    const instructionsText = Array.isArray(improved.instructions)
      ? improved.instructions.join(' ')
      : improved.instructions || '';
    improved.tools = detectToolsFromText(instructionsText);
  }
  
  return improved;
};
