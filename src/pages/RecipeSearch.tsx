import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecipeSearch.css';

interface IngredientHistory {
  name: string;
  lastUsed: string;
}

function RecipeSearch() {
  const navigate = useNavigate();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(60);
  const [minDishes, setMinDishes] = useState(1);
  const [maxDishes, setMaxDishes] = useState(10);

  // Mock ingredient history - in a real app, this would come from local storage or a database
  const [ingredientHistory, setIngredientHistory] = useState<IngredientHistory[]>([
    { name: 'eggs', lastUsed: '2 days ago' },
    { name: 'butter', lastUsed: '3 days ago' },
    { name: 'flour', lastUsed: '1 week ago' },
    { name: 'chicken', lastUsed: '2 weeks ago' },
  ]);

  const addIngredient = (ingredient: string) => {
    if (ingredient && !selectedIngredients.includes(ingredient.toLowerCase())) {
      setSelectedIngredients([...selectedIngredients, ingredient.toLowerCase()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
  };

  const removeFromHistory = (ingredient: string) => {
    setIngredientHistory(ingredientHistory.filter(i => i.name !== ingredient));
  };

  const handleSearch = () => {
    navigate('/loading', { 
      state: { 
        recipeName: 'Search Results',
        nextPage: 'search-results',
        filters: { selectedIngredients, minTime, maxTime, minDishes, maxDishes }
      } 
    });
  };

  return (
    <div className="recipe-search">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>

      <h1>Recipe Search</h1>
      <p className="description">
        Select ingredients and set your preferences to find the perfect recipe!
      </p>

      <div className="ingredients-section">
        <h2>Type Ingredients</h2>
        <div className="ingredient-input-container">
          <input
            type="text"
            className="ingredient-input"
            placeholder="Type ingredients"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient(ingredientInput)}
          />
          <button className="add-button" onClick={() => addIngredient(ingredientInput)}>
            Add
          </button>
        </div>

        {selectedIngredients.length > 0 && (
          <div className="selected-ingredients">
            <h3>Selected:</h3>
            <div className="ingredient-tags">
              {selectedIngredients.map(ingredient => (
                <span key={ingredient} className="ingredient-tag">
                  {ingredient}
                  <button onClick={() => removeIngredient(ingredient)}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="ingredient-history">
          <h3>Recent Ingredients</h3>
          <div className="history-list">
            {ingredientHistory.map(item => (
              <div key={item.name} className="history-item">
                <span 
                  className="ingredient-name"
                  onClick={() => addIngredient(item.name)}
                >
                  {item.name}
                </span>
                <span className="last-used">
                  {item.lastUsed}
                  <button 
                    className="delete-button"
                    onClick={() => removeFromHistory(item.name)}
                  >
                    🗑️
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="filters-section">
        <h2>Filters</h2>
        
        <div className="filter-group">
          <label>Time (minutes)</label>
          <div className="range-inputs">
            <div className="input-with-buttons">
              <button onClick={() => setMinTime(Math.max(0, minTime - 1))}>−</button>
              <input
                type="number"
                value={minTime}
                onChange={(e) => setMinTime(Number(e.target.value))}
                min="0"
              />
              <button onClick={() => setMinTime(minTime + 1)}>+</button>
            </div>
            <span>to</span>
            <div className="input-with-buttons">
              <button onClick={() => setMaxTime(Math.max(minTime, maxTime - 1))}>−</button>
              <input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(Number(e.target.value))}
                min={minTime}
              />
              <button onClick={() => setMaxTime(maxTime + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="filter-group">
          <label>Number of Dishes</label>
          <div className="range-inputs">
            <div className="input-with-buttons">
              <button onClick={() => setMinDishes(Math.max(1, minDishes - 1))}>−</button>
              <input
                type="number"
                value={minDishes}
                onChange={(e) => setMinDishes(Number(e.target.value))}
                min="1"
              />
              <button onClick={() => setMinDishes(minDishes + 1)}>+</button>
            </div>
            <span>to</span>
            <div className="input-with-buttons">
              <button onClick={() => setMaxDishes(Math.max(minDishes, maxDishes - 1))}>−</button>
              <input
                type="number"
                value={maxDishes}
                onChange={(e) => setMaxDishes(Number(e.target.value))}
                min={minDishes}
              />
              <button onClick={() => setMaxDishes(maxDishes + 1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      <button className="search-button" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}

export default RecipeSearch;
