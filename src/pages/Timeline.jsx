import { useState, useMemo } from 'react';
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

  const timelineData = useMemo(() => {
    const mockInstructions = [
      "Preheat oven to 350 degrees F. Lightly grease cookie sheets.",
      "In a large bowl, mix cake mix, pudding, and oats. Add oil and water; mix until smooth.",
      "Bake for 8 to 10 minutes. Cool on baking sheet for 5 minutes."
    ];
    
    const instructions = recipeData?.instructions || recipeData?.recipeText || mockInstructions;
    const tools = recipeData?.tools || ['Pan', 'Bowl', 'Spatula'];
    
    const extractDuration = (text) => {
      const lower = text.toLowerCase();
      const match = lower.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:minutes?|min)/i) || lower.match(/(\d+)\s*(?:minutes?|min)/i);
      if (match) return match[2] ? Math.round((parseInt(match[1]) + parseInt(match[2])) / 2) : parseInt(match[1]);
      if (passiveVerbs.some(v => lower.includes(v))) return 5;
      if (prepVerbs.some(v => lower.includes(v))) return 3;
      if (cookingVerbs.some(v => lower.includes(v))) return 8;
      return 3;
    };

    const isPassive = (text) => {
      const lower = text.toLowerCase();
      return passiveVerbs.some(v => lower.includes(v)) || lower.includes('until');
    };

    let stepId = 1;
    const tracks = { prep: [], cook: [], clean: [] };
    
    for (const line of instructions) {
      for (const sentence of line.split(/\.\s+/)) {
        if (!sentence.trim() || sentence.length < 10) continue;
        const duration = extractDuration(sentence);
        const lower = sentence.toLowerCase();
        const step = { id: `step-${stepId++}`, label: sentence.trim(), duration, passive: isPassive(sentence) };
        
        if (lower.includes('preheat')) tracks.prep.push(step);
        else if (isPassive(sentence)) tracks.cook.push(step);
        else if (cookingVerbs.some(v => lower.includes(v)) || activeVerbs.some(v => lower.includes(v))) tracks.cook.push(step);
        else tracks.prep.push(step);
      }
    }

    tools.forEach(tool => {
      tracks.clean.push({ id: `step-${stepId++}`, label: `Wash ${tool}`, duration: 2 });
    });

    // Schedule with row assignment for overlaps
    const scheduleTrack = (steps, startTime = 0) => {
      const rows = [[]];
      let currentTime = startTime;
      
      steps.forEach(s => {
        s.start = currentTime;
        
        let rowIdx = rows.findIndex(r => r.length === 0 || r[r.length - 1].end <= s.start);
        if (rowIdx === -1) { rows.push([]); rowIdx = rows.length - 1; }
        s.end = s.start + s.duration;
        s.row = rowIdx;
        rows[rowIdx].push(s);
        
        if (!s.passive) currentTime = s.end;
      });
      return currentTime;
    };

    let time = scheduleTrack(tracks.prep, 0);
    
    // Schedule passive cook steps early to overlap with prep
    const passiveCook = tracks.cook.filter(s => s.passive);
    const activeCook = tracks.cook.filter(s => !s.passive);
    
    let passiveStartTime = Math.max(0, Math.min(2, time / 2));
    passiveCook.forEach((s, idx) => {
      s.start = passiveStartTime + idx;
      s.end = s.start + s.duration;
      s.row = 0;
    });
    
    time = scheduleTrack(activeCook, time);
    
    const longestPassive = passiveCook.find(s => s.duration > 5);
    if (longestPassive && tracks.clean.length > 0) {
      const cleanWindow = Math.max(0, longestPassive.duration - 2);
      const timePerTool = Math.min(2, cleanWindow / tracks.clean.length);
      let cleanTime = longestPassive.start + 2;
      
      tracks.clean.forEach(s => { 
        s.start = cleanTime; 
        s.end = cleanTime + timePerTool; 
        s.row = 0; 
        cleanTime = s.end; 
      });
    } else {
      scheduleTrack(tracks.clean, time);
    }

    // Merge and reassign rows for all cook steps to handle overlaps
    const allCookSteps = [...passiveCook, ...activeCook].sort((a, b) => a.start - b.start);
    const cookRows = [[]];
    allCookSteps.forEach(s => {
      let rowIdx = cookRows.findIndex(r => r.length === 0 || r[r.length - 1].end <= s.start);
      if (rowIdx === -1) { cookRows.push([]); rowIdx = cookRows.length - 1; }
      s.row = rowIdx;
      cookRows[rowIdx].push(s);
    });
    tracks.cook = allCookSteps;
    
    const totalTime = Math.max(...[...tracks.prep, ...tracks.cook, ...tracks.clean].map(s => s.end || 0));

    return {
      title: recipeName || 'Recipe',
      totalTime: recipeData?.time || Math.ceil(totalTime) || 15,
      dishes: recipeData?.dishes || 3,
      tracks: [
        { id: 'prep', label: 'Prep', color: '#FF6663', steps: tracks.prep },
        { id: 'cook', label: 'Cook', color: '#9EC1CF', steps: tracks.cook },
        { id: 'clean', label: 'Clean', color: '#FEB144', steps: tracks.clean }
      ].filter(t => t.steps.length > 0)
    };
  }, [recipeName, recipeData]);

  const allSteps = timelineData.tracks.flatMap(t => t.steps);
  const progressPercent = allSteps.length > 0 ? (completedSteps.size / allSteps.length) * 100 : 0;

  const toggleStep = (stepId) => setCompletedSteps(prev => {
    const next = new Set(prev);
    next.has(stepId) ? next.delete(stepId) : next.add(stepId);
    return next;
  });

  const handleSave = async () => {
    if (!recipeData || saved) return;
    setSaving(true);
    try { await recipeService.addToHistory(recipeData); setSaved(true); } 
    catch (err) { console.error(err); } 
    finally { setSaving(false); }
  };

  // Calculate minimum timeline width to ensure short steps are readable
  const minWidthPerMin = 60; // pixels per minute minimum
  const timelineMinWidth = Math.max(800, timelineData.totalTime * minWidthPerMin);

  return (
    <div className="timeline-page">
      <div className="timeline-header">
        <button className="back-button" onClick={() => navigate('/mise-en-place', { state: { recipeName, recipeData, fromPage }, replace: false })}>← Back</button>
        <div className="header-info">
          <h1>{timelineData.title}</h1>
          <div className="meta-tags">
            <span>{timelineData.totalTime} min</span>
            <span>{timelineData.dishes} dishes</span>
          </div>
        </div>
        {recipeData?.needsSaving && (
          <button className={`save-button ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={saving || saved}>
            {saved ? '✓ Saved' : saving ? '...' : 'Save'}
          </button>
        )}
      </div>

      <div className="progress-section">
        <span>{completedSteps.size}/{allSteps.length} Steps ({Math.round(progressPercent)}%)</span>
        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} /></div>
      </div>

      <div className="timeline-instructions">
        <p>Tap on step markers to mark them as complete.</p>
      </div>

      <div className="timeline-container">
        <div className="timeline-scroll" style={{ minWidth: timelineMinWidth }}>
          {/* Time Ruler */}
          <div className="time-ruler">
            {Array.from({ length: Math.ceil(timelineData.totalTime / 5) + 1 }, (_, i) => i * 5).map(t => (
              <div key={t} className="time-mark" style={{ left: `${(t / timelineData.totalTime) * 100}%` }}>
                <span>{t}m</span>
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div className="tracks">
            {timelineData.tracks.map(track => {
              const rows = [];
              track.steps.forEach(step => {
                if (!rows[step.row]) rows[step.row] = [];
                rows[step.row].push(step);
              });

              return (
                <div key={track.id} className="track-section">
                  <div className="track-label" style={{ borderLeftColor: track.color }}>{track.label}</div>
                  <div className="track-lane">
                    {rows.map((rowSteps, rowIndex) => (
                      <div key={rowIndex} className="timeline-row">
                        {rowSteps.map((step, i) => {
                          const prevEnd = i > 0 ? rowSteps[i-1].end : 0;
                          const widthPct = ((step.end - step.start) / timelineData.totalTime) * 100;
                          const marginPct = ((step.start - prevEnd) / timelineData.totalTime) * 100;
                          const isCompleted = completedSteps.has(step.id);
                          
                          return (
                            <div
                              key={step.id}
                              className={`step-block ${isCompleted ? 'completed' : ''}`}
                              style={{ 
                                width: `${Math.max(widthPct, 3)}%`,
                                marginLeft: `${marginPct}%`,
                                backgroundColor: track.color 
                              }}
                              onClick={() => toggleStep(step.id)}
                            >
                              <div className="step-header">
                                <span className={`step-marker ${isCompleted ? 'checked' : ''}`}>{isCompleted ? '✓' : '○'}</span>
                                <span className="step-duration">{step.duration}m</span>
                              </div>
                              <div className="step-text">{step.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
