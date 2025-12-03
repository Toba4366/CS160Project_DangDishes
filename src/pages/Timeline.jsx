import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Timeline.css';

function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeName, recipeData, fromPage } = location.state || {};
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleBack = () => {
    if (fromPage === 'mise-en-place') {
      navigate('/mise-en-place', { 
        state: { recipeName, recipeData },
        replace: false
      });
    } else {
      navigate(-1);
    }
  };

  recipeData.name = "Oatmeal cookies"
  recipeData.dishes = 12;
  recipeData.recipeText = [
        "Preheat oven to 350 degrees F (175 degrees C). Lightly grease cookie sheets.",
        "In a large bowl, stir together cake mix, instant pudding, and rolled oats. Add oil, sour cream, water, and vanilla; mix until smooth and well blended. Stir in chocolate chips. Roll dough into 1 1/2 inch balls, and place 2 inches apart on the prepared cookie sheets.",
        "Bake for 8 to 10 minutes in the preheated oven. Allow cookies to cool on baking sheet for 5 minutes before transferring to a wire rack to cool completely."
    ];


  recipeData.tools = ["Spatula", "Bowl", "Baking Sheet"];
  recipeData.time = 30;

  const colors = ['#FF6663', '#9EC1CF', '#FEB144'];

  // Mock timeline data - in a real app, this would be generated from the recipe
  const totalTime = recipeData?.time || 15;
  let step_id = 1;

  // const prepVerbs = ['preheat', 'chop', 'grease', 'soak', 'drain', 'clean', 'mix', 'sift'];
  const cookingVerbs = ['cook', 'grill', 'saute', 'sauté', 'bake', 'Bake', 'fry', 'toast', 'cool']; // to do: case safe

  const prep_steps = [];
  let prep_time = 0;

  const cook_steps = [];
  let cook_start  = 0;
  let cook_time = 0;

  const clean_steps = [];

  let currTime = 0;

  for (const line of recipeData.recipeText) {
    for (const sentence of line.split(". ")) {
      const words = sentence.split(" ");

      let duration = 2; // ?
      if (words.includes("minutes")) {
        duration = parseInt(words[words.indexOf("minutes") - 1]);
      }

      if (cookingVerbs.some(r=> words.includes(r))) {
        const step = {time: currTime, label: sentence, id: `step-${step_id++}`};

        cook_steps.push(step);
        if (cook_start === 0) {
          cook_start = currTime;
        }
        cook_time += duration;

      } else {
        const step = {time: currTime, label: sentence, id: `step-${step_id++}`};
        prep_steps.push(step);
        prep_time += duration;
      }

      currTime += duration;
    }
  }

  const prep = 
    {
      name: "Prep",
      start: 0,
      end: prep_time,
      color: colors[0],
      steps: prep_steps
    };

    const cook = 
      {
        name: "Cook",
        start: cook_start,
        end: cook_time + cook_start,
        color: colors[1],
        steps: cook_steps
    };

    let cleanDur = 0;
    let clean_time = totalTime - cook_time;
    for (const tool of recipeData.tools) {
      clean_steps.push(
        {time: (clean_time + cleanDur), label: `Wash ${tool}`, id: `step-${step_id++}`},
      );
      cleanDur += clean_time / recipeData.tools.length;
    }

    const clean = 
      {
        name: "Clean",
        start: totalTime - cook_time,
        end: totalTime,
        color: colors[2],
        steps: clean_steps
    };

  const tasks = [prep, cook, clean]
  
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
          <span className="recipe-info">{totalTime} min · {recipeData?.dishes || 3} dishes</span>
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
            {Array.from({ length: Math.ceil(totalTime / 5) + 1 }, (_, i) => i * 5).map(time => (
              <div
                key={time}
                className="time-marker"
                style={{ left: `${(time / totalTime) * 100}%` }}
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
                    left: `${(task.start / totalTime) * 100}%`,
                    width: `${((task.end - task.start) / totalTime) * 100}%`
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
