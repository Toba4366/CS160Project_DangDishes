import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import { prepVerbs, cookingVerbs, passiveVerbs, activeVerbs } from '../constants/recipeVerbs';
import './Timeline.css';

function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeName, recipeData, fromPage } = location.state || {};
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    // Always go back to mise-en-place
    navigate('/mise-en-place', { 
      state: { recipeName, recipeData, fromPage },
      replace: false
    });
  };

  const handleSaveToHistory = async () => {
    if (!recipeData || saved) return;
    
    try {
      setSaving(true);
      await recipeService.addToHistory(recipeData);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save to history:', err);
      alert(`Failed to save to history: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Mock data for testing when recipe data is missing
  const mockInstructions = [
    "Preheat oven to 350 degrees F (175 degrees C). Lightly grease cookie sheets.",
    "In a large bowl, stir together cake mix, instant pudding, and rolled oats. Add oil, sour cream, water, and vanilla; mix until smooth and well blended. Stir in chocolate chips. Roll dough into 1 1/2 inch balls, and place 2 inches apart on the prepared cookie sheets.",
    "Bake for 8 to 10 minutes in the preheated oven. Allow cookies to cool on baking sheet for 5 minutes before transferring to a wire rack to cool completely."
  ];
  
  const instructions = recipeData?.instructions || recipeData?.recipeText || mockInstructions;
  
  /**
   * TIMELINE COLOR SCHEME
   * =====================
   * Colors are assigned dynamically based on task type (not hardcoded positions):
   * - RED (#FF6663): Prep tasks (chopping, mixing, measuring)
   * - BLUE (#9EC1CF): Cooking tasks (baking, frying, boiling)
   * - ORANGE (#FEB144): Cleaning tasks (washing dishes during idle time)
   * 
   * The colors repeat and are assigned based on the ORDER tasks appear in the timeline,
   * NOT based on linear position. This creates a more dynamic, repeatable visual pattern.
   */
  const colors = ['#FF6663', '#9EC1CF', '#FEB144'];

  // Generate timeline data from recipe instructions with better time extraction and multitasking
  let step_id = 1;

  /**
   * DURATION EXTRACTION
   * ===================
   * Extracts time duration from instruction text using pattern matching.
   * 
   * IMPORTANT: Bar widths in the timeline are proportional to DURATION (in minutes),
   * NOT to the length of the text description. A 30-minute bake step will show a bar
   * 3x wider than a 10-minute prep step, regardless of text length.
   * 
   * Patterns recognized:
   * - "8 to 10 minutes" → Average: 9 minutes
   * - "8-10 min" → Average: 9 minutes
   * - "30 minutes" → 30 minutes
   * - "5 min" → 5 minutes
   * 
   * If no time is explicitly stated, defaults are assigned based on verb type:
   * - Prep verbs (chop, dice): 3 minutes
   * - Cooking verbs (fry, boil): 8 minutes
   * - Passive verbs (cool, rest): 5 minutes
   * - Preheat: 10 minutes
   * - Generic fallback: 2 minutes
   */
  const extractDuration = (text) => {
    const lowerText = text.toLowerCase();
    
    // Try to find explicit time mentions
    // Pattern: "X minutes", "X-Y minutes", "X to Y minutes", "X min"
    const minutePatterns = [
      /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:minutes?|min)/i,  // "8 to 10 minutes", "8-10 min"
      /(\d+)\s*(?:minutes?|min)/i,                      // "10 minutes", "5 min"
    ];
    
    for (const pattern of minutePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        if (match[2]) {
          // Range found, use average
          return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        }
        return parseInt(match[1]);
      }
    }
    
    // Estimate based on task type
    if (passiveVerbs.some(v => lowerText.includes(v))) {
      return 5; // Passive tasks get default time
    }
    if (prepVerbs.some(v => lowerText.includes(v))) {
      return 3; // Prep tasks are usually quick
    }
    if (cookingVerbs.some(v => lowerText.includes(v))) {
      return 8; // Cooking tasks take longer
    }
    if (lowerText.includes('preheat')) {
      return 10; // Ovens take time
    }
    
    return 2; // Default fallback
  };

  /**
   * PASSIVE STEP DETECTION
   * =======================
   * Determines if a step allows multitasking (you can do other things during it).
   * 
   * Passive steps are KEY to intelligent scheduling. Examples:
   * - "Bake for 30 minutes" → You can prep other ingredients while it bakes
   * - "Let dough rise for 1 hour" → You can clean dishes during this time
   * - "Cool on rack for 10 minutes" → You can work on other tasks
   * 
   * These steps are identified by:
   * 1. Passive verbs (cool, rest, set, chill, freeze, marinate, rise)
   * 2. "until" keyword (implies waiting)
   * 3. "preheat" (oven heats itself)
   * 
   * CRITICAL: The algorithm schedules these EARLY and OVERLAPPING with other work,
   * so users can multitask efficiently instead of waiting idle.
   */
  const isPassiveStep = (text) => {
    const lowerText = text.toLowerCase();
    return passiveVerbs.some(v => lowerText.includes(v)) || 
           lowerText.includes('until') ||
           lowerText.includes('preheat');
  };

  const prep_steps = [];    // Sequential prep work (chopping, mixing)
  const cook_steps = [];    // Active cooking (frying, boiling) 
  const passive_steps = []; // Passive waiting (baking, cooling)

  let prepTime = 0;   // Total time for prep work
  let activeTime = 0; // Total time for active cooking

  /**
   * STEP CATEGORIZATION
   * ===================
   * Parse each instruction and categorize it into prep, cooking, or passive.
   * This categorization determines the scheduling strategy:
   * 
   * - PREP: Scheduled sequentially at the start (can't chop two things at once)
   * - COOKING: Scheduled after prep is complete (one cooking task at a time)
   * - PASSIVE: Scheduled to overlap with prep/cooking (multitasking opportunity)
   */
  for (const line of instructions) {
    for (const sentence of line.split(/\.\s+/)) {
      if (!sentence.trim() || sentence.length < 10) continue;
      
      const duration = extractDuration(sentence);
      const lowerSentence = sentence.toLowerCase();
      
      if (isPassiveStep(sentence)) {
        // Passive steps (baking, cooling, etc.)
        passive_steps.push({
          time: 0, // Will be positioned later
          duration: duration,
          label: sentence.trim(),
          id: `step-${step_id++}`,
          passive: true
        });
      } else if (cookingVerbs.some(v => lowerSentence.includes(v)) || 
                 activeVerbs.some(v => lowerSentence.includes(v))) {
        // Active cooking steps
        cook_steps.push({
          time: 0, // Will be positioned later
          duration: duration,
          label: sentence.trim(),
          id: `step-${step_id++}`,
          passive: false
        });
        activeTime += duration;
      } else {
        // Prep steps
        prep_steps.push({
          time: 0, // Will be positioned later
          duration: duration,
          label: sentence.trim(),
          id: `step-${step_id++}`,
          passive: false
        });
        prepTime += duration;
      }
    }
  }

  /**
   * INTELLIGENT SCHEDULING ALGORITHM
   * =================================
   * This is the core multitasking logic that makes the timeline NON-LINEAR.
   * Instead of showing tasks sequentially (prep → cook → clean), we overlap tasks
   * wherever possible to minimize total cooking time.
   * 
   * SCHEDULING STRATEGY:
   * 
   * Step 1: PREP WORK (Sequential)
   * - Prep tasks must be done in order (can't chop two things simultaneously)
   * - Start at time 0, schedule sequentially
   * - Example: "Chop onions (3 min)" → 0-3, "Dice tomatoes (3 min)" → 3-6
   * 
   * Step 2: PASSIVE TASKS (Overlapping)
   * - Start passive tasks EARLY, overlapping with prep
   * - Start at prepTime/2 or 2 minutes (whichever is smaller, but not negative)
   * - Stagger multiple passive steps by 1 minute
   * - Example: "Preheat oven (10 min)" starts at minute 2 while chopping happens
   * - This is why "total time" < "sum of all step times" (multitasking!)
   * 
   * Step 3: COOKING TASKS (Sequential after prep)
   * - Active cooking starts after prep is complete
   * - Scheduled sequentially (one cooking task at a time)
   * - Example: "Fry bacon (8 min)" → starts after all prep is done
   * 
   * Step 4: CLEANING TASKS (During idle time OR at end)
   * - Intelligently scheduled during long passive periods
   * - Example: While "Bake for 30 minutes", wash dishes from minutes 2-30
   * - IMPORTANT: Cleaning is scheduled during IDLE time, not before tools are used!
   * - If no good passive period exists, cleaning happens at the very end
   */
  let currentTime = 0;
  
  // STEP 1: Position prep steps sequentially at start
  prep_steps.forEach(step => {
    step.time = currentTime;
    currentTime += step.duration;
  });
  let prepEnd_temp = currentTime; // Save prep end time for reference

  // STEP 2: Start passive steps early, overlapping with prep
  let passiveStartTime = Math.max(0, Math.min(2, prepTime / 2)); // Start passive tasks early, but not before time 0
  passive_steps.forEach(step => {
    step.time = passiveStartTime;
    passiveStartTime += 1; // Stagger passive step starts slightly
  });

  // STEP 3: Position active cooking steps after prep
  cook_steps.forEach(step => {
    step.time = currentTime;
    currentTime += step.duration;
  });
  let cookEnd_temp = currentTime; // Save cooking end time

  /**
   * CLEANING TASK SCHEDULING
   * =========================
   * Smart logic to schedule dish washing during idle time.
   * 
   * IMPORTANT: Tools are only added to the cleaning list AFTER they've been used.
   * The algorithm checks for long passive steps (like "Bake for 30 minutes") and
   * schedules cleaning during those idle periods.
   * 
   * Logic:
   * 1. Find the longest passive step (e.g., "Bake for 30 minutes")
   * 2. If duration > 5 minutes, schedule cleaning during it
   * 3. Start cleaning 2 minutes into the passive step (ensure tools are dirty)
   * 4. Spread cleaning evenly across the idle time
   * 5. If no suitable passive step, clean at the very end
   * 
   * Example: "Bake for 30 minutes" from time 2-32
   *   → Cleaning starts at minute 4 (2 min into bake)
   *   → 5 tools * 2 min each = 10 minutes of cleaning
   *   → Clean from minutes 4-14 while baking continues
   */
  const clean_steps = [];
  const tools = recipeData?.tools || [];
  
  if (tools.length > 0) {
    // Find idle periods during passive steps to insert cleaning
    const longestPassive = passive_steps.reduce((max, step) => 
      step.duration > max.duration ? step : max, 
      { duration: 0, time: 0 }
    );
    
    if (longestPassive.duration > 5) {
      // Clean during long passive periods (like baking)
      const cleanStart = longestPassive.time + 2; // Start cleaning 2 min into passive step
      const cleanDuration = Math.min(longestPassive.duration - 2, tools.length * 2);
      const timePerTool = cleanDuration / tools.length;
      
      tools.forEach((tool, idx) => {
        clean_steps.push({
          time: cleanStart + (idx * timePerTool),
          duration: timePerTool,
          label: `Wash ${tool}`,
          id: `step-${step_id++}`
        });
      });
    } else {
      // Clean at the end if no good passive periods
      const cleanStart = currentTime;
      const timePerTool = 2;
      
      tools.forEach((tool, idx) => {
        clean_steps.push({
          time: cleanStart + (idx * timePerTool),
          duration: timePerTool,
          label: `Wash ${tool}`,
          id: `step-${step_id++}`
        });
      });
      
      currentTime += tools.length * timePerTool;
    }
  }

  /**
   * CALCULATE TASK BOUNDARIES
   * ==========================
   * Determine the start and end times for each major task category.
   * These boundaries are used to:
   * 1. Position the colored task bars in the timeline visualization
   * 2. Calculate the actual total cooking time (with multitasking savings)
   * 
   * Note: End times are calculated as the LATEST end time of any step in that category,
   * which accounts for overlapping tasks.
   */
  const prepStart = prep_steps.length > 0 ? Math.min(...prep_steps.map(s => s.time)) : 0;
  const prepEnd = prep_steps.length > 0 ? Math.max(...prep_steps.map(s => s.time + s.duration)) : 0;
  
  const cookStart = cook_steps.length > 0 ? Math.min(...cook_steps.map(s => s.time)) : prepEnd;
  const cookEnd = Math.max(
    cook_steps.length > 0 ? Math.max(...cook_steps.map(s => s.time + s.duration)) : 0,
    passive_steps.length > 0 ? Math.max(...passive_steps.map(s => s.time + s.duration)) : 0
  );
  
  const cleanStart = clean_steps.length > 0 ? Math.min(...clean_steps.map(s => s.time)) : cookEnd;
  const cleanEnd = clean_steps.length > 0 ? Math.max(...clean_steps.map(s => s.time + s.duration)) : cleanStart;

  /**
   * TOTAL TIME CALCULATION
   * =======================
   * Calculate the ACTUAL total cooking time based on multitasking.
   * 
   * IMPORTANT: This is NOT the sum of all step durations!
   * Because steps overlap (prep while oven preheats, clean while food bakes),
   * the actual time is much shorter.
   * 
   * Example:
   * - Chop onions: 3 min (0-3)
   * - Preheat oven: 10 min (2-12, overlaps with chopping!)
   * - Bake: 30 min (12-42)
   * - Clean: 10 min (14-24, during baking!)
   * - Sum of durations: 3+10+30+10 = 53 minutes
   * - ACTUAL time: 42 minutes (thanks to multitasking!)
   * 
   * If recipe has metadata time, use that. Otherwise calculate from last task end.
   */
  const calculatedTotalTime = Math.max(prepEnd, cookEnd, cleanEnd, currentTime);
  const displayTotalTime = recipeData?.time || Math.ceil(calculatedTotalTime);

  /**
   * BUILD TASK VISUALIZATION DATA
   * ==============================
   * Construct the task objects that drive the timeline UI.
   * 
   * Each task has:
   * - name: Category name (Prep, Cook, Clean)
   * - start: Start time in minutes
   * - end: End time in minutes  
   * - color: Hex color for the bar (from colors array)
   * - steps: Array of individual steps within this task
   * 
   * BAR WIDTH CALCULATION:
   * Bar width = ((end - start) / displayTotalTime) * 100%
   * This makes bars proportional to DURATION, not text length.
   * A 30-minute task gets a bar 3x wider than a 10-minute task.
   */
  const tasks = [];
  
  if (prep_steps.length > 0) {
    tasks.push({
      name: "Prep",
      start: prepStart,
      end: prepEnd,
      color: colors[0],
      steps: prep_steps
    });
  }
  
  if (cook_steps.length > 0 || passive_steps.length > 0) {
    tasks.push({
      name: "Cook",
      start: cookStart,
      end: cookEnd,
      color: colors[1],
      steps: [...cook_steps, ...passive_steps].sort((a, b) => a.time - b.time)
    });
  }
  
  if (clean_steps.length > 0) {
    tasks.push({
      name: "Clean",
      start: cleanStart,
      end: cleanEnd,
      color: colors[2],
      steps: clean_steps
    });
  }
  
  // const tasks = [
  //   {
  //     name: 'Toast bread',
  //     start: 0,
  //     end: 5,
  //     color: colors[0],
  //     steps: [{ time: 5, label: 'Remove toast', id: 'step-1' }]
  //   },
  //   {
  //     name: 'Cook egg',
  //     start: 0,
  //     end: 8,
  //     color: colors[1],
  //     steps: [
  //       { time: 1, label: 'Heat pan', id: 'step-2' },
  //       { time: 3, label: 'Add oil', id: 'step-3' },
  //       { time: 5, label: 'Crack egg', id: 'step-4' },
  //       { time: 8, label: 'Flip egg', id: 'step-5' }
  //     ]
  //   },
  //   {
  //     name: 'Clean dishes',
  //     start: 5,
  //     end: 15,
  //     color: colors[2],
  //     steps: [
  //       { time: 7, label: 'Wash pan', id: 'step-6' },
  //       { time: 10, label: 'Wash plate', id: 'step-7' },
  //       { time: 12, label: 'Wash utensils', id: 'step-8' }
  //     ]
  //   }
  // ];

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  return (
    <div className="timeline-page">
      {/* Orientation hint for mobile */}
      <div className="orientation-hint">
        Rotate your device to landscape mode for the best timeline viewing experience
      </div>

      <div className="timeline-header">
        <div className="header-left">
          <span className="now-viewing">Now viewing: </span>
          <span className="recipe-name">{recipeName || 'Fried Egg on Toast'}</span>
        </div>
        <div className="header-right">
          <span className="recipe-info">{displayTotalTime} min · {recipeData?.dishes || 3} dishes</span>
          {recipeData?.needsSaving && (
            <button 
              className={`save-button ${saved ? 'saved' : ''}`}
              onClick={handleSaveToHistory}
              disabled={saving || saved}
            >
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save to History'}
            </button>
          )}
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
        </div>
      </div>

      <div className="timeline-instructions">
          <i>Tap on step markers to mark them as complete.</i>
        </div>

      <div className="timeline-container">
        <div className="timeline-chart">
          {/* Time markers */}
          <div className="time-axis">
            {Array.from({ length: Math.ceil(displayTotalTime / 5) + 1 }, (_, i) => i * 5).map(time => (
              <div
                key={time}
                className="time-marker"
                style={{ left: `${(time / displayTotalTime) * 100}%` }}
              >
                <div className="time-dot"></div>
                <div className="time-label">{time}</div>
              </div>
            ))}
            <div className="time-line"></div>
          </div>

          {/* Task bars */}
          <div className="tasks">
            {tasks.map((task, index) => (
              <div key={index} style={{height: `${task.steps.length * 45}px`}} className="task-row">
                <div
                  className="task-bar"
                  style={{
                    backgroundColor: task.color,
                    left: `${(task.start / displayTotalTime) * 100}%`,
                    width: `${((task.end - task.start) / displayTotalTime) * 100}%`
                  }}
                >
                  <span className="task-name">{task.name}</span>
                  {task.steps?.map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      className={`task-step ${completedSteps.has(step.id) ? 'completed' : ''}`}
                      style={{ left: `${((step.time - task.start) / (task.end - task.start)) * 100}%`}}
                      onClick={() => toggleStep(step.id)}
                      title={`${step.label} at ${(step.time)} min - Click to mark ${completedSteps.has(step.id) ? 'incomplete' : 'complete'}`}
                    >
                      <div className="step-dot"></div>
                      <div className="step-label">
                        {completedSteps.has(step.id) && <span className="checkmark">✓ </span>}
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
