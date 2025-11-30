import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import './GenerateTimeline.css';

/**
 * JOSH'S TASK: Add Data Formatting and History Storage
 * 
 * CURRENT STATE:
 * ==============
 * - This page accepts recipe URL or text input
 * - It validates input and navigates to /loading page
 * - BUT it doesn't properly format recipe data or save to history
 * 
 * WHAT NEEDS TO HAPPEN:
 * ====================
 * 
 * PART A: DATA REFORMATTING
 * -------------------------
 * When user submits URL or text, you need to create a proper recipe object:
 * 
 * Recipe Object Structure:
 * {
 *   id: string (generate with: `url-${Date.now()}` or `text-${Date.now()}`),
 *   name: string (extract from URL or ask user, or use "Custom Recipe"),
 *   url: string (the URL if URL input, or null if text input),
 *   recipeText: string (the text if text input, or null if URL input),
 *   time: number (default to null or ask user),
 *   dishes: number (default to null or ask user),
 *   source: 'manual' (to distinguish from web-scraped recipes),
 *   isHistory: false (will be set to true when added to history)
 * }
 * 
 * PART B: SAVE TO HISTORY AFTER TIMELINE GENERATION
 * -------------------------------------------------
 * There are TWO approaches you can take:
 * 
 * OPTION 1 (Easier): Save immediately when user submits
 *   - Call recipeService.addToHistory(recipeObject) right after validation
 *   - Then navigate to loading page
 *   - Pro: Simple, happens right away
 *   - Con: User hasn't actually cooked it yet
 * 
 * OPTION 2 (Better UX): Save after user views the timeline
 *   - Pass recipe data through navigation state
 *   - In Timeline.jsx, add a "Mark as Cooked" or "Save to History" button
 *   - When clicked, call recipeService.addToHistory(recipeData)
 *   - Pro: Only saves recipes that user actually used
 *   - Con: Requires changes to Timeline.jsx too
 * 
 * RECOMMENDED: Use OPTION 1 for now (simpler)
 * 
 * HOW TO IMPLEMENT:
 * =================
 * 
 * STEP 1: Import recipeService (already done above)
 * 
 * STEP 2: Update handleUrlSubmit:
 *   const handleUrlSubmit = async () => {
 *     const error = validateUrl(urlInput);
 *     setUrlError(error);
 *     
 *     if (!error) {
 *       // Create properly formatted recipe object
 *       const recipeData = {
 *         id: `url-${Date.now()}`,
 *         name: extractNameFromUrl(urlInput) || 'Recipe from URL', // You create this helper
 *         url: urlInput,
 *         recipeText: null,
 *         time: null, // Could add optional fields for user to enter
 *         dishes: null,
 *         source: 'manual',
 *         isHistory: false
 *       };
 *       
 *       // Save to history
 *       try {
 *         await recipeService.addToHistory(recipeData);
 *         console.log('Saved to history:', recipeData.name);
 *       } catch (err) {
 *         console.error('Failed to save to history:', err);
 *         // Continue anyway - don't block user if history fails
 *       }
 *       
 *       // Navigate to loading page with formatted data
 *       navigate('/loading', { 
 *         state: { 
 *           recipeName: recipeData.name,
 *           recipeData: recipeData,
 *           nextPage: 'mise-en-place',
 *           fromPage: 'generate-timeline'
 *         } 
 *       });
 *     }
 *   };
 * 
 * STEP 3: Update handleTextSubmit (similar to above):
 *   - Create recipe object with recipeText field instead of url
 *   - id: `text-${Date.now()}`
 *   - name: 'Custom Recipe' or extract first line of text
 *   - Save to history same way
 *   - Navigate with formatted data
 * 
 * STEP 4: Create helper function to extract name from URL:
 *   const extractNameFromUrl = (url) => {
 *     try {
 *       // Extract last part of URL path
 *       const urlObj = new URL(url);
 *       const pathname = urlObj.pathname;
 *       const parts = pathname.split('/').filter(p => p);
 *       const lastPart = parts[parts.length - 1];
 *       
 *       // Convert kebab-case to Title Case
 *       return lastPart
 *         .split('-')
 *         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
 *         .join(' ');
 *     } catch (e) {
 *       return 'Custom Recipe';
 *     }
 *   };
 * 
 * BONUS (Optional): Add time/dishes input fields
 * ----------------------------------------------
 * You could add optional input fields for cooking time and number of dishes:
 * 
 * const [timeInput, setTimeInput] = useState('');
 * const [dishesInput, setDishesInput] = useState('');
 * 
 * <input 
 *   type="number" 
 *   placeholder="Cooking time (minutes)" 
 *   value={timeInput}
 *   onChange={(e) => setTimeInput(e.target.value)}
 * />
 * 
 * Then use: time: timeInput ? parseInt(timeInput) : null
 * 
 * TESTING:
 * ========
 * 1. Run backend: cd backend && python app.py
 * 2. Run frontend: npm run dev
 * 3. Submit a URL on GenerateTimeline page
 * 4. Check browser console for "Saved to history" message
 * 5. Go to History page - your recipe should appear!
 * 6. Check backend terminal - should show POST /api/history request
 * 
 * REFERENCE FILES:
 * ================
 * - src/services/recipeService.js - API functions
 * - src/pages/SearchResults.jsx - Example of saving to history (line ~40)
 * - backend/app.py - History API endpoints
 * - backend/database.py - History storage logic
 */

function GenerateTimeline() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [urlTimeInput, setUrlTimeInput] = useState('');
  const [urlDishesInput, setUrlDishesInput] = useState('');
  const [textTimeInput, setTextTimeInput] = useState('');
  const [textDishesInput, setTextDishesInput] = useState('');
  const [showUrlOptional, setShowUrlOptional] = useState(false);
  const [showTextOptional, setShowTextOptional] = useState(false);
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

  const extractNameFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/').filter(p => p);
      const lastPart = parts[parts.length - 1];
      
      return lastPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (e) {
      return 'Custom Recipe';
    }
  };

  const extractNameFromText = (text) => {
    const firstLine = text.trim().split('\n')[0];
    return firstLine.length > 50 ? 'Custom Recipe' : firstLine || 'Custom Recipe';
  };

  const parseRecipeText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const ingredients = [];
    const tools = [];
    
    let inIngredientsSection = false;
    let inInstructionsSection = false;
    
    // Common cooking verbs that indicate instruction lines
    const cookingVerbs = ['cook', 'add', 'stir', 'heat', 'boil', 'cut', 'chop', 'mince', 'season', 'remove', 'bring', 'reserve'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      // Detect instructions section (lines that start with verbs or are numbered steps)
      if (cookingVerbs.some(verb => lowerLine.startsWith(verb)) || /^\d+\./.test(line)) {
        inInstructionsSection = true;
        inIngredientsSection = false;
        
        // Extract tools from instruction lines
        const toolKeywords = ['pot', 'pan', 'bowl', 'spoon', 'knife', 'board', 'mixer', 'blender', 'oven', 'stove'];
        toolKeywords.forEach(tool => {
          if (lowerLine.includes(tool) && !tools.some(t => t.toLowerCase().includes(tool))) {
            // Capitalize first letter
            tools.push(tool.charAt(0).toUpperCase() + tool.slice(1));
          }
        });
        continue;
      }
      
      // Section headers ending with colon (e.g., "Freaksta:", "Chicken:")
      if (line.endsWith(':') || lowerLine.includes('ingredient')) {
        inIngredientsSection = true;
        inInstructionsSection = false;
        // Don't add the header itself
        continue;
      }
      
      // Stop treating as ingredients when we hit instructions
      if (inInstructionsSection) {
        continue;
      }
      
      // In ingredients section: add non-empty lines that aren't too long
      if (inIngredientsSection && line.length > 2 && line.length < 100) {
        ingredients.push(line);
      }
      
      // Before any section detected, assume first lines are ingredients
      if (!inIngredientsSection && !inInstructionsSection && i < lines.length / 2) {
        // If line is short and doesn't start with a verb, likely an ingredient
        if (line.length < 100 && !cookingVerbs.some(verb => lowerLine.startsWith(verb))) {
          inIngredientsSection = true;
          ingredients.push(line);
        }
      }
    }
    
    // Remove duplicates and empty entries
    const uniqueIngredients = [...new Set(ingredients.filter(i => i.length > 2))];
    const uniqueTools = [...new Set(tools)];
    
    return { 
      ingredients: uniqueIngredients.slice(0, 30), // Limit to 30
      tools: uniqueTools.slice(0, 10) // Limit to 10
    };
  };

  const handleUrlSubmit = () => {
    const error = validateUrl(urlInput);
    setUrlError(error);
    
    if (!error) {
      const recipeData = {
        id: `url-${Date.now()}`,
        name: extractNameFromUrl(urlInput),
        url: urlInput,
        recipeText: null,
        ingredients: [], // Will be fetched by scraper
        tools: [],
        time: urlTimeInput ? parseInt(urlTimeInput) : null,
        dishes: urlDishesInput ? parseInt(urlDishesInput) : null,
        source: 'manual',
        isHistory: false,
        needsSaving: true
      };
      
      navigate('/loading', { 
        state: { 
          recipeName: recipeData.name,
          recipeData: recipeData,
          nextPage: 'mise-en-place',
          fromPage: 'generate-timeline'
        } 
      });
    }
  };

  const handleTextSubmit = () => {
    const error = validateText(textInput);
    setTextError(error);
    
    if (!error) {
      const { ingredients, tools } = parseRecipeText(textInput);
      
      const recipeData = {
        id: `text-${Date.now()}`,
        name: extractNameFromText(textInput),
        url: null,
        recipeText: textInput,
        ingredients: ingredients,
        tools: tools,
        time: textTimeInput ? parseInt(textTimeInput) : null,
        dishes: textDishesInput ? parseInt(textDishesInput) : null,
        source: 'manual',
        isHistory: false,
        needsSaving: true
      };
      
      navigate('/loading', { 
        state: { 
          recipeName: recipeData.name,
          recipeData: recipeData,
          nextPage: 'mise-en-place',
          fromPage: 'generate-timeline'
        } 
      });
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
            type="button"
            className="optional-toggle"
            onClick={() => setShowUrlOptional(!showUrlOptional)}
          >
            {showUrlOptional ? '▼' : '▶'} Optional: Add time and dishes
          </button>
          {showUrlOptional && (
            <div className="optional-fields">
              <input
                type="number"
                placeholder="Time (minutes)"
                className="optional-input"
                value={urlTimeInput}
                onChange={(e) => setUrlTimeInput(e.target.value)}
                min="1"
              />
              <input
                type="number"
                placeholder="# of dishes"
                className="optional-input"
                value={urlDishesInput}
                onChange={(e) => setUrlDishesInput(e.target.value)}
                min="1"
              />
            </div>
          )}
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
            type="button"
            className="optional-toggle"
            onClick={() => setShowTextOptional(!showTextOptional)}
          >
            {showTextOptional ? '▼' : '▶'} Optional: Add time and dishes
          </button>
          {showTextOptional && (
            <div className="optional-fields">
              <input
                type="number"
                placeholder="Time (minutes)"
                className="optional-input"
                value={textTimeInput}
                onChange={(e) => setTextTimeInput(e.target.value)}
                min="1"
              />
              <input
                type="number"
                placeholder="# of dishes"
                className="optional-input"
                value={textDishesInput}
                onChange={(e) => setTextDishesInput(e.target.value)}
                min="1"
              />
            </div>
          )}
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
