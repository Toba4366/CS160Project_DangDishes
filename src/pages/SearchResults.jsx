import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import './SearchResults.css';

function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters } = location.state || {};

  const [webRecipes, setWebRecipes] = useState([]);
  const [historyRecipes, setHistoryRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both web results and history in parallel
        const [webData, historyData] = await Promise.all([
          recipeService.searchRecipes(
            filters?.selectedIngredients || ['chicken'],
            { maxResults: 10 }
          ),
          recipeService.getHistory()
        ]);

        setWebRecipes(webData.recipes || []);
        setHistoryRecipes(historyData.recipes || []);
      } catch (err) {
        console.error('Failed to fetch recipes:', err);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [filters]);

  const handleRecipeClick = async (recipe) => {
    // Save to history when clicked
    try {
      await recipeService.addToHistory(recipe);
    } catch (err) {
      console.error('Failed to add to history:', err);
    }

    navigate('/loading', { 
      state: { 
        recipeName: recipe.name,
        nextPage: 'mise-en-place',
        recipeData: recipe,
        fromPage: 'search-results'
      } 
    });
  };

  if (loading) {
    return (
      <div className="search-results">
        <button className="back-button" onClick={() => navigate('/recipe-search')}>
          ← Back
        </button>
        <h1>Loading recipes...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results">
        <button className="back-button" onClick={() => navigate('/recipe-search')}>
          ← Back
        </button>
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="search-results">
      <button className="back-button" onClick={() => navigate('/recipe-search')}>
        ← Back
      </button>

      <h1>Search Results</h1>

      <button 
        className="filter-toggle"
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? '▲' : '▼'} Adjust Filters
      </button>

      {showFilters && (
        <div className="filters-dropdown">
          <p>Filters: {filters?.selectedIngredients?.join(', ') || 'None'}</p>
          <p>Time: {filters?.minTime || 0} - {filters?.maxTime || 60} min</p>
          <p>Dishes: {filters?.minDishes || 1} - {filters?.maxDishes || 10}</p>
        </div>
      )}

      {historyRecipes.length > 0 && (
        <div className="recipe-section">
          <h2>Your Previous Recipes</h2>
          <div className="recipe-list">
            {historyRecipes.map(recipe => (
              <button 
                key={recipe.id} 
                className="recipe-button"
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="recipe-name">{recipe.name}</div>
                <div className="recipe-details">
                  {recipe.time} min · {recipe.dishes} dishes
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {webRecipes.length > 0 && (
        <div className="recipe-section">
          <h2>Recipes from the Web</h2>
          <div className="recipe-list">
            {webRecipes.map(recipe => (
              <button 
                key={recipe.id} 
                className="recipe-button"
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="recipe-name">{recipe.name || 'Untitled Recipe'}</div>
                <div className="recipe-details">
                  {recipe.time} min · {recipe.dishes} dishes
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {webRecipes.length === 0 && historyRecipes.length === 0 && (
        <div className="recipe-section">
          <p>No recipes found. Try different ingredients!</p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
