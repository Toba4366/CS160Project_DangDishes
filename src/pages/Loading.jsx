import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import { parseRecipeWithReagent, convertReagentToTimeline } from '../services/reagentParser';
import './Loading.css';

const cookingTips = [
  "💡 Read the entire recipe before starting to cook!",
  "💡 Prep all ingredients before you start cooking (mise en place).",
  "💡 Keep your knives sharp for safer, easier cutting.",
  "💡 Let meat rest after cooking for juicier results.",
  "💡 Season your food at every step, not just at the end.",
  "💡 Save your pasta water - it's great for adjusting sauce consistency!",
  "💡 Room temperature ingredients mix better in baking.",
  "💡 Preheat your oven while prepping ingredients to save time.",
  "💡 Make sure your pan is hot before adding ingredients for best searing.",
  "💡 Use a timer for each step to stay on track with your timeline.",
  "💡 Clean as you go to make post-cooking cleanup easier.",
  "💡 Taste and adjust seasonings throughout the cooking process.",
  "💡 Use fresh herbs at the end of cooking to preserve their flavor.",
  "💡 Don't overcrowd your pan - cook in batches if needed.",
  "💡 Let vegetables reach room temperature before roasting.",
  "💡 Use a meat thermometer to ensure perfect doneness.",
  "💡 Toast spices in a dry pan to enhance their aroma.",
  "💡 Add acidic ingredients (lemon, vinegar) to brighten flavors.",
  "💡 Deglaze your pan with wine or stock to make a quick sauce.",
  "💡 Let baked goods cool completely before cutting for clean slices.",
  "💡 Use the back of a spoon to taste hot dishes safely.",
  "💡 Keep a clean, damp towel nearby for quick hand cleaning.",
  "💡 Organize your workspace to move efficiently between tasks.",
  "💡 Set out all tools before starting to avoid mid-recipe searches.",
  "💡 Check expiration dates on spices - they lose potency over time.",
  "💡 Use kitchen scissors to quickly chop herbs right into dishes.",
  "💡 Keep your cutting board stable with a damp towel underneath.",
  "💡 Practice your knife skills during prep to improve speed.",
  "💡 Invest in quality cookware that heats evenly for consistent results.",
  "💡 Learn the difference between simmering, boiling, and poaching.",
  "📱 Use the ingredient history to quickly add common items.",
  "📱 Check off items as you gather them on the mise en place page.",
  "📱 View your cooking history to find your favorite recipes quickly!",
  "📱 Use the search filters to find recipes matching your dietary needs.",
  "📱 Save recipes to your history for easy access later.",
  "📱 Toggle between horizontal and vertical timeline layouts.",
  "📱 Mark completed steps on the timeline to track your progress.",
  "📱 Edit saved recipes to add personal notes or adjustments.",
];

// Generate context-aware tip based on recipe data
const generateContextAwareTip = (recipeData) => {
  if (!recipeData) return null;
  
  const tools = (recipeData.tools || []).map(t => typeof t === 'string' ? t.toLowerCase() : (t.name || '').toLowerCase());
  const instructions = (recipeData.instructions || []).join(' ').toLowerCase();
  const ingredients = (recipeData.ingredients || []).join(' ').toLowerCase();
  
  // Oven tips
  if (tools.includes('oven') || instructions.includes('oven') || instructions.includes('bake') || instructions.includes('roast')) {
    return "🔥 Preheat your oven during prep - it'll be ready when you are!";
  }
  
  // Pan/skillet tips
  if (tools.some(t => t.includes('pan') || t.includes('skillet')) || instructions.includes('sauté') || instructions.includes('fry')) {
    return "🍳 Heat your pan before adding ingredients for better searing and browning.";
  }
  
  // Knife work tips
  if (instructions.includes('chop') || instructions.includes('dice') || instructions.includes('mince') || instructions.includes('slice')) {
    return "🔪 Keep your knife sharp and fingers curled for safe, efficient cutting.";
  }
  
  // Meat tips
  if (ingredients.includes('chicken') || ingredients.includes('beef') || ingredients.includes('pork') || ingredients.includes('steak')) {
    return "🥩 Let meat rest after cooking to lock in juices and improve tenderness.";
  }
  
  // Pasta tips
  if (ingredients.includes('pasta') || instructions.includes('pasta')) {
    return "🍝 Save a cup of pasta water before draining - it's perfect for sauce consistency!";
  }
  
  // Baking tips
  if (tools.includes('mixing bowl') || instructions.includes('mix') || instructions.includes('whisk')) {
    return "🥣 Room temperature ingredients blend more easily and create better texture.";
  }
  
  // Multiple dishes tip
  if ((recipeData.dishes || 0) > 4) {
    return "🧼 With many dishes to wash, clean as you go to save time at the end!";
  }
  
  // Long recipe tip
  if ((recipeData.time || 0) > 45) {
    return "⏱️ This recipe takes a while - use passive cooking time to prep other ingredients!";
  }
  
  return null;
};

// Get a random tip that hasn't been shown recently
const getRandomTip = (recipeData) => {
  // Try context-aware tip first (70% chance)
  if (recipeData && Math.random() < 0.7) {
    const contextTip = generateContextAwareTip(recipeData);
    if (contextTip) return contextTip;
  }
  
  const SHOWN_TIPS_KEY = 'shown-tips';
  const MAX_SHOWN_TIPS = 10;
  
  try {
    const shownTipsStr = sessionStorage.getItem(SHOWN_TIPS_KEY);
    const shownTips = shownTipsStr ? JSON.parse(shownTipsStr) : [];
    
    // Filter out recently shown tips
    const availableTips = cookingTips.filter(tip => !shownTips.includes(tip));
    
    // If all tips have been shown, reset
    const tipsToChooseFrom = availableTips.length > 0 ? availableTips : cookingTips;
    const selectedTip = tipsToChooseFrom[Math.floor(Math.random() * tipsToChooseFrom.length)];
    
    // Track shown tip
    const updatedShownTips = [...shownTips, selectedTip].slice(-MAX_SHOWN_TIPS);
    sessionStorage.setItem(SHOWN_TIPS_KEY, JSON.stringify(updatedShownTips));
    
    return selectedTip;
  } catch (err) {
    // Fallback if sessionStorage fails
    return cookingTips[Math.floor(Math.random() * cookingTips.length)];
  }
};

function Loading() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipeName, nextPage, recipeData, fromPage, filters } = location.state || {};
  const [scrapingFailed, setScrapingFailed] = useState(false);
  const hasNavigated = useRef(false);
  
  const randomTip = getRandomTip(recipeData);

  // Determine loading message based on next page
  const getLoadingMessage = () => {
    if (nextPage === 'timeline') return 'Generating Timeline';
    if (nextPage === 'search-results') return 'Searching Recipes';
    if (nextPage === 'mise-en-place') return 'Preparing Checklist';
    return 'Loading';
  };

  useEffect(() => {
    const fetchDataAndNavigate = async () => {
      // Prevent multiple navigations from React Strict Mode
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      
      let finalRecipeData = recipeData;
      let scrapingFailed = false;

      // If recipe has a URL and is from manual entry, fetch ingredients/tools
      if (recipeData?.url && recipeData?.source === 'manual' && fromPage === 'generate-timeline') {
        try {
          const details = await recipeService.getRecipeDetails(recipeData.url);
          
          // Check if scraping actually returned data
          if (!details.ingredients || details.ingredients.length === 0) {
            scrapingFailed = true;
            setScrapingFailed(true);
          } else {
            // Preserve needsSaving flag when merging details
            finalRecipeData = { ...recipeData, ...details, needsSaving: recipeData.needsSaving };
          }
        } catch (err) {
          console.error('Failed to fetch recipe details:', err);
          scrapingFailed = true;
          setScrapingFailed(true);
        }
      }

      // Start timing for minimum loading screen duration
      const startTime = Date.now();

      // If going to timeline, parse with Reagent first
      let llmParsedData = null;
      if (nextPage === 'timeline' && finalRecipeData) {
        // Check cache first to save API tokens
        const cached = recipeService.getCachedTimeline(recipeName || finalRecipeData.url);
        if (cached) {
          llmParsedData = cached;
          console.log('💰 Using cached timeline data - no API call needed!');
        } else {
          console.log('🚀 Calling Reagent during loading screen...');
          try {
          const instructions = finalRecipeData?.instructions || finalRecipeData?.recipeText;
          const tools = finalRecipeData?.tools || [];
          
          if (instructions) {
            const result = await parseRecipeWithReagent(instructions, tools, {
              dishName: recipeName,
              servings: finalRecipeData?.servings
            });
            
            if (result) {
              llmParsedData = convertReagentToTimeline(result);
              console.log('✅ Reagent parsing complete during loading!');
              
              // Cache for future use using consolidated caching logic (DRY)
              recipeService.cacheTimeline(finalRecipeData, llmParsedData);
            }
          }
        } catch (error) {
          console.error('Reagent parsing failed during loading:', error);
          // Continue anyway with fallback
        }
        }
      }

      // Ensure minimum total time on loading screen (including Reagent parsing)
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, (scrapingFailed ? 1000 : 2500) - elapsed);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // If scraping failed, don't navigate - show error message
      if (scrapingFailed) {
        return; // Stay on loading page to show error
      }

      // Navigate to next page
      if (nextPage === 'timeline') {
        navigate('/timeline', { 
          state: { 
            recipeName, 
            recipeData: finalRecipeData, 
            fromPage,
            llmParsedData // Pass pre-fetched Reagent data
          }, 
          replace: true 
        });
      } else if (nextPage === 'search-results') {
        navigate('/search-results', { state: { recipeName, recipeData: finalRecipeData, fromPage, filters }, replace: true });
      } else {
        navigate('/mise-en-place', { state: { recipeName, recipeData: finalRecipeData, fromPage }, replace: true });
      }
    };

    fetchDataAndNavigate();
  }, [navigate, nextPage, recipeName, recipeData, fromPage, filters]);

  if (scrapingFailed) {
    return (
      <div className="loading">
        <h1>Backend Not Available</h1>
        <div className="error-message">
          <p>⚠️ Unable to scrape recipe from URL</p>
          <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
            The backend server needs to be running to extract ingredients from recipe URLs.
          </p>
          <div style={{ marginTop: '30px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>To fix this:</p>
            <ol style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto', lineHeight: '1.8' }}>
              <li>Open a terminal in the project directory</li>
              <li>Run: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>cd backend && python app.py</code></li>
              <li>Wait for "Running on http://localhost:8000"</li>
              <li>Try submitting your recipe URL again</li>
            </ol>
          </div>
          <div style={{ marginTop: '30px' }}>
            <p style={{ fontWeight: 'bold' }}>Or alternatively:</p>
            <p>Copy and paste the recipe text directly instead of using a URL</p>
          </div>
        </div>
        <button 
          className="retry-button" 
          onClick={() => navigate('/generate-timeline')}
          style={{ marginTop: '30px' }}
        >
          ← Back to Recipe Input
        </button>
      </div>
    );
  }

  return (
    <div className="loading">
      <h1>{getLoadingMessage()}</h1>
      <div className="spinner"></div>
      <p className="cooking-tip">{randomTip}</p>
    </div>
  );
}

export default Loading;
