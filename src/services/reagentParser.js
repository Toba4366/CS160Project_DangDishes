/**
 * Reagent Noggin-based recipe parser
 * Uses Reagent AI to intelligently parse recipes into structured timeline data
 */

const REAGENT_NOGGIN_URL = import.meta.env.VITE_REAGENT_NOGGIN_URL || 'https://noggin.rea.gent/liquid-marten-8702';
const REAGENT_API_KEY = import.meta.env.VITE_REAGENT_API_KEY || 'rg_v1_wesfhasaze9zsrptmrc90wet1zl0o25jrahw_ngk';
const MAX_COMPLETION_LENGTH = 16048; // Maximum tokens for Reagent response
const NON_ACTIONABLE_STEPS = ['enjoy', 'enjoy!', 'serve', 'serve hot', 'plate', 'dish up'];

/**
 * Parse recipe instructions using Reagent Noggin
 * @param {string[] | string} instructions - Recipe instructions as array or string
 * @param {string[]} tools - List of tools/equipment mentioned in recipe
 * @param {Object} options - Additional context (servings, dish name, etc.)
 * @returns {Promise<Object>} Structured recipe data with prep/cook/clean steps
 */
export async function parseRecipeWithReagent(instructions, tools = [], options = {}) {
  const instructionsText = Array.isArray(instructions) 
    ? instructions.join('\n') 
    : instructions;

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
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const data = JSON.parse(jsonText);
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
  
  // Shared visited set for circular dependency detection across all recursion
  const globalVisited = new Set();
  
  // Calculate start times recursively
  const calculateStartTime = (stepId) => {
    if (globalVisited.has(stepId)) {
      console.warn(`⚠️ Circular dependency detected for step ${stepId}`);
      return 0;
    }
    globalVisited.add(stepId);
    
    const step = stepMap.get(stepId);
    if (!step) return 0;
    if (step.calculatedStart > 0) return step.calculatedStart;
    
    let earliestStart = 0;
    if (step.dependencies && step.dependencies.length > 0) {
      step.dependencies.forEach(depId => {
        const depStep = stepMap.get(depId);
        if (depStep) {
          const depStart = calculateStartTime(depId);
          const depEnd = depStart + (depStep.duration || 0);
          earliestStart = Math.max(earliestStart, depEnd);
        }
      });
    }
    
    step.calculatedStart = earliestStart;
    return earliestStart;
  };
  
  reagentData.steps.forEach(step => calculateStartTime(step.id));
  
  // Second pass: Create timeline steps with calculated start times
  const tracks = { prep: [], cook: [], clean: [] };

  reagentData.steps.forEach((step, idx) => {
    const stepData = stepMap.get(step.id);
    
    // Skip non-actionable steps (enjoy, serve, etc.)
    if (NON_ACTIONABLE_STEPS.some(label => step.text.toLowerCase().includes(label))) {
      console.log(`⏭️ Skipping non-actionable step: ${step.text}`);
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

  // Add cleaning steps for tools if not already included
  const existingCleanSteps = tracks.clean.map(s => s.label.toLowerCase());
  reagentData.tools?.forEach((tool, idx) => {
    const cleanLabel = `Wash ${tool}`;
    if (!existingCleanSteps.some(label => label.includes(tool.toLowerCase()))) {
      tracks.clean.push({
        id: `clean-${idx + 1}`,
        label: cleanLabel,
        duration: 2,
        passive: false
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
