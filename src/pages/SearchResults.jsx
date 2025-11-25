import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SearchResults.css';

interface Recipe {
  id: string;
  name: string;
  time: number;
  dishes: number;
  isHistory: boolean;
}

function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters } = location.state || {};

  // Mock recipe data - in a real app, this would come from an API
  const [recipes] = useState<Recipe[]>([
    { id: '1', name: 'Scrambled Eggs', time: 10, dishes: 2, isHistory: true },
    { id: '2', name: 'Fried Egg on Toast', time: 15, dishes: 3, isHistory: true },
    { id: '3', name: 'Classic Omelette', time: 12, dishes: 2, isHistory: false },
    { id: '4', name: 'Egg Fried Rice', time: 25, dishes: 4, isHistory: false },
    { id: '5', name: 'Poached Eggs Benedict', time: 30, dishes: 5, isHistory: false },
  ]);

  const [showFilters, setShowFilters] = useState(false);

  const historyRecipes = recipes.filter(r => r.isHistory);
  const webRecipes = recipes.filter(r => !r.isHistory);

  const handleRecipeClick = (recipe: Recipe) => {
    navigate('/loading', { 
      state: { 
        recipeName: recipe.name,
        nextPage: 'mise-en-place',
        recipeData: recipe 
      } 
    });
  };

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
                <div className="recipe-name">{recipe.name}</div>
                <div className="recipe-details">
                  {recipe.time} min · {recipe.dishes} dishes
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
