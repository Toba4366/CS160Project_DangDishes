import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GenerateTimeline.css';

function GenerateTimeline() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      navigate('/loading', { state: { recipeName: 'Recipe from URL', recipeData: urlInput } });
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      navigate('/loading', { state: { recipeName: 'Custom Recipe', recipeData: textInput } });
    }
  };

  return (
    <div className="generate-timeline">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
      
      <h1>Generate Timeline</h1>
      <h2>Instructions</h2>
      
      <div className="input-section">
        <div className="input-group">
          <input
            type="text"
            className="recipe-input"
            placeholder="URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button className="submit-button" onClick={handleUrlSubmit}>
            Submit
          </button>
        </div>

        <div className="input-group">
          <textarea
            className="recipe-textarea"
            placeholder="Type recipe here"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button className="submit-button" onClick={handleTextSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateTimeline;
