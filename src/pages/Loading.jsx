import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
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
            setEnhancedRecipeData(finalRecipeData);
          }
        } catch (err) {
          console.error('Failed to fetch recipe details:', err);
          scrapingFailed = true;
          setScrapingFailed(true);
        }
      }

      // Wait minimum 2.5 seconds for better UX (or longer if showing error)
      await new Promise(resolve => setTimeout(resolve, scrapingFailed ? 1000 : 2500));

      // If scraping failed, don't navigate - show error message
      if (scrapingFailed) {
        return; // Stay on loading page to show error
      }

      // Navigate to next page
      if (nextPage === 'timeline') {
        navigate('/timeline', { state: { recipeName, recipeData: finalRecipeData, fromPage }, replace: true });
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
