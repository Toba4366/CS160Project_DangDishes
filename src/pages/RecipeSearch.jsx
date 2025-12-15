import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecipeSearch.css';

function RecipeSearch() {
  const navigate = useNavigate();
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [recipeNameSearch, setRecipeNameSearch] = useState('');
  const [minTime, setMinTime] = useState(0);
  const [maxTime, setMaxTime] = useState(60);
  const [minDishes, setMinDishes] = useState(1);
  const [maxDishes, setMaxDishes] = useState(10);
  const [minServings, setMinServings] = useState(1);
  const [maxServings, setMaxServings] = useState(8);
  const [minIngredients, setMinIngredients] = useState(1);
  const [maxIngredients, setMaxIngredients] = useState(20);
  const [dietaryTags, setDietaryTags] = useState([]);

  // Mock ingredient history - in a real app, this would come from local storage or a database
  const [ingredientHistory, setIngredientHistory] = useState([
    { name: 'eggs', lastUsed: '2 days ago' },
    { name: 'butter', lastUsed: '3 days ago' },
    { name: 'flour', lastUsed: '1 week ago' },
    { name: 'chicken', lastUsed: '2 weeks ago' },
  ]);

  const addIngredient = (ingredient) => {
    if (ingredient && !selectedIngredients.includes(ingredient.toLowerCase().trim())) {
      setSelectedIngredients([...selectedIngredients, ingredient.toLowerCase().trim()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
  };

  const removeFromHistory = (ingredient) => {
    setIngredientHistory(ingredientHistory.filter(i => i.name !== ingredient));
  };

  const toggleDietaryTag = (tag) => {
    if (dietaryTags.includes(tag)) {
      setDietaryTags(dietaryTags.filter(t => t !== tag));
    } else {
      setDietaryTags([...dietaryTags, tag]);
    }
  };

  const handleSearch = () => {
    if (selectedIngredients.length === 0 && !recipeNameSearch.trim()) {
      alert('Please select at least one ingredient or enter a recipe name to search');
      return;
    }

    navigate('/loading', {
      state: {
        recipeName: 'Search Results',
        nextPage: 'search-results',
        filters: { 
          selectedIngredients, 
          recipeNameSearch: recipeNameSearch.trim(),
          minTime, 
          maxTime, 
          minDishes, 
          maxDishes,
          minServings,
          maxServings,
          minIngredients,
          maxIngredients,
          dietaryTags
        },
        fromPage: 'recipe-search'
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
        Search by recipe name or ingredients, and set your preferences to find the perfect recipe!
      </p>

      <div className="recipe-name-section">
        <h2>Search by Recipe Name</h2>
        <p className="section-hint">You can search for a specific recipe by name</p>
        <input
          type="text"
          className="recipe-name-input"
          placeholder="Enter recipe name (e.g., Chicken Parmesan, Chocolate Cake)..."
          value={recipeNameSearch}
          onChange={(e) => setRecipeNameSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
      </div>

      <div className="or-divider">
        <span>OR</span>
      </div>

      <div className="ingredients-section">
        <div className="section-header">
          <h2>Ingredients</h2>
        </div>

        <div className="ingredient-input-container">
          <input
            type="text"
            className="ingredient-input"
            placeholder="Type ingredient name (e.g., chicken, rice, tomatoes)..."
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIngredient(ingredientInput);
              }
            }}
          />
          <button
            className="add-button"
            onClick={() => addIngredient(ingredientInput)}
            disabled={!ingredientInput.trim()}
          >
            Add
          </button>
        </div>

        {selectedIngredients.length > 0 && (
          <div className="selected-ingredients">
            <h3>Selected Ingredients ({selectedIngredients.length})</h3>
            <div className="ingredient-tags">
              {selectedIngredients.map(ingredient => (
                <span key={ingredient} className="ingredient-tag">
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    title="Remove ingredient"
                    aria-label={`Remove ${ingredient}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="ingredient-history">
          <div className="history-header">
            <h3>Recent Ingredients</h3>
          </div>
          <p className="section-hint">Click an ingredient to add it to your search</p>
          <div className="history-list">
            {ingredientHistory.map(item => (
              <div
                key={item.name}
                className="history-item"
                onClick={() => addIngredient(item.name)}
                style={{ cursor: 'pointer' }}
                title={`Add ${item.name} to search`}
              >
                <span className="ingredient-name-btn">
                  {item.name}
                </span>

                <span className="last-used">
                  Last used: {item.lastUsed}
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.name);
                    }}
                    title="Remove from history"
                    aria-label={`Remove ${item.name} from history`}
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
        <div className="section-header">
          <h2>Filters</h2>
        </div>

        <div className="filter-group">
          <label>
            Cooking Time (minutes)
            <span className="filter-hint">How long you want to spend cooking</span>
          </label>
          <div className="range-inputs">
            <div className="input-with-buttons">
              <button
                onClick={() => setMinTime(Math.max(0, minTime - 5))}
                aria-label="Decrease minimum time"
              >
                −
              </button>
              <input
                type="number"
                value={minTime}
                onChange={(e) => setMinTime(Math.max(0, Number(e.target.value)))}
                min="0"
                aria-label="Minimum cooking time"
              />
              <button
                onClick={() => setMinTime(Math.min(maxTime, minTime + 5))}
                aria-label="Increase minimum time"
              >
                +
              </button>
            </div>
            <span className="range-separator">to</span>
            <div className="input-with-buttons">
              <button
                onClick={() => setMaxTime(Math.max(minTime, maxTime - 5))}
                aria-label="Decrease maximum time"
              >
                −
              </button>
              <input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(Math.max(minTime, Number(e.target.value)))}
                min={minTime}
                aria-label="Maximum cooking time"
              />
              <button
                onClick={() => setMaxTime(maxTime + 5)}
                aria-label="Increase maximum time"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="filter-group">
          <label>
            Number of Dishes to Clean
            <span className="filter-hint">Fewer dishes = easier cleanup!</span>
          </label>
          <div className="range-inputs">
            <div className="input-with-buttons">
              <button
                onClick={() => setMinDishes(Math.max(1, minDishes - 1))}
                aria-label="Decrease minimum dishes"
              >
                −
              </button>
              <input
                type="number"
                value={minDishes}
                onChange={(e) => setMinDishes(Math.max(1, Number(e.target.value)))}
                min="1"
                aria-label="Minimum number of dishes"
              />
              <button
                onClick={() => setMinDishes(Math.min(maxDishes, minDishes + 1))}
                aria-label="Increase minimum dishes"
              >
                +
              </button>
            </div>
            <span className="range-separator">to</span>
            <div className="input-with-buttons">
              <button
                onClick={() => setMaxDishes(Math.max(minDishes, maxDishes - 1))}
                aria-label="Decrease maximum dishes"
              >
                −
              </button>
              <input
                type="number"
                value={maxDishes}
                onChange={(e) => setMaxDishes(Math.max(minDishes, Number(e.target.value)))}
                min={minDishes}
                aria-label="Maximum number of dishes"
              />
              <button
                onClick={() => setMaxDishes(maxDishes + 1)}
                aria-label="Increase maximum dishes"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="filter-group">
          <label>
            Number of Servings
            <span className="filter-hint">How many people you're cooking for</span>
          </label>
          <div className="range-inputs">
            <div className="input-with-buttons">
              <button
                onClick={() => setMinServings(Math.max(1, minServings - 1))}
                aria-label="Decrease minimum servings"
              >
                −
              </button>
              <input
                type="number"
                value={minServings}
                onChange={(e) => setMinServings(Math.max(1, Number(e.target.value)))}
                min="1"
                aria-label="Minimum servings"
              />
              <button
                onClick={() => setMinServings(Math.min(maxServings, minServings + 1))}
                aria-label="Increase minimum servings"
              >
                +
              </button>
            </div>
            <span className="range-separator">to</span>
            <div className="input-with-buttons">
              <button
                onClick={() => setMaxServings(Math.max(minServings, maxServings - 1))}
                aria-label="Decrease maximum servings"
              >
                −
              </button>
              <input
                type="number"
                value={maxServings}
                onChange={(e) => setMaxServings(Math.max(minServings, Number(e.target.value)))}
                min={minServings}
                aria-label="Maximum servings"
              />
              <button
                onClick={() => setMaxServings(maxServings + 1)}
                aria-label="Increase maximum servings"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="filter-group">
          <label>
            Number of Ingredients
            <span className="filter-hint">Simpler recipes use fewer ingredients</span>
          </label>
          <div className="range-inputs">
            <div className="input-with-buttons">
              <button
                onClick={() => setMinIngredients(Math.max(1, minIngredients - 1))}
                aria-label="Decrease minimum ingredients"
              >
                −
              </button>
              <input
                type="number"
                value={minIngredients}
                onChange={(e) => setMinIngredients(Math.max(1, Number(e.target.value)))}
                min="1"
                aria-label="Minimum ingredients"
              />
              <button
                onClick={() => setMinIngredients(Math.min(maxIngredients, minIngredients + 1))}
                aria-label="Increase minimum ingredients"
              >
                +
              </button>
            </div>
            <span className="range-separator">to</span>
            <div className="input-with-buttons">
              <button
                onClick={() => setMaxIngredients(Math.max(minIngredients, maxIngredients - 1))}
                aria-label="Decrease maximum ingredients"
              >
                −
              </button>
              <input
                type="number"
                value={maxIngredients}
                onChange={(e) => setMaxIngredients(Math.max(minIngredients, Number(e.target.value)))}
                min={minIngredients}
                aria-label="Maximum ingredients"
              />
              <button
                onClick={() => setMaxIngredients(maxIngredients + 1)}
                aria-label="Increase maximum ingredients"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="filter-group">
          <label>
            Dietary Preferences
            <span className="filter-hint">Select any dietary restrictions or preferences</span>
          </label>
          <div className="dietary-tags">
            {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Paleo', 'Halal', 'Kosher'].map(tag => (
              <button
                key={tag}
                className={`dietary-tag ${dietaryTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleDietaryTag(tag)}
                aria-pressed={dietaryTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="search-button"
        onClick={handleSearch}
        disabled={selectedIngredients.length === 0 && !recipeNameSearch.trim()}
      >
        Search Recipes
        {recipeNameSearch.trim() 
          ? ' by Name' 
          : selectedIngredients.length > 0 
            ? ` (${selectedIngredients.length} ingredient${selectedIngredients.length !== 1 ? 's' : ''})` 
            : ''}
      </button>
      {selectedIngredients.length === 0 && !recipeNameSearch.trim() && (
        <p className="search-hint">Please enter a recipe name or select at least one ingredient to search</p>
      )}
    </div>
  );
}

export default RecipeSearch;
