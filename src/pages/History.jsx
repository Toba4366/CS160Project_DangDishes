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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const formatLastCooked = (isoString) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recipeService.getHistory();
        setHistory(data.recipes || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Separate uploaded recipes from web recipes
  const uploadedRecipes = history.filter(r => r.source === 'manual');
  const webRecipes = history.filter(r => r.source !== 'manual');

  const handleDelete = async (recipeId, event) => {
    event.stopPropagation(); // Prevent recipe click
    
    if (!confirm('Are you sure you want to delete this recipe from your history?')) {
      return;
    }

    setDeletingId(recipeId);
    try {
      await recipeService.deleteFromHistory(recipeId);
      // Update local state to remove the deleted recipe
      setHistory(history.filter(r => r.id !== recipeId));
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert('Failed to delete recipe. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (recipe, event) => {
    event.stopPropagation(); // Prevent recipe click
    // Navigate to edit page (we'll create this)
    navigate('/edit-recipe', { 
      state: { recipe } 
    });
  };

  const handleRecipeClick = async (recipe) => {
    // If recipe has a URL and doesn't have ingredients/tools, fetch them
    let fullRecipeData = recipe;
    if (recipe.url && (!recipe.ingredients || !recipe.tools)) {
      try {
        const details = await recipeService.getRecipeDetails(recipe.url);
        fullRecipeData = { ...recipe, ...details };
      } catch (err) {
        console.error('Failed to fetch recipe details:', err);
        // Continue with basic data if details fetch fails
      }
    }
    
    // Navigate directly to mise-en-place with the recipe data
    navigate('/mise-en-place', { 
      state: { 
        recipeName: fullRecipeData.name,
        recipeData: fullRecipeData,
        fromPage: 'history'
      } 
    });
  };

  if (loading) {
    return (
      <div className="history">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Cooking History</h1>
        <p className="description">Loading your cooking history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>Cooking History</h1>
        <p className="description error">{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="history">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>

      <h1>Cooking History</h1>
      <p className="description">View all the recipes you've made before</p>

      {history.length === 0 && (
        <div className="empty-state">
          <p>No recipes cooked yet! Start by searching for recipes or generating a timeline.</p>
        </div>
      )}

      {uploadedRecipes.length > 0 && (
        <div className="history-section">
          <h2>Your Uploaded Recipes</h2>
          <div className="history-list">
            {uploadedRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-item">
                <button 
                  className="recipe-button"
                  onClick={() => handleRecipeClick(recipe)}
                  disabled={deletingId === recipe.id}
                >
                  <div className="recipe-header">
                    <div className="recipe-name">{recipe.name}</div>
                    <div className="last-cooked">{formatLastCooked(recipe.lastCooked)}</div>
                  </div>
                  <div className="recipe-details">
                    {recipe.time ? `${recipe.time} min` : 'Time not set'} · {recipe.dishes ? `${recipe.dishes} dishes` : 'Dishes not set'}
                  </div>
                  {recipe.nutritionFacts && Object.keys(recipe.nutritionFacts).some(key => recipe.nutritionFacts[key]) && (
                    <div className="nutrition-preview">
                      {recipe.nutritionFacts.calories && <span>🔥 {recipe.nutritionFacts.calories} cal</span>}
                      {recipe.nutritionFacts.protein && <span>💪 {recipe.nutritionFacts.protein}g protein</span>}
                    </div>
                  )}
                </button>
                <div className="recipe-actions">
                  <button 
                    className="edit-button"
                    onClick={(e) => handleEdit(recipe, e)}
                    title="Edit recipe"
                    disabled={deletingId === recipe.id}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDelete(recipe.id, e)}
                    title="Delete recipe"
                    disabled={deletingId === recipe.id}
                  >
                    {deletingId === recipe.id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {webRecipes.length > 0 && (
        <div className="history-section">
          <h2>Recipes from the Web</h2>
          <div className="history-list">
            {webRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-item">
                <button 
                  className="recipe-button"
                  onClick={() => handleRecipeClick(recipe)}
                  disabled={deletingId === recipe.id}
                >
                  <div className="recipe-header">
                    <div className="recipe-name">{recipe.name}</div>
                    <div className="last-cooked">{formatLastCooked(recipe.lastCooked)}</div>
                  </div>
                  <div className="recipe-details">
                    {recipe.time ? `${recipe.time} min` : 'Time not set'} · {recipe.dishes ? `${recipe.dishes} dishes` : 'Dishes not set'}
                  </div>
                  {recipe.nutritionFacts && Object.keys(recipe.nutritionFacts).some(key => recipe.nutritionFacts[key]) && (
                    <div className="nutrition-preview">
                      {recipe.nutritionFacts.calories && <span>🔥 {recipe.nutritionFacts.calories} cal</span>}
                      {recipe.nutritionFacts.protein && <span>💪 {recipe.nutritionFacts.protein}g protein</span>}
                    </div>
                  )}
                </button>
                <div className="recipe-actions">
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDelete(recipe.id, e)}
                    title="Delete recipe"
                    disabled={deletingId === recipe.id}
                  >
                    {deletingId === recipe.id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
