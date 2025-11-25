import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './History.css';

interface Recipe {
  id: string;
  name: string;
  time: number;
  dishes: number;
  lastCooked: string;
}

function History() {
  const navigate = useNavigate();

  // Mock history data - in a real app, this would come from local storage or a database
  const [history] = useState<Recipe[]>([
    { id: '1', name: 'Fried Egg on Toast', time: 15, dishes: 3, lastCooked: '2 days ago' },
    { id: '2', name: 'Scrambled Eggs', time: 10, dishes: 2, lastCooked: '3 days ago' },
    { id: '3', name: 'Spaghetti Carbonara', time: 25, dishes: 4, lastCooked: '1 week ago' },
    { id: '4', name: 'Grilled Cheese Sandwich', time: 10, dishes: 2, lastCooked: '1 week ago' },
    { id: '5', name: 'Chicken Stir Fry', time: 30, dishes: 5, lastCooked: '2 weeks ago' },
  ]);

  const handleRecipeClick = (recipe: Recipe) => {
    navigate('/mise-en-place', { 
      state: { 
        recipeName: recipe.name,
        recipeData: recipe,
        isFromHistory: true
      } 
    });
  };

  return (
    <div className="history">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>

      <h1>Cooking History</h1>
      <p className="description">View all the recipes you've made before</p>

      <div className="history-list">
        {history.map(recipe => (
          <button 
            key={recipe.id} 
            className="recipe-button"
            onClick={() => handleRecipeClick(recipe)}
          >
            <div className="recipe-header">
              <div className="recipe-name">{recipe.name}</div>
              <div className="last-cooked">{recipe.lastCooked}</div>
            </div>
            <div className="recipe-details">
              {recipe.time} min · {recipe.dishes} dishes
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default History;
