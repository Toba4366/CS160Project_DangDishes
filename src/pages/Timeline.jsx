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

  const colors = ['#FF6663', '#9EC1CF', '#FEB144']

  // Mock timeline data - in a real app, this would be generated from the recipe
  const totalTime = recipeData?.time || 15;
  var step_id = 1;
  var task_id = 0;

  const prepVerbs = ['preheat', 'chop', 'grease', 'soak', 'drain', 'clean', 'mix', 'sift'];
  const cookingVerbs = ['cook', 'grill', 'saute', 'bake', 'fry', 'toast'];
  const taskType = ['Prep', 'Cook', 'Clean'];

  var prep_steps = [];
  var prep_start = 0;
  var prep_time = 0;

  var cook_steps = [];
  var cook_start  = 0;
  var cook_time = 0;

  var clean_steps = [];

  var currTime = 0;

  for (line in recipeData.recipeText) {
    for (sentence in line.split(".")) {
      const words = sentence.split(" ")

      var t = recipeData.time / 10; // ?
      if (words.includes("minutes")) {
        t = words[words.indexOf("minutes") - 1];
      }

      step = {time: t, label: sentence, id: `step-${step_id++}`};
      
      if (prepVerbs.some(r=> sentence.includes(r))) {
        prep_steps.push(step);
        if (prep_start == 0) {
          prep_start = currTime;
          prep_time += t;
        }

      } else if ((cookingVerbs.some(r=> sentence.includes(r)))) {
        cook_steps.push(step);
        if (cook_start == 0) {
          cook_start = currTime;
          cook_time += t;
        }
      }

      currTime += t / 2;
    };
  };

  const prep = 
    {
      name: "Prep",
      start: prep_start,
      end: prep_time - prep_start,
      color: colors[0],
      steps: prep_steps
    };

    const cook = 
      {
        name: "Cook",
        start: cook_start,
        end: cook_time - cook_start,
        color: colors[1],
        steps: cook_steps
    };

    for (dish in recipeData.dishes) {
      clean_steps.push(
        {time: 3, label: `Wash ${dish}`, id: `step-${step_id++}`},
      );
    }

    const clean = 
      {
        name: "Clean",
        start: cook_start / 3,
        end: recipeData.time,
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
              <div key={index} className="task-row">
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
                      // steps: [{ time: 5, label: 'Remove toast', id: 'step-1' }]
                      // (5-0)/(5-0)
                      style={{ left: `${((step.time - task.start) / (task.end - task.start)) * 100}%`}}
                      onClick={() => toggleStep(step.id)}
                      title={`${step.label} at ${(step.time + task.start)} min - Click to mark ${completedSteps.has(step.id) ? 'incomplete' : 'complete'}`}
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
