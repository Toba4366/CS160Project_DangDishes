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
  const [enhancedRecipeData, setEnhancedRecipeData] = useState(recipeData);
  
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

      // If recipe has a URL and is from manual entry, fetch ingredients/tools
      if (recipeData?.url && recipeData?.source === 'manual' && fromPage === 'generate-timeline') {
        try {
          console.log('Fetching recipe details for URL:', recipeData.url);
          const details = await recipeService.getRecipeDetails(recipeData.url);
          finalRecipeData = { ...recipeData, ...details };
          setEnhancedRecipeData(finalRecipeData);
          console.log('Fetched details:', details);
        } catch (err) {
          console.error('Failed to fetch recipe details:', err);
          // Continue with original data if fetch fails
        }
      }

      // Wait minimum 2.5 seconds for better UX
      await new Promise(resolve => setTimeout(resolve, 2500));

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

  return (
    <div className="loading">
      <h1>{getLoadingMessage()}</h1>
      <div className="spinner"></div>
      <p className="cooking-tip">{randomTip}</p>
    </div>
  );
}

export default Loading;
