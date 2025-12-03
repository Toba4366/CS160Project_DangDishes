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
 * FUTURE ENHANCEMENTS:
 * ====================
 * - Add detectIngredientsFromText() for consistent ingredient parsing
 * - Add extractRecipeMetadata() to parse time, servings, difficulty
 * - Add validateRecipeFormat() to check if text has required sections
 * - Add normalizeToolNames() to handle variations (e.g., "8-inch pan" → "Pan")
 */
