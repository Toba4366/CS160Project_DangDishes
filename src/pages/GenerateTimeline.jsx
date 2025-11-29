import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GenerateTimeline.css';

function GenerateTimeline() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [textError, setTextError] = useState('');

  const validateUrl = (url) => {
    if (!url.trim()) {
      return 'Please enter a URL';
    }
    
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      return 'Please enter a valid URL (e.g., https://example.com/recipe)';
    }
    
    return '';
  };

  const validateText = (text) => {
    if (!text.trim()) {
      return 'Please enter recipe text';
    }
    
    if (text.trim().length < 10) {
      return 'Recipe text seems too short. Please provide more details.';
    }
    
    return '';
  };

  const handleUrlSubmit = () => {
    const error = validateUrl(urlInput);
    setUrlError(error);
    
    if (!error) {
      navigate('/loading', { state: { recipeName: 'Custom Recipe', recipeData: urlInput } });
    }
  };

  const handleTextSubmit = () => {
    const error = validateText(textInput);
    setTextError(error);
    
    if (!error) {
      navigate('/loading', { state: { recipeName: 'Custom Recipe', recipeData: textInput } });
    }
  };

  const handleUrlChange = (e) => {
    setUrlInput(e.target.value);
    if (urlError) setUrlError(''); // Clear error on change
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    if (textError) setTextError(''); // Clear error on change
  };

  return (
    <div className="generate-timeline">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
      
      <h1>Generate Timeline</h1>
      <p className="page-description">
        Enter a recipe URL or paste recipe text to generate a cooking timeline
      </p>
      
      <div className="input-section">
        <div className="input-group">
          <label htmlFor="url-input" className="input-label">
            Recipe URL
          </label>
          <div className="input-wrapper">
            <input
              id="url-input"
              type="text"
              className={`recipe-input ${urlError ? 'error' : ''}`}
              placeholder="https://example.com/recipe-name"
              value={urlInput}
              onChange={handleUrlChange}
            />
            {urlError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {urlError}
              </div>
            )}
          </div>
          <button 
            className="submit-button" 
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            Submit
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="input-group">
          <label htmlFor="text-input" className="input-label">
            Recipe Text
          </label>
          <div className="input-wrapper">
            <textarea
              id="text-input"
              className={`recipe-textarea ${textError ? 'error' : ''}`}
              placeholder="Paste or type your recipe here...

Example Ingredients:
- 2 eggs
- 2 slices of bread

Example Instructions:
1. Heat pan over medium heat
2. Toast bread
3. Cook eggs"
              value={textInput}
              onChange={handleTextChange}
            />
            {textError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {textError}
              </div>
            )}
          </div>
          <button 
            className="submit-button" 
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateTimeline;
