import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MiseEnPlace.css';

function MiseEnPlace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeName, recipeData, fromPage } = location.state || {};

  // Use recipe data if available, otherwise use mock data
  const defaultTools = [
    { id: 't1', name: 'Frying pan', checked: false },
    { id: 't2', name: 'Spatula', checked: false },
    { id: 't3', name: 'Toaster', checked: false },
    { id: 't4', name: 'Plate', checked: false },
  ];

  const defaultIngredients = [
    { id: 'i1', name: '2 eggs', checked: false },
    { id: 'i2', name: '2 slices of bread', checked: false },
    { id: 'i3', name: '1 tbs butter', checked: false },
    { id: 'i4', name: 'Salt and pepper', checked: false },
  ];

  // Extract tools and ingredients from recipeData if available
  const recipeTools = recipeData?.tools?.map((tool, idx) => ({
    id: `t${idx}`,
    name: typeof tool === 'string' ? tool : tool.name,
    checked: false
  })) || defaultTools;

  const recipeIngredients = recipeData?.ingredients?.map((ing, idx) => ({
    id: `i${idx}`,
    name: typeof ing === 'string' ? ing : ing.name,
    checked: false
  })) || defaultIngredients;

  const [tools, setTools] = useState(recipeTools);
  const [ingredients, setIngredients] = useState(recipeIngredients);

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

  const handleBack = () => {
    // Navigate based on workflow origin
    if (fromPage === 'history') {
      navigate('/history');
    } else if (fromPage === 'search-results') {
      navigate('/search-results', { state: { filters: recipeData?.filters } });
    } else {
      navigate('/generate-timeline');
    }
  };

  const handleViewTimeline = () => {
    navigate('/loading', { 
      state: { 
        recipeName: recipeName || 'Recipe',
        nextPage: 'timeline',
        recipeData,
        fromPage
      } 
    });
  };

  return (
    <div className="mise-en-place">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      <div className="recipe-header">
        <h1>Now Viewing: <span className="recipe-name">{recipeName || 'Fried Egg on Toast'}</span></h1>
        <div className="recipe-meta">
          {recipeData?.time || 15} min · {recipeData?.dishes || 3} dishes
        </div>
      </div>

      <h2>Mise en Place</h2>
      <i className="description">Check off items as you gather them.</i>

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
