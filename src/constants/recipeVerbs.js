/**
 * Recipe verb classifications for parsing and timeline generation
 * Shared constants to ensure consistency across the application
 */

// Preparation verbs - tasks done before cooking
export const prepVerbs = [
  'preheat', 'chop', 'dice', 'slice', 'cut', 'grease', 'soak', 'drain', 
  'clean', 'mix', 'whisk', 'sift', 'measure', 'peel', 'mince', 'combine', 
  'stir together'
];

// Cooking verbs - active cooking tasks
export const cookingVerbs = [
  'cook', 'grill', 'saute', 'sauté', 'bake', 'roast', 'fry', 'boil', 
  'simmer', 'broil', 'steam', 'poach'
];

// Passive verbs - tasks where you can do other things simultaneously
export const passiveVerbs = [
  'cool', 'rest', 'set', 'chill', 'freeze', 'marinate', 'rise'
];

// Active monitoring verbs - require attention but less hands-on
export const activeVerbs = [
  'toast', 'brown', 'flip', 'turn', 'stir', 'toss', 'watch'
];

// Instruction starter verbs - used to detect instruction lines in text
export const instructionStarters = [
  'heat', 'cook', 'add', 'mix', 'stir', 'pour', 'place', 'remove',
  'bake', 'boil', 'fry', 'sauté', 'combine', 'whisk', 'blend',
  'season', 'serve', 'prep', 'cut', 'chop', 'dice', 'slice', 'preheat'
];
