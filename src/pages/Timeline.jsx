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
    if (fromPage === 'mise-en-place') {
      navigate('/mise-en-place', { 
        state: { recipeName, recipeData },
        replace: false
      });
    } else {
      navigate(-1);
    }
  };

  const handleSaveToHistory = async () => {
    if (!recipeData || saved) return;
    
    try {
      setSaving(true);
      await recipeService.addToHistory(recipeData);
      setSaved(true);
      console.log('Saved to history:', recipeData.name);
    } catch (err) {
      console.error('Failed to save to history:', err);
      alert('Failed to save to history. Please try again.');
    } finally {
      setSaving(false);
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
      steps: [{ time: 5, label: 'Remove toast', id: 'step-1' }]
    },
    {
      name: 'Cook egg',
      start: 0,
      end: 8,
      color: '#ffa500',
      steps: [
        { time: 1, label: 'Heat pan', id: 'step-2' },
        { time: 3, label: 'Add oil', id: 'step-3' },
        { time: 5, label: 'Crack egg', id: 'step-4' },
        { time: 8, label: 'Flip egg', id: 'step-5' }
      ]
    },
    {
      name: 'Clean dishes',
      start: 5,
      end: 15,
      color: '#4169e1',
      steps: [
        { time: 7, label: 'Wash pan', id: 'step-6' },
        { time: 10, label: 'Wash plate', id: 'step-7' },
        { time: 12, label: 'Wash utensils', id: 'step-8' }
      ]
    }
  ];

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
          <p>Tap on step markers to mark them as complete</p>
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
                      style={{ left: `${((step.time - task.start) / (task.end - task.start)) * 100}%` }}
                      onClick={() => toggleStep(step.id)}
                      title={`${step.label} - Click to mark ${completedSteps.has(step.id) ? 'incomplete' : 'complete'}`}
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
