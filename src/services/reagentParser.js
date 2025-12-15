/**
 * Reagent Noggin-based recipe parser
 * Uses Reagent AI to intelligently parse recipes into structured timeline data
 */

const REAGENT_NOGGIN_URL = import.meta.env.VITE_REAGENT_NOGGIN_URL || 'https://noggin.rea.gent/liquid-marten-8702';
const REAGENT_API_KEY = import.meta.env.VITE_REAGENT_API_KEY || 'rg_v1_wesfhasaze9zsrptmrc90wet1zl0o25jrahw_ngk';
const MAX_COMPLETION_LENGTH = 16048; // Maximum tokens for Reagent response
const NON_ACTIONABLE_STEPS = ['enjoy', 'enjoy!', 'serve', 'serve hot', 'plate', 'dish up'];

/**
 * Preprocess instructions to split multi-sentence steps into clear, atomic steps
 * @param {string[] | string} instructions - Recipe instructions
 * @returns {string[]} Processed instruction steps
 */
function preprocessInstructions(instructions) {
  const instructionArray = Array.isArray(instructions) ? instructions : [instructions];
  const processed = [];
  
  instructionArray.forEach(instruction => {
    const trimmed = instruction.trim();
    if (!trimmed) return;
    
    // Split on sentence boundaries, but preserve coordination
    // Split on: '. ' (period space), '! ', '? ' but not on decimal numbers or abbreviations
    const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    // Further split on coordinating conjunctions when there's a clear action break
    sentences.forEach(sentence => {
      // Check for compound sentences with 'then', 'and then', 'next'
      const actionSplits = sentence.split(/(?:\.|,)?\s+(?:then|and then|next)\s+/i);
      
      if (actionSplits.length > 1) {
        actionSplits.forEach(split => {
          const cleaned = split.trim().replace(/^[,;]\s*/, '');
          if (cleaned) processed.push(cleaned);
        });
      } else {
        processed.push(sentence.trim());
      }
    });
  });
  
  return processed;
}

/**
 * Parse recipe instructions using Reagent Noggin
 * @param {string[] | string} instructions - Recipe instructions as array or string
 * @param {string[]} tools - List of tools/equipment mentioned in recipe
 * @param {Object} options - Additional context (servings, dish name, etc.)
 * @returns {Promise<Object>} Structured recipe data with prep/cook/clean steps
 */
export async function parseRecipeWithReagent(instructions, tools = [], options = {}) {
  // Preprocess instructions to split multi-sentence steps
  const processedInstructions = preprocessInstructions(instructions);
  const instructionsText = processedInstructions.join('\n');

  // Format input as the noggin expects
  const inputText = `Recipe: ${options.dishName || 'Unknown Dish'}
Servings: ${options.servings || 'Not specified'}
Tools: ${tools.join(', ') || 'Not specified'}

Instructions:
${instructionsText}`;

  const requestBody = {
    input: inputText,
    "maximum-completion-length": MAX_COMPLETION_LENGTH, // API expects kebab-case
  };

  console.log('🤖 Sending to Reagent noggin:', {
    instructionsPreview: instructionsText.substring(0, 200) + '...',
    tools,
    dishName: options.dishName,
    inputPreview: inputText.substring(0, 300) + '...'
  });

  try {
    const response = await fetch(REAGENT_NOGGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REAGENT_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Reagent response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Reagent API error response:', error);
      throw new Error(`Reagent API request failed (${response.status}): ${error || response.statusText}`);
    }

    const responseText = await response.text();
    console.log('📥 Raw Reagent response:', responseText);
    
    // Try to extract JSON from response (in case it's wrapped in markdown)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present (handle any amount of whitespace)
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/g, '');
    }

    // Parse JSON with better error handling
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON from Reagent response:', jsonError);
      console.error('❌ Response text that failed to parse:', jsonText.substring(0, 500));
      return null;
    }
    console.log('✅ Parsed Reagent data:', data);
    
    return data;

  } catch (error) {
    console.error('❌ Reagent parsing failed:', error);
    return null;
  }
}

/**
 * Convert Reagent-parsed recipe into timeline format expected by Timeline component
 * @param {Object} reagentData - Data returned from parseRecipeWithReagent
 * @returns {Object} Timeline-compatible data structure
 */
export function convertReagentToTimeline(reagentData) {
  console.log('🔄 convertReagentToTimeline called with:', reagentData);
  
  if (!reagentData) {
    console.error('❌ No reagentData provided to converter');
    return null;
  }
  
  if (!reagentData.steps) {
    console.error('❌ reagentData missing steps array:', reagentData);
    return null;
  }

  console.log(`📊 Converting ${reagentData.steps.length} steps from Reagent`);
  
  // First pass: Calculate start times based on dependencies
  const stepMap = new Map();
  reagentData.steps.forEach(step => {
    stepMap.set(step.id, { ...step, calculatedStart: 0 });
  });
  
  // Calculate start times recursively with per-call visited tracking
  const calculateStartTime = (stepId, visited = new Set()) => {
    // Check if we're in a circular dependency (revisiting same step in THIS recursion path)
    if (visited.has(stepId)) {
      console.warn(`⚠️ Circular dependency detected for step ${stepId}`);
      return 0;
    }
    
    const step = stepMap.get(stepId);
    if (!step) return 0;
    
    // If already calculated, return cached value (memoization)
    if (step.calculatedStart > 0) return step.calculatedStart;
    
    // Add to visited for THIS recursion path only
    visited.add(stepId);
    
    let earliestStart = 0;
    if (step.dependencies && step.dependencies.length > 0) {
      step.dependencies.forEach(depId => {
        const depStep = stepMap.get(depId);
        if (depStep) {
          // Pass visited set down the recursion tree
          const depStart = calculateStartTime(depId, visited);
          const depEnd = depStart + (depStep.duration || 0);
          earliestStart = Math.max(earliestStart, depEnd);
        }
      });
    }
    
    step.calculatedStart = earliestStart;
    return earliestStart;
  };
  
  // Calculate start time for each step (visited set is fresh for each top-level call)
  reagentData.steps.forEach(step => calculateStartTime(step.id));
  
  // Second pass: Create timeline steps with calculated start times
  const tracks = { prep: [], cook: [], clean: [] };

  reagentData.steps.forEach((step, idx) => {
    const stepData = stepMap.get(step.id);
    
    // Skip non-actionable steps (enjoy, serve, etc.) - use exact match to avoid false positives
    const stepTextTrimmed = step.text.trim().toLowerCase();
    if (NON_ACTIONABLE_STEPS.some(label => stepTextTrimmed === label || stepTextTrimmed.startsWith(label + ' ') || stepTextTrimmed.startsWith(label + '.'))) {
      console.log(`⏭️  Skipping non-actionable step: "${step.text}"`);
      return;
    }
    
    const timelineStep = {
      id: step.id || `step-${idx + 1}`,
      label: step.text,
      duration: step.duration || 3,
      start: stepData.calculatedStart,
      end: stepData.calculatedStart + (step.duration || 3),
      passive: step.category === 'passive_cook',
      canOverlap: step.canOverlap || false,
      dependencies: step.dependencies || [],
      notes: step.notes,
      temperature: step.temperature
    };

    // Map Reagent categories to timeline tracks
    switch (step.category) {
      case 'prep':
        tracks.prep.push(timelineStep);
        break;
      case 'cook':
      case 'passive_cook':
        tracks.cook.push(timelineStep);
        break;
      case 'clean':
        tracks.clean.push(timelineStep);
        break;
      default:
        console.warn(`⚠️ Unknown step category "${step.category}", defaulting to prep track`);
        tracks.prep.push(timelineStep);
    }
  });

  // Tools that shouldn't have wash instructions
  const NON_WASHABLE_TOOLS = [
    'oven', 'stove', 'stovetop', 'microwave', 'toaster', 'toaster oven',
    'air fryer', 'slow cooker', 'instant pot', 'pressure cooker',
    'grill', 'bbq', 'smoker', 'dehydrator',
    'dishwasher', 'sink', 'faucet', 'tap',
    'paper towel', 'parchment paper', 'aluminum foil', 'plastic wrap',
    'cooking spray', 'oil spray', 'pam', 'timer', 'thermometer',
    'counter', 'countertop', 'table', 'cutting board mat'
  ];

  // Improved tool detection - extract actual tools from descriptions
  const extractActualTool = (toolString) => {
    const lower = toolString.toLowerCase().trim();
    
    // Skip if it's a non-washable tool
    if (NON_WASHABLE_TOOLS.some(nwt => lower === nwt || lower.includes(nwt))) {
      return null;
    }
    
    // Extract specific tool from phrases like "large mixing bowl" -> "mixing bowl"
    const toolPatterns = [
      /(?:large|small|medium|big|heavy|light|deep|shallow|non-stick|cast iron|stainless steel|glass|plastic|wooden|metal)\s+(.+)/i,
      /(\d+[-\s](?:inch|qt|quart|cup|liter))\s+(.+)/i,
    ];
    
    for (const pattern of toolPatterns) {
      const match = lower.match(pattern);
      if (match) {
        return match[match.length - 1].trim();
      }
    }
    
    return toolString.trim();
  };

  // Add cleaning steps for washable tools if not already included
  const existingCleanSteps = tracks.clean.map(s => s.label.toLowerCase());
  const washableTools = [];
  
  reagentData.tools?.forEach((tool) => {
    const actualTool = extractActualTool(tool);
    if (actualTool && !washableTools.includes(actualTool.toLowerCase())) {
      washableTools.push(actualTool);
    }
  });

  washableTools.forEach((tool, idx) => {
    const cleanLabel = `Wash ${tool}`;
    // Use exact match to avoid false positives
    if (!existingCleanSteps.some(label => label === cleanLabel.toLowerCase())) {
      // Determine a sensible default start time: after the last cook or prep step
      const lastCookOrPrepStep = [...tracks.cook, ...tracks.prep].reduce(
        (latest, step) => (step.end && step.end > (latest?.end ?? 0)) ? step : latest,
        null
      );
      const cleanStart = lastCookOrPrepStep ? lastCookOrPrepStep.end : 0;
      
      // Vary duration based on tool type (pots/pans take longer)
      const toolLower = tool.toLowerCase();
      const cleanDuration = (
        toolLower.includes('pot') || 
        toolLower.includes('pan') || 
        toolLower.includes('skillet') || 
        toolLower.includes('dutch oven')
      ) ? 3 : 2;
      
      tracks.clean.push({
        id: `clean-${idx + 1}`,
        label: cleanLabel,
        duration: cleanDuration,
        start: cleanStart,
        end: cleanStart + cleanDuration,
        passive: false,
        dependencies: []
      });
    }
  });

  const result = {
    tracks,
    totalTime: reagentData.estimatedTotalTime,
    parallelizationTips: reagentData.parallelizationOpportunities,
    notes: reagentData.importantNotes
  };
  
  console.log('✅ Conversion complete:', {
    prepSteps: tracks.prep.length,
    cookSteps: tracks.cook.length,
    cleanSteps: tracks.clean.length,
    totalTime: result.totalTime
  });
  
  return result;
}
