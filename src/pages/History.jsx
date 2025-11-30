import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import './History.css';

/**
 * JOSH'S TASK: Implement Real History Data Fetching
 * 
 * OVERVIEW OF EXISTING HISTORY SYSTEM:
 * ====================================
 * 1. We have a recipeService in src/services/recipeService.js that handles ALL recipe operations
 * 2. The backend API endpoint is /api/history (GET, POST, DELETE)
 * 3. If backend is not running, history automatically falls back to localStorage
 * 4. History is stored with these fields:
 *    - id: unique identifier
 *    - name: recipe name (string)
 *    - url: recipe URL (string, optional)
 *    - time: cooking time in minutes (number)
 *    - dishes: number of dishes/servings (number)
 *    - lastCooked: ISO timestamp string (e.g., "2024-11-29T12:00:00.000Z")
 *    - cookCount: number of times cooked (number)
 *    - isHistory: boolean flag (always true for history items)
 * 
 * HOW TO IMPLEMENT:
 * =================
 * STEP 1: Add recipeService import (already done above)
 * 
 * STEP 2: Replace mock useState with real state + loading/error states:
 *   const [history, setHistory] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 * 
 * STEP 3: Create a useEffect hook to fetch history on component mount:
 *   useEffect(() => {
 *     const fetchHistory = async () => {
 *       try {
 *         setLoading(true);
 *         setError(null);
 *         const data = await recipeService.getHistory(); // Call the API
 *         setHistory(data.recipes || []); // data.recipes is an array
 *       } catch (err) {
 *         console.error('Failed to fetch history:', err);
 *         setError('Failed to load history');
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 *     fetchHistory();
 *   }, []); // Empty dependency array = run once on mount
 * 
 * STEP 4: Format lastCooked timestamps to human-readable format:
 *   You'll need to convert ISO timestamps to "2 days ago" format.
 *   Create a helper function like:
 *   
 *   const formatLastCooked = (isoString) => {
 *     const date = new Date(isoString);
 *     const now = new Date();
 *     const diffMs = now - date;
 *     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
 *     
 *     if (diffDays === 0) return 'Today';
 *     if (diffDays === 1) return 'Yesterday';
 *     if (diffDays < 7) return `${diffDays} days ago`;
 *     if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
 *     return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
 *   };
 * 
 * STEP 5: Add loading and error UI:
 *   if (loading) return <div>Loading history...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (history.length === 0) return <div>No recipes cooked yet!</div>;
 * 
 * STEP 6: Update the map to use formatLastCooked:
 *   {history.map(recipe => (
 *     ...
 *     <div className="last-cooked">{formatLastCooked(recipe.lastCooked)}</div>
 *     ...
 *   ))}
 * 
 * REFERENCE:
 * - See src/pages/SearchResults.jsx for a working example of fetching from recipeService
 * - See src/services/recipeService.js for all available functions
 * - Backend code is in backend/app.py and backend/database.py
 */

function History() {
  const navigate = useNavigate();

  // TODO (JOSH): Replace this mock data with real API call to recipeService.getHistory()
  // See detailed instructions in comments above!
  const [history] = useState([
    { id: '1', name: 'Fried Egg on Toast', time: 15, dishes: 3, lastCooked: '2 days ago' },
    { id: '2', name: 'Scrambled Eggs', time: 10, dishes: 2, lastCooked: '3 days ago' },
    { id: '3', name: 'Spaghetti Carbonara', time: 25, dishes: 4, lastCooked: '1 week ago' },
    { id: '4', name: 'Grilled Cheese Sandwich', time: 10, dishes: 2, lastCooked: '1 week ago' },
    { id: '5', name: 'Chicken Stir Fry', time: 30, dishes: 5, lastCooked: '2 weeks ago' },
  ]);

  const handleRecipeClick = (recipe) => {
    navigate('/mise-en-place', { 
      state: { 
        recipeName: recipe.name,
        recipeData: recipe,
        fromPage: 'history'
      } 
    });
  };

  return (
    <div className="history">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>

      <h1>Cooking History</h1>
      <p className="description">View all the recipes you've made before</p>

      <div className="history-list">
        {history.map(recipe => (
          <button 
            key={recipe.id} 
            className="recipe-button"
            onClick={() => handleRecipeClick(recipe)}
          >
            <div className="recipe-header">
              <div className="recipe-name">{recipe.name}</div>
              <div className="last-cooked">{recipe.lastCooked}</div>
            </div>
            <div className="recipe-details">
              {recipe.time} min · {recipe.dishes} dishes
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default History;
