import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MiseEnPlace.css';

function MiseEnPlace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeName, recipeData, fromPage } = location.state || {};

  // Mock data - in a real app, this would come from the recipe data
  const [tools, setTools] = useState([
    { id: 't1', name: 'Frying pan', checked: false },
    { id: 't2', name: 'Spatula', checked: false },
    { id: 't3', name: 'Toaster', checked: false },
    { id: 't4', name: 'Plate', checked: false },
  ]);

  const [ingredients, setIngredients] = useState([
    { id: 'i1', name: '2 eggs', checked: false },
    { id: 'i2', name: '2 slices of bread', checked: false },
    { id: 'i3', name: '1 tbs butter', checked: false },
    { id: 'i4', name: 'Salt and pepper', checked: false },
  ]);

  const toggleTool = (id) => {
    setTools(tools.map(tool => 
      tool.id === id ? { ...tool, checked: !tool.checked } : tool
    ));
  };

  const toggleIngredient = (id) => {
    setIngredients(ingredients.map(ingredient => 
      ingredient.id === id ? { ...ingredient, checked: !ingredient.checked } : ingredient
    ));
  };

  const handleViewTimeline = () => {
    navigate('/loading', { 
      state: { 
        recipeName: recipeName || 'Recipe',
        nextPage: 'timeline',
        recipeData,
        fromPage: 'mise-en-place'
      } 
    });
  };

  return (
    <div className="mise-en-place">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="recipe-header">
        <h1>Now Viewing: <span className="recipe-name">{recipeName || 'Fried Egg on Toast'}</span></h1>
        <div className="recipe-meta">
          {recipeData?.time || 15} min · {recipeData?.dishes || 3} dishes
        </div>
      </div>

      <h2>Mise en Place</h2>
      <p className="description">Check off items as you gather them</p>

      <div className="checklist-section">
        <h3>Tools</h3>
        <div className="checklist">
          {tools.map(tool => (
            <label key={tool.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={tool.checked}
                onChange={() => toggleTool(tool.id)}
              />
              <span className={tool.checked ? 'checked' : ''}>{tool.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="checklist-section">
        <h3>Ingredients</h3>
        <div className="checklist">
          {ingredients.map(ingredient => (
            <label key={ingredient.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={ingredient.checked}
                onChange={() => toggleIngredient(ingredient.id)}
              />
              <span className={ingredient.checked ? 'checked' : ''}>{ingredient.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="view-timeline-button" onClick={handleViewTimeline}>
        View Timeline
      </button>
    </div>
  );
}

export default MiseEnPlace;
