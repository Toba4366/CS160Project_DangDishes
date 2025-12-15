import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import { parseRecipeWithReagent, convertReagentToTimeline } from '../services/reagentParser';
import './Loading.css';

const cookingTips = [
  "Tip: Read the entire recipe before starting to cook!",
  "Tip: Prep all ingredients before you start cooking (mise en place).",
  "Tip: Keep your knives sharp for safer, easier cutting.",
  "Tip: Let meat rest after cooking for juicier results.",
  "Tip: Season your food at every step, not just at the end.",
  "Tip: Save your pasta water - it's great for adjusting sauce consistency!",
  "Tip: Room temperature ingredients mix better in baking.",
  "App Tip: Use the ingredient history to quickly add common items.",
  "App Tip: Check off items as you gather them on the mise en place page.",
  "App Tip: View your cooking history to find your favorite recipes quickly!",
];

function Loading() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipeName, nextPage, recipeData, fromPage, filters } = location.state || {};
  const [scrapingFailed, setScrapingFailed] = useState(false);
  const hasNavigated = useRef(false);
  
  const randomTip = cookingTips[Math.floor(Math.random() * cookingTips.length)];

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
