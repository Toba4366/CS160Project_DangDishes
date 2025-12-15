import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import './EditRecipe.css';

function EditRecipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipe } = location.state || {};

  const [name, setName] = useState(recipe?.name || '');
  const [instructions, setInstructions] = useState(
    Array.isArray(recipe?.instructions) 
      ? recipe.instructions.join('\n') 
      : recipe?.instructions || ''
  );
  const [ingredients, setIngredients] = useState(
    Array.isArray(recipe?.ingredients) 
      ? recipe.ingredients.join('\n') 
      : recipe?.ingredients || ''
  );
  const [tools, setTools] = useState(
    Array.isArray(recipe?.tools) 
      ? recipe.tools.join('\n') 
      : recipe?.tools || ''
  );
  const [time, setTime] = useState(recipe?.time || 30);
  const [dishes, setDishes] = useState(recipe?.dishes || 4);
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [nutritionFacts, setNutritionFacts] = useState(recipe?.nutritionFacts || {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sodium: ''
  });
  const [saving, setSaving] = useState(false);

  if (!recipe) {
    return (
      <div className="edit-recipe">
        <h1>Recipe Not Found</h1>
        <p>No recipe data provided. Please go back and try again.</p>
        <button onClick={() => navigate('/history')}>Back to History</button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a recipe name');
      return;
    }

    if (!instructions.trim()) {
      alert('Please enter recipe instructions');
      return;
    }

    setSaving(true);
    try {
      const updatedRecipe = {
        ...recipe,
        name: name.trim(),
        instructions: instructions.split('\n').filter(line => line.trim()),
        ingredients: ingredients.split('\n').filter(line => line.trim()),
        tools: tools.split('\n').filter(line => line.trim()),
        time: parseInt(time) || 30,
        dishes: parseInt(dishes) || 4,
        servings: parseInt(servings) || 4,
        nutritionFacts: Object.keys(nutritionFacts).some(key => nutritionFacts[key]) 
          ? nutritionFacts 
          : undefined,
        lastModified: new Date().toISOString()
      };

      // Save to history (which will update it)
      await recipeService.addToHistory(updatedRecipe);
      
      alert('Recipe updated successfully!');
      navigate('/history');
    } catch (error) {
      console.error('Failed to update recipe:', error);
      alert('Failed to update recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNutritionChange = (field, value) => {
    setNutritionFacts({
      ...nutritionFacts,
      [field]: value
    });
  };

  return (
    <div className="edit-recipe">
      <button className="back-button" onClick={() => navigate('/history')}>
        ← Back to History
      </button>

      <h1>Edit Recipe</h1>
      <p className="description">Update your recipe details</p>

      <div className="edit-form">
        <div className="form-group">
          <label htmlFor="recipe-name">
            Recipe Name <span className="required">*</span>
          </label>
          <input
            id="recipe-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter recipe name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cook-time">Cooking Time (minutes)</label>
            <input
              id="cook-time"
              type="number"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              min="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dishes-count">Number of Dishes</label>
            <input
              id="dishes-count"
              type="number"
              value={dishes}
              onChange={(e) => setDishes(e.target.value)}
              min="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="servings-count">Servings</label>
            <input
              id="servings-count"
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ingredients">
            Ingredients
            <span className="hint">One ingredient per line</span>
          </label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
            rows="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tools">
            Tools/Equipment
            <span className="hint">One tool per line</span>
          </label>
          <textarea
            id="tools"
            value={tools}
            onChange={(e) => setTools(e.target.value)}
            placeholder="Mixing bowl&#10;Whisk&#10;Baking pan"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="instructions">
            Instructions <span className="required">*</span>
            <span className="hint">One step per line</span>
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
            rows="10"
          />
        </div>

        <div className="nutrition-section">
          <h3>Nutrition Facts (Optional)</h3>
          <p className="hint">Per serving</p>
          <div className="nutrition-grid">
            <div className="form-group">
              <label htmlFor="calories">Calories</label>
              <input
                id="calories"
                type="text"
                value={nutritionFacts.calories}
                onChange={(e) => handleNutritionChange('calories', e.target.value)}
                placeholder="250"
              />
            </div>
            <div className="form-group">
              <label htmlFor="protein">Protein (g)</label>
              <input
                id="protein"
                type="text"
                value={nutritionFacts.protein}
                onChange={(e) => handleNutritionChange('protein', e.target.value)}
                placeholder="15"
              />
            </div>
            <div className="form-group">
              <label htmlFor="carbs">Carbs (g)</label>
              <input
                id="carbs"
                type="text"
                value={nutritionFacts.carbs}
                onChange={(e) => handleNutritionChange('carbs', e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="form-group">
              <label htmlFor="fat">Fat (g)</label>
              <input
                id="fat"
                type="text"
                value={nutritionFacts.fat}
                onChange={(e) => handleNutritionChange('fat', e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="form-group">
              <label htmlFor="fiber">Fiber (g)</label>
              <input
                id="fiber"
                type="text"
                value={nutritionFacts.fiber}
                onChange={(e) => handleNutritionChange('fiber', e.target.value)}
                placeholder="5"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sodium">Sodium (mg)</label>
              <input
                id="sodium"
                type="text"
                value={nutritionFacts.sodium}
                onChange={(e) => handleNutritionChange('sodium', e.target.value)}
                placeholder="300"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            className="cancel-button" 
            onClick={() => navigate('/history')}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditRecipe;
