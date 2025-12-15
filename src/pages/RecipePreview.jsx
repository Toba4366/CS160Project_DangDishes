import { useNavigate, useLocation } from 'react-router-dom';
import './RecipePreview.css';

function RecipePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeName, recipeData, fromPage, llmParsedData } = location.state || {};

  const handleBack = () => {
    if (fromPage === 'search-results') {
      navigate('/search-results', { state: location.state, replace: false });
    } else if (fromPage === 'history') {
      navigate('/history', { replace: false });
    } else {
      navigate('/generate-timeline', { replace: false });
    }
  };

  const handleContinue = () => {
    navigate('/mise-en-place', { 
      state: { recipeName, recipeData, fromPage, llmParsedData },
      replace: false 
    });
  };

  // Safely extract recipe data
  const name = recipeData?.name || recipeName || 'Recipe';
  const time = recipeData?.time || recipeData?.cookTime || 'N/A';
  const servings = recipeData?.servings || recipeData?.dishes || 'N/A';
  const ingredients = Array.isArray(recipeData?.ingredients) 
    ? recipeData.ingredients 
    : [];
  const tools = Array.isArray(recipeData?.tools) 
    ? recipeData.tools.map(t => typeof t === 'string' ? t : t.name || t)
    : [];
  const instructions = Array.isArray(recipeData?.instructions)
    ? recipeData.instructions
    : typeof recipeData?.instructions === 'string'
    ? recipeData.instructions.split('\n').filter(s => s.trim())
    : [];
  const nutritionFacts = recipeData?.nutritionFacts;
  const url = recipeData?.url;

  return (
    <div className="recipe-preview">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      <div className="preview-header">
        <h1>{name}</h1>
        <div className="preview-meta">
          <span>⏱️ {time} min</span>
          <span>🍽️ {servings} servings</span>
          {url && <span>🔗 <a href={url} target="_blank" rel="noopener noreferrer">Source</a></span>}
        </div>
      </div>

      <div className="preview-content">
        {/* Ingredients Section */}
        {ingredients.length > 0 && (
          <div className="preview-section">
            <h2>📝 Ingredients ({ingredients.length})</h2>
            <ul className="ingredient-list">
              {ingredients.map((ingredient, idx) => (
                <li key={idx}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tools Section */}
        {tools.length > 0 && (
          <div className="preview-section">
            <h2>🔧 Tools ({tools.length})</h2>
            <div className="tools-grid">
              {tools.map((tool, idx) => (
                <span key={idx} className="tool-tag">{tool}</span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions Section */}
        {instructions.length > 0 && (
          <div className="preview-section">
            <h2>👨‍🍳 Instructions ({instructions.length} steps)</h2>
            <ol className="instruction-list">
              {instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Nutrition Facts Section */}
        {nutritionFacts && Object.keys(nutritionFacts).some(key => nutritionFacts[key]) && (
          <div className="preview-section">
            <h2>📊 Nutrition Facts</h2>
            <div className="nutrition-grid">
              {nutritionFacts.calories && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories</span>
                  <span className="nutrition-value">{nutritionFacts.calories}</span>
                </div>
              )}
              {nutritionFacts.protein && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">{nutritionFacts.protein}g</span>
                </div>
              )}
              {nutritionFacts.carbs && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">{nutritionFacts.carbs}g</span>
                </div>
              )}
              {nutritionFacts.fat && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat</span>
                  <span className="nutrition-value">{nutritionFacts.fat}g</span>
                </div>
              )}
              {nutritionFacts.fiber && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Fiber</span>
                  <span className="nutrition-value">{nutritionFacts.fiber}g</span>
                </div>
              )}
              {nutritionFacts.sodium && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Sodium</span>
                  <span className="nutrition-value">{nutritionFacts.sodium}mg</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="preview-actions">
        <button className="continue-button" onClick={handleContinue}>
          Continue to Mise en Place →
        </button>
      </div>
    </div>
  );
}

export default RecipePreview;
