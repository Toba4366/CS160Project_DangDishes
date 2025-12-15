import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import { scaleIngredients, resetIngredients } from '../utils/ingredientScaler';
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
  const recipeTools = useMemo(() => (
    recipeData?.tools?.map((tool, idx) => ({
      id: `t${idx}`,
      name: typeof tool === 'string' ? tool : tool.name,
      checked: false
    })) || defaultTools
  ), [recipeData]);

  const recipeIngredients = useMemo(() => (
    recipeData?.ingredients?.map((ing, idx) => ({
      id: `i${idx}`,
      name: typeof ing === 'string' ? ing : ing.name,
      checked: false
    })) || defaultIngredients
  ), [recipeData]);

  const storageKey = useMemo(() => {
    const identifier = recipeData?.id || recipeData?.url || recipeName;
    return `mise-en-place:${identifier || 'default'}`;
  }, [recipeData?.id, recipeData?.url, recipeName]);

  const [tools, setTools] = useState(recipeTools);
  const [ingredients, setIngredients] = useState(recipeIngredients);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const originalServings = recipeData?.servings || recipeData?.dishes || 4;

  const mergeCheckedState = (baseList, savedList) => {
    if (!Array.isArray(savedList)) return baseList;
    return baseList.map(item => {
      const match = savedList.find(saved => saved.id === item.id || saved.name === item.name);
      return match ? { ...item, checked: !!match.checked } : item;
    });
  };

  // Reset lists when recipe changes
  useEffect(() => {
    setHydrated(false);
    setTools(recipeTools);
    setIngredients(recipeIngredients);
  }, [recipeData]);

  // Hydrate checkboxes from localStorage
  useEffect(() => {
    try {
      const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setTools(mergeCheckedState(recipeTools, savedState.tools));
      setIngredients(mergeCheckedState(recipeIngredients, savedState.ingredients));
    } catch (err) {
      console.error('Failed to load mise en place state', err);
      setTools(recipeTools);
      setIngredients(recipeIngredients);
    } finally {
      setHydrated(true);
    }
  }, [storageKey, recipeTools, recipeIngredients]);

  // Persist checkbox state
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          tools: tools.map(({ id, name, checked }) => ({ id, name, checked })),
          ingredients: ingredients.map(({ id, name, checked }) => ({ id, name, checked }))
        })
      );
    } catch (err) {
      console.error('Failed to save mise en place state', err);
    }
  }, [tools, ingredients, storageKey, hydrated]);

  const toggleTool = (id) => {
    setTools(prevTools => prevTools.map(tool => 
      tool.id === id ? { ...tool, checked: !tool.checked } : tool
    ));
  };

  const toggleIngredient = (id) => {
    setIngredients(prevIngredients => prevIngredients.map(ingredient => 
      ingredient.id === id ? { ...ingredient, checked: !ingredient.checked } : ingredient
    ));
  };

  const handleServingChange = (delta) => {
    const newMultiplier = Math.max(0.25, servingMultiplier + delta);
    setServingMultiplier(newMultiplier);
    
    // Scale ingredients with new multiplier
    const scaledIngredients = scaleIngredients(
      recipeIngredients.map(ing => ({
        ...ing,
        originalName: ing.originalName || ing.name
      })),
      newMultiplier
    );
    
    // Preserve checked state
    setIngredients(prevIngredients => 
      scaledIngredients.map(scaled => {
        const prev = prevIngredients.find(p => p.id === scaled.id);
        return { ...scaled, checked: prev?.checked || false };
      })
    );
  };

  const handleResetServings = () => {
    setServingMultiplier(1);
    
    // Reset to original ingredient names
    const resetIngs = resetIngredients(ingredients);
    setIngredients(prevIngredients =>
      resetIngs.map(reset => {
        const prev = prevIngredients.find(p => p.id === reset.id);
        return { ...reset, checked: prev?.checked || false };
      })
    );
  };

  const handleSaveRecipe = async () => {
    if (saved || !recipeData?.needsSaving) return;

    setSaving(true);
    try {
      await recipeService.addToHistory(recipeData);
      setSaved(true);
      // Update recipeData to remove needsSaving flag
      if (recipeData) {
        delete recipeData.needsSaving;
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
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

      <div className="title-with-tooltip">
        <h2>Mise en Place</h2>
        <span className="info-icon" title="Mise en place (MEEZ ahn plahs) is a French culinary phrase meaning 'everything in its place.' It refers to having all your ingredients prepped and tools ready before you start cooking.">ⓘ</span>
      </div>
      <i className="description">Check off items as you gather them.</i>

      <div className="checklist-section">
        <div className="section-header-with-controls">
          <h3>Ingredients</h3>
          <div className="serving-controls">
            <span className="serving-label">Servings:</span>
            <button className="serving-btn" onClick={() => handleServingChange(-0.25)} disabled={servingMultiplier <= 0.25}>−</button>
            <span className="serving-display">{(originalServings * servingMultiplier).toFixed(1)}</span>
            <button className="serving-btn" onClick={() => handleServingChange(0.25)}>+</button>
            {servingMultiplier !== 1 && (
              <button className="reset-btn" onClick={handleResetServings}>Reset</button>
            )}
          </div>
        </div>
        <div className="checklist">
          {ingredients.map(ing => (
            <label key={ing.id} className="checkbox-item" htmlFor={`ing-${ing.id}`}>
              <input
                id={`ing-${ing.id}`}
                type="checkbox"
                checked={ing.checked}
                onChange={() => toggleIngredient(ing.id)}
              />
              <span className={ing.checked ? 'checked' : ''}>{ing.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="checklist-section">
        <h3>Tools</h3>
        <div className="checklist">
          {tools.map(tool => (
            <label key={tool.id} className="checkbox-item" htmlFor={`tool-${tool.id}`}>
              <input
                id={`tool-${tool.id}`}
                type="checkbox"
                checked={tool.checked}
                onChange={() => toggleTool(tool.id)}
              />
              <span className={tool.checked ? 'checked' : ''}>{tool.name}</span>
            </label>
          ))}
        </div>
      </div>

      {recipeData?.needsSaving && (
        <button 
          className={`save-recipe-button ${saved ? 'saved' : ''}`}
          onClick={handleSaveRecipe}
          disabled={saved || saving}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved to History' : 'Save Recipe to History'}
        </button>
      )}

      <button className="view-timeline-button" onClick={handleViewTimeline}>
        View Timeline
      </button>
    </div>
  );
}

export default MiseEnPlace;
