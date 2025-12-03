/**
 * Recipe verb classifications for parsing and timeline generation
 * Shared constants to ensure consistency across the application
 * 
 * HOW TO USE:
 * ===========
 * These verb lists are used by Timeline.jsx to intelligently schedule cooking tasks
 * for optimal multitasking. The algorithm categorizes each instruction step and then
 * schedules them to overlap when possible (e.g., prep work while oven preheats).
 * 
 * ADDING NEW VERBS:
 * =================
 * To add support for a new cooking action:
 * 1. Identify which category it belongs to (see descriptions below)
 * 2. Add the verb (lowercase) to the appropriate array
 * 3. Test with a recipe that uses that verb to ensure proper scheduling
 * 
 * EXAMPLE: To add "whip" as a prep verb:
 *   - Add 'whip' to prepVerbs array
 *   - Timeline will now recognize "whip cream" as a prep step
 *   - It will schedule it sequentially with other prep work
 */

// PREPARATION VERBS
// =================
// Tasks done before cooking begins. These are scheduled sequentially at the start.
// Timeline assigns these a RED color (#FF6663) and schedules them one after another.
// Duration: Extracted from instruction text (e.g., "chop for 5 minutes") or defaults to 3 min
export const prepVerbs = [
  'preheat', 'chop', 'dice', 'slice', 'cut', 'grease', 'soak', 'drain', 
  'clean', 'mix', 'whisk', 'sift', 'measure', 'peel', 'mince', 'combine', 
  'stir together'
];

// COOKING VERBS
// =============
// Active cooking tasks that require hands-on attention. Scheduled after prep work.
// Timeline assigns these a BLUE color (#9EC1CF) and schedules them after prep is complete.
// These cannot overlap with each other (one active cooking task at a time).
// Duration: Extracted from instruction text or defaults to 5 minutes
export const cookingVerbs = [
  'cook', 'grill', 'saute', 'sauté', 'bake', 'roast', 'fry', 'boil', 
  'simmer', 'broil', 'steam', 'poach'
];

// PASSIVE VERBS
// =============
// Tasks that DON'T require active attention - you can do other things during these.
// Timeline schedules these EARLY and OVERLAPPING with prep/cooking work.
// Examples: "Bake for 30 minutes" (you can prep other things while it bakes)
//           "Let dough rise for 1 hour" (you can clean or do other tasks)
// These are KEY to the multitasking algorithm - they create opportunities for parallel work.
// Duration: Always extracted from text (these usually have explicit times)
export const passiveVerbs = [
  'cool', 'rest', 'set', 'chill', 'freeze', 'marinate', 'rise'
];

// ACTIVE MONITORING VERBS
// =======================
// Tasks that need attention but less hands-on work than cooking verbs.
// Timeline treats these similarly to cooking verbs but with shorter default durations.
// Duration: Extracted from text or defaults to 2 minutes
export const activeVerbs = [
  'toast', 'brown', 'flip', 'turn', 'stir', 'toss', 'watch'
];

// INSTRUCTION STARTER VERBS
// =========================
// Used by GenerateTimeline.jsx to detect instruction lines when parsing text recipes.
// If a line starts with one of these verbs, it's likely an instruction (not an ingredient).
// This helps separate the "Instructions" section from the "Ingredients" section in text.
export const instructionStarters = [
  'heat', 'cook', 'add', 'mix', 'stir', 'pour', 'place', 'remove',
  'bake', 'boil', 'fry', 'sauté', 'combine', 'whisk', 'blend',
  'season', 'serve', 'prep', 'cut', 'chop', 'dice', 'slice', 'preheat'
];
