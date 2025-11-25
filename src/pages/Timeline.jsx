import { useNavigate, useLocation } from 'react-router-dom';
import './Timeline.css';

function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeName, recipeData, fromPage } = location.state || {};

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

  // Mock timeline data - in a real app, this would be generated from the recipe
  const totalTime = recipeData?.time || 15;
  const tasks = [
    {
      name: 'Toast bread',
      start: 0,
      end: 5,
      color: '#ff6b6b',
      steps: [{ time: 5, label: 'Remove toast' }]
    },
    {
      name: 'Cook egg',
      start: 0,
      end: 8,
      color: '#ffa500',
      steps: [
        { time: 1, label: 'Heat pan' },
        { time: 3, label: 'Add oil' },
        { time: 5, label: 'Crack egg' },
        { time: 8, label: 'Flip egg' }
      ]
    },
    {
      name: 'Clean dishes',
      start: 5,
      end: 15,
      color: '#4169e1',
      steps: [
        { time: 7, label: 'Wash pan' },
        { time: 10, label: 'Wash plate' },
        { time: 12, label: 'Wash utensils' }
      ]
    }
  ];

  return (
    <div className="timeline-page">
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
                      className="task-step"
                      style={{ left: `${((step.time - task.start) / (task.end - task.start)) * 100}%` }}
                      title={step.label}
                    >
                      <div className="step-dot"></div>
                      <div className="step-label">{step.label}</div>
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
