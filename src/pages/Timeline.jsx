import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
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
  const colors = ['#FF6663', '#9EC1CF', '#FEB144'];

  // Generate timeline data from recipe instructions with better time extraction and multitasking
  let step_id = 1;

  // Classify verbs for task categorization
  const prepVerbs = ['preheat', 'chop', 'dice', 'slice', 'cut', 'grease', 'soak', 'drain', 'clean', 'mix', 'whisk', 'sift', 'measure', 'peel', 'mince', 'combine', 'stir together'];
  const cookingVerbs = ['cook', 'grill', 'saute', 'sauté', 'bake', 'roast', 'fry', 'boil', 'simmer', 'broil', 'steam', 'poach'];
  const passiveVerbs = ['cool', 'rest', 'set', 'chill', 'freeze', 'marinate', 'rise']; // Can do other tasks during these
  const activeVerbs = ['toast', 'brown', 'flip', 'turn', 'stir', 'toss', 'watch'];

  /**
   * Extract duration from instruction text with better pattern matching
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
   * Determine if a step is passive (can multitask during it)
   */
  const isPassiveStep = (text) => {
    const lowerText = text.toLowerCase();
    return passiveVerbs.some(v => lowerText.includes(v)) || 
           lowerText.includes('until') ||
           lowerText.includes('preheat');
  };

  const prep_steps = [];
  const cook_steps = [];
  const passive_steps = [];

  let prepTime = 0;
  let activeTime = 0;

  // Parse instructions and categorize steps
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

  // Position steps on timeline with multitasking
  let currentTime = 0;
  
  // 1. Position prep steps sequentially at start
  prep_steps.forEach(step => {
    step.time = currentTime;
    currentTime += step.duration;
  });

  // 2. Start passive steps (like preheating) early, overlapping with prep
  let passiveStartTime = Math.min(2, prepTime / 2); // Start passive tasks early
  passive_steps.forEach(step => {
    step.time = passiveStartTime;
    passiveStartTime += 1; // Stagger passive step starts slightly
  });

  // 3. Position active cooking steps after prep
  cook_steps.forEach(step => {
    step.time = currentTime;
    currentTime += step.duration;
  });

  // 4. Add cleaning tasks during passive/idle time and at the end
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

  // Calculate task boundaries
  const prepStart = prep_steps.length > 0 ? Math.min(...prep_steps.map(s => s.time)) : 0;
  const prepEnd = prep_steps.length > 0 ? Math.max(...prep_steps.map(s => s.time + s.duration)) : 0;
  
  const cookStart = cook_steps.length > 0 ? Math.min(...cook_steps.map(s => s.time)) : prepEnd;
  const cookEnd = Math.max(
    cook_steps.length > 0 ? Math.max(...cook_steps.map(s => s.time + s.duration)) : 0,
    passive_steps.length > 0 ? Math.max(...passive_steps.map(s => s.time + s.duration)) : 0
  );
  
  const cleanStart = clean_steps.length > 0 ? Math.min(...clean_steps.map(s => s.time)) : cookEnd;
  const cleanEnd = clean_steps.length > 0 ? Math.max(...clean_steps.map(s => s.time + s.duration)) : cleanStart;

  // Calculate actual total time based on when the last task ends
  const calculatedTotalTime = Math.max(prepEnd, cookEnd, cleanEnd, currentTime);
  const displayTotalTime = recipeData?.time || Math.ceil(calculatedTotalTime);

  // Build tasks with overlapping support
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
