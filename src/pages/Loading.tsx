import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const { recipeName, nextPage, recipeData, fromPage } = location.state || {};
  
  const randomTip = cookingTips[Math.floor(Math.random() * cookingTips.length)];

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      if (nextPage === 'timeline') {
        navigate('/timeline', { state: { recipeName, recipeData, fromPage }, replace: true });
      } else if (nextPage === 'search-results') {
        navigate('/search-results', { state: { recipeName, recipeData, fromPage }, replace: true });
      } else {
        navigate('/mise-en-place', { state: { recipeName, recipeData, fromPage }, replace: true });
      }
    }, 2500); // 2.5 seconds loading time

    return () => clearTimeout(timer);
  }, [navigate, nextPage, recipeName, recipeData, fromPage]);

  return (
    <div className="loading">
      <h1>Loading Timeline</h1>
      <div className="spinner"></div>
      <p className="cooking-tip">{randomTip}</p>
    </div>
  );
}

export default Loading;
