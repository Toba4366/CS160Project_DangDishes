import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import { instructionStarters } from '../constants/recipeVerbs';
import { detectToolsFromText } from '../utils/recipeParser';
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
  const [urlError, setUrlError] = useState('');
  const [textError, setTextError] = useState('');
  const [recipeTitle, setRecipeTitle] = useState('');
  const [titleError, setTitleError] = useState('');

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

  // Helper function to extract recipe name from URL
  const extractNameFromUrl = (url) => {
    try {
      // Ensure the URL has a protocol for the URL constructor
      let fullUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        fullUrl = 'https://' + url;
      }
      
      // Extract last part of URL path
      const urlObj = new URL(fullUrl);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/').filter(p => p);
      const lastPart = parts[parts.length - 1] || 'Recipe from URL';
      
      // Convert kebab-case and snake_case to Title Case
      return lastPart
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (e) {
      return 'Recipe from URL';
    }
  };

  // Helper function to extract recipe name from text (first line or default)
  const extractNameFromText = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // If first line looks like a title (short, no numbers), use it
      if (firstLine.length < 50 && !firstLine.match(/^\d+\./)) {
        return firstLine;
      }
    }
    return 'Custom Recipe';
  };

  // Handle URL submission with proper data formatting and history storage
  const handleUrlSubmit = async () => {
    const error = validateUrl(urlInput);
    setUrlError(error);
    
    if (!error) {
      // Create properly formatted recipe object
      const recipeData = {
        id: `url-${Date.now()}`,
        name: extractNameFromUrl(urlInput) || 'Recipe from URL',
        url: urlInput,
        recipeText: null,
        time: null,
        dishes: null,
        source: 'manual'
      };
      
      // Save to history
      try {
        await recipeService.addToHistory(recipeData);
        console.log('Saved to history:', recipeData.name);
      } catch (err) {
        console.error('Failed to save to history:', err);
        // Continue anyway
      }
      
      // Navigate to loading page with formatted data
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

  // Parse ingredients from recipe text
  const parseIngredientsFromText = (text) => {
    const ingredients = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Expanded measurement keywords
    const measurementKeywords = [
      'cup', 'cups', 'tbsp', 'tsp', 'teaspoon', 'tablespoon', 'tablespoons', 'teaspoons',
      'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 
      'gram', 'grams', 'kg', 'kilogram', 'ml', 'milliliter', 'liter', 'liters',
      'pinch', 'dash', 'handful', 'clove', 'cloves', 'piece', 'pieces',
      'inch', 'inches', 'can', 'cans', 'package', 'packages', 'box', 'bunch', 'head', 'whole'
    ];
    
    // Pre-compile regex for measurement detection (performance optimization)
    const measurementRegex = new RegExp(`\\b(${measurementKeywords.join('|')})\\b`, 'i');
    
    // Common food/ingredient words
    const foodWords = [
      'chicken', 'beef', 'pork', 'fish', 'bacon', 'sausage', 'meat', 'turkey', 'goose', 'duck',
      'egg', 'eggs', 'milk', 'butter', 'cream', 'cheese', 'oil', 'vinegar',
      'salt', 'pepper', 'sugar', 'flour', 'water', 'wine', 'stock', 'broth',
      'onion', 'garlic', 'shallot', 'tomato', 'pasta', 'noodle', 'rice',
      'herb', 'basil', 'oregano', 'parsley', 'thyme', 'rosemary',
      'paprika', 'cayenne', 'cumin', 'curry', 'nutmeg', 'cinnamon',
      'carrot', 'celery', 'potato', 'spinach', 'lettuce', 'mushroom',
      'jam', 'honey', 'mustard', 'sauce', 'paste'
    ];
    
    // Pre-compile regex for food word detection (performance optimization)
    const foodWordsRegex = new RegExp(`\\b(${foodWords.join('|')})`, 'i');
    
    // Words that indicate it's NOT an ingredient line (webpage/UI noise)
    const skipKeywords = [
      'skip to', 'content', 'now viewing', 'mise en place', 'check off',
      'recipe', 'directions', 'instructions', 'serves', 'servings', 'yield',
      'prep time', 'cook time', 'total time', 'mins', 'min', 'hours', 'hrs',
      'nutrition', 'calories', 'fat', 'carbs', 'protein', 'sodium',
      'save', 'print', 'rate', 'review', 'rating', 'photo', 'video', 
      'allrecipes', 'log in', 'sign up', 'sign in', 'newsletter', 'subscribe',
      'advertisement', 'ad', 'sponsored', 'follow us', 'social',
      'about us', 'contact', 'privacy', 'terms', 'policy', 'careers',
      'editorial', 'vetting', 'advertise', 'magazine', 'subscription',
      'manage your', 'help', 'choices', 'guidelines', 'community',
      'local offers', 'occasions', 'cuisines', 'kitchen tips', 'news', 'features',
      'tools', 'ingredients', 'gather them', 'made it', 'home cooks',
      'dinners', 'meals', 'holidays', 'events', 'christmas'
    ];
    
    let inIngredientsSection = false;
    let inInstructionsSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      const trimmedLine = line.trim();
      
      if (!lowerLine || trimmedLine.length < 2) continue;
      
      // Detect section headers
      if (lowerLine === 'ingredients' || lowerLine === 'ingredients:') {
        inIngredientsSection = true;
        inInstructionsSection = false;
        continue;
      }
      if (lowerLine === 'instructions' || lowerLine === 'instructions:' || 
          lowerLine === 'directions' || lowerLine === 'directions:' ||
          lowerLine === 'steps' || lowerLine === 'steps:') {
        inInstructionsSection = true;
        inIngredientsSection = false;
        continue;
      }
      
      // Skip if in instructions section
      if (inInstructionsSection) continue;
      
      // Skip webpage noise and UI elements
      const hasSkipKeyword = skipKeywords.some(keyword => lowerLine.includes(keyword));
      if (hasSkipKeyword) continue;
      
      // Skip very short lines (likely UI elements or single words)
      if (trimmedLine.length < 3) continue;
      
      // Check if line starts with a number (used in multiple places below)
      const startsWithNumber = /^\s*\d/.test(trimmedLine);
      
      // Skip lines that are just section headers (all caps, ends with colon)
      if (trimmedLine === trimmedLine.toUpperCase() || trimmedLine.endsWith(':')) {
        // Unless it has measurements or numbers, then might be ingredient with note
        if (!startsWithNumber && !measurementKeywords.some(k => lowerLine.includes(k))) {
          continue;
        }
      }
      
      // Skip very long lines (likely instructions)
      if (trimmedLine.length > 150) continue;
      
      // Skip time duration patterns like "10 mins", "3 hrs 30 mins"
      const isTimeDuration = /^\d+\s*(min|mins|hr|hrs|hour|hours)/.test(lowerLine) ||
                            /^\d+\s*(min|mins|hr|hrs)\s*·/.test(lowerLine);
      if (isTimeDuration) continue;
      
      // Skip standalone numbers or numbers with just "dishes"
      if (/^\d+$/.test(trimmedLine) || /^\d+\s*dishes?$/.test(lowerLine)) continue;
      
      // Skip lines that start with instruction verbs
      const startsWithInstruction = instructionStarters.some(verb => 
        lowerLine.startsWith(verb + ' ') || lowerLine.startsWith(verb + ':')
      );
      if (startsWithInstruction && trimmedLine.length > 50) continue;
      
      // Strong signals this IS an ingredient:
      
      // 1. Has measurement keywords (using pre-compiled regex)
      const hasMeasurement = measurementRegex.test(lowerLine);
      
      // 2. startsWithNumber already declared above
      
      // 3. Has fraction characters (½, ¼, ⅓, etc.)
      const hasFraction = /[½¼⅓⅔¾⅛⅜⅝⅞]/.test(trimmedLine);
      
      // 4. Contains common food words (using pre-compiled regex)
      const hasFoodWord = foodWordsRegex.test(lowerLine);
      
      // 5. In ingredients section or short line with food word (simple list)
      const isSimpleIngredient = inIngredientsSection || 
        (trimmedLine.length <= 60 && hasFoodWord && !startsWithInstruction);
      
      // 6. Parenthetical notes like "(or onion)" are often part of ingredients
      const hasParenthetical = /\([^)]+\)/.test(trimmedLine);
      
      // Decide if it's an ingredient
      if (hasMeasurement || startsWithNumber || hasFraction || 
          (isSimpleIngredient && !startsWithInstruction) ||
          (hasFoodWord && trimmedLine.length <= 50 && hasParenthetical)) {
        
        // Clean up the line
        let cleanLine = trimmedLine
          .replace(/^[-•*]\s*/, '') // Remove bullet points
          .replace(/^\d+\.\s*/, '') // Remove numbered lists
          .trim();
        
        if (cleanLine && cleanLine.length > 1 && !ingredients.includes(cleanLine)) {
          ingredients.push(cleanLine);
        }
      }
    }
    
    // Fallback: if we found very few ingredients, be more lenient
    if (ingredients.length < 5) {
      for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.length > 80 || ingredients.includes(trimmedLine)) continue;
        
        // Skip obvious non-ingredients
        const hasSkipKeyword = skipKeywords.some(keyword => lowerLine.includes(keyword));
        if (hasSkipKeyword) continue;
        
        const startsWithInstruction = instructionStarters.some(verb => 
          lowerLine.startsWith(verb + ' ')
        );
        if (startsWithInstruction) continue;
        
        // Include if it has a food word and is reasonably short
        const hasFoodWord = foodWords.some(food => {
          const foodPattern = new RegExp(`\\b${food}`, 'i');
          return foodPattern.test(lowerLine);
        });
        
        if (hasFoodWord && trimmedLine.length <= 60) {
          let cleanLine = trimmedLine.replace(/^[-•*]\s*/, '').trim();
          if (cleanLine && !ingredients.includes(cleanLine)) {
            ingredients.push(cleanLine);
          }
        }
      }
    }
    
    return ingredients;
  };

  /**
   * Parse tools from recipe text
   * Now uses shared utility from recipeParser.js for consistency
   */
  const parseToolsFromText = (text) => {
    return detectToolsFromText(text);
  };

  // Parse instructions from recipe text
  const parseInstructionsFromText = (text) => {
    const instructions = [];
    const lines = text.split('\n');
    let inInstructionsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      // Detect instructions section header
      if (lowerLine === 'instructions' || lowerLine === 'instructions:' || 
          lowerLine === 'directions' || lowerLine === 'directions:' ||
          lowerLine === 'steps' || lowerLine === 'steps:' ||
          lowerLine === 'method' || lowerLine === 'method:') {
        inInstructionsSection = true;
        continue;
      }
      
      // Stop at next section header
      if (lowerLine === 'ingredients' || lowerLine === 'ingredients:' ||
          lowerLine === 'notes' || lowerLine === 'notes:') {
        inInstructionsSection = false;
        continue;
      }
      
      // Skip empty lines or very short lines
      if (!line || line.length < 10) continue;
      
      // If in instructions section, add the line
      if (inInstructionsSection) {
        // Clean up numbered lists (1. or 1) prefix)
        const cleaned = line.replace(/^\d+[\.)]\s*/, '').trim();
        if (cleaned.length > 5) {
          instructions.push(cleaned);
        }
      } else {
        // Check if line starts with instruction verb or is numbered
        const startsWithNumber = /^\d+[\.)]\s*/.test(line);
        const startsWithInstruction = instructionStarters.some(verb => 
          lowerLine.startsWith(verb + ' ') || lowerLine.startsWith(verb + ',')
        );
        
        if ((startsWithNumber || startsWithInstruction) && line.length > 15) {
          const cleaned = line.replace(/^\d+[\.)]\s*/, '').trim();
          instructions.push(cleaned);
        }
      }
    }
    
    return instructions;
  };

  // Extract time in minutes from recipe text
  const extractTimeFromText = (text) => {
    const lowerText = text.toLowerCase();
    
    // Look for "total time:", "cook time:", "time:" patterns
    const timePatterns = [
      /(?:total|cook|prep)?\s*time:\s*(\d+)\s*(?:hours?|hrs?)?\s*(\d+)?\s*(?:minutes?|mins?)/i,
      /(\d+)\s*(?:hours?|hrs?)\s*(?:and\s*)?(\d+)?\s*(?:minutes?|mins?)/i,
      /(\d+)\s*(?:minutes?|mins?)/i,
    ];
    
    for (const pattern of timePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const hours = match[1] && !match[1].includes('minute') ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : (hours ? 0 : parseInt(match[1]));
        return (hours * 60) + minutes;
      }
    }
    
    return null;
  };

  // Extract servings/yield from recipe text
  const extractServingsFromText = (text) => {
    const lowerText = text.toLowerCase();
    
    // Look for "serves X", "servings: X", "yield: X", "makes X servings"
    const servingsPatterns = [
      /(?:serves?|servings?|yield):\s*(\d+)/i,
      /(?:makes|yields?)\s*(\d+)\s*servings?/i,
      /(\d+)\s*servings?/i,
    ];
    
    for (const pattern of servingsPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return null;
  };

  // Handle text submission
  const handleTextSubmit = async () => {
    const error = validateText(textInput);
    setTextError(error);
    
    // Validate title if provided manually
    if (!recipeTitle.trim()) {
      setTitleError('Please enter a recipe title');
      return;
    }
    
    if (!error) {
      // Parse ingredients, tools, instructions, time, and servings from text
      const ingredients = parseIngredientsFromText(textInput);
      const tools = parseToolsFromText(textInput);
      const instructions = parseInstructionsFromText(textInput);
      const time = extractTimeFromText(textInput);
      const dishes = extractServingsFromText(textInput);
      
      // Create properly formatted recipe object with user-provided title
      const recipeData = {
        id: `text-${Date.now()}`,
        name: recipeTitle.trim() || extractNameFromText(textInput) || 'Custom Recipe',
        url: null,
        recipeText: textInput,
        ingredients: ingredients,
        tools: tools,
        instructions: instructions,
        time: time,
        dishes: dishes,
        source: 'manual'
      };
      
      // Save to history
      try {
        await recipeService.addToHistory(recipeData);
      } catch (err) {
        console.error('Failed to save to history:', err);
        // Continue anyway
      }
      
      // Navigate to loading page with formatted data
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

  const handleTitleChange = (e) => {
    setRecipeTitle(e.target.value);
    if (titleError) setTitleError(''); // Clear error on change
  };

  return (
    <div className="generate-timeline">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
      
      <h1>Enter Recipe</h1>
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
          <label htmlFor="recipe-title" className="input-label">
            Recipe Title <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="recipe-title"
              type="text"
              className={`recipe-input ${titleError ? 'error' : ''}`}
              placeholder="Enter a title for your recipe (e.g., Grandma's Cookies)"
              value={recipeTitle}
              onChange={handleTitleChange}
            />
            {titleError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {titleError}
              </div>
            )}
          </div>

          <label htmlFor="text-input" className="input-label" style={{ marginTop: '20px' }}>
            Recipe Text <span className="required">*</span>
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
            disabled={!textInput.trim() || !recipeTitle.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateTimeline;
