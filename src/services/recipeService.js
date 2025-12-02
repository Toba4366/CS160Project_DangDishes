import { api } from './api';

// Fallback to free API if backend is not available
const FALLBACK_API = 'https://www.themealdb.com/api/json/v1/1';

let backendAvailable = null; // null = not checked, true/false = checked

/**
 * Check if backend is available
 */
const checkBackendHealth = async () => {
  if (backendAvailable !== null) return backendAvailable;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    backendAvailable = response.ok;
  } catch (error) {
    console.log('Backend not available, using fallback API');
    backendAvailable = false;
  }
  
  return backendAvailable;
};

/**
 * Search using TheMealDB as fallback
 */
const searchWithFallbackAPI = async (ingredients) => {
  try {
    const ingredient = ingredients[0] || 'chicken';
    const response = await fetch(`${FALLBACK_API}/filter.php?i=${ingredient}`);
    const data = await response.json();
    
    if (!data.meals) {
      return { recipes: [], count: 0 };
    }
    
    // Transform TheMealDB format to our format
    const recipes = data.meals.slice(0, 10).map(meal => ({
      id: meal.idMeal,
      name: meal.strMeal,
      url: `https://www.themealdb.com/meal/${meal.idMeal}`,
      time: Math.floor(Math.random() * 45) + 15, // Random 15-60 min
      dishes: Math.floor(Math.random() * 4) + 2,  // Random 2-6 dishes
      isHistory: false,
      source: 'TheMealDB'
    }));
    
    return { recipes, count: recipes.length };
  } catch (error) {
    console.error('Fallback API also failed:', error);
    return { recipes: [], count: 0 };
  }
};

/**
 * Fetch recipe details from TheMealDB API
 * @param {string} mealId - The TheMealDB meal ID
 * @returns {Promise<Object>} Recipe details with ingredients and tools
 */
const fetchTheMealDBDetails = async (mealId) => {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    const data = await response.json();
    
    if (!data.meals || !data.meals[0]) {
      return { ingredients: [], tools: [] };
    }
    
    const meal = data.meals[0];
    
    // Extract ingredients from strIngredient1-20 and strMeasure1-20
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(measure ? `${measure.trim()} ${ingredient.trim()}` : ingredient.trim());
      }
    }
    
    // Extract tools from instructions (basic detection)
    const instructions = meal.strInstructions || '';
    const tools = [];
    const toolKeywords = [
      'pan', 'pot', 'bowl', 'knife', 'spoon', 'fork', 
      'oven', 'stove', 'blender', 'mixer', 'whisk',
      'cutting board', 'baking sheet', 'spatula'
    ];
    
    toolKeywords.forEach(tool => {
      if (instructions.toLowerCase().includes(tool)) {
        tools.push(tool.charAt(0).toUpperCase() + tool.slice(1));
      }
    });
    
    return { 
      ingredients, 
      tools: [...new Set(tools)], // Remove duplicates
      instructions: meal.strInstructions 
    };
  } catch (error) {
    console.error('Failed to fetch TheMealDB details:', error);
    return { ingredients: [], tools: [] };
  }
};

/**
 * Recipe service for managing recipe search and history
 */
export const recipeService = {
  /**
   * Search for recipes by ingredients
   * @param {string[]} ingredients - Array of ingredient names
   * @param {Object} filters - Optional filters (maxResults, etc.)
   * @returns {Promise<Object>} Search results with recipes array
   */
  searchRecipes: async (ingredients, filters = {}) => {
    const hasBackend = await checkBackendHealth();
    
    if (hasBackend) {
      try {
        return await api.post('/api/search', {
          ingredients,
          maxResults: filters.maxResults || 10,
        });
      } catch (error) {
        console.log('Backend request failed, trying fallback API');
        backendAvailable = false; // Mark as unavailable for future requests
        return searchWithFallbackAPI(ingredients);
      }
    } else {
      return searchWithFallbackAPI(ingredients);
    }
  },

  /**
   * Get cooking history
   * @returns {Promise<Object>} History with recipes array
   */
  getHistory: async () => {
    const hasBackend = await checkBackendHealth();
    
    if (hasBackend) {
      try {
        return await api.get('/api/history');
      } catch (error) {
        console.log('Backend not available, returning empty history');
        return { recipes: [], count: 0 };
      }
    } else {
      // Use localStorage as fallback for history
      try {
        const history = JSON.parse(localStorage.getItem('recipeHistory') || '[]');
        return { recipes: history, count: history.length };
      } catch (error) {
        return { recipes: [], count: 0 };
      }
    }
  },

  /**
   * Add a recipe to cooking history
   * @param {Object} recipe - Recipe object to add
   * @returns {Promise<Object>} Success response with recipe
   */
  addToHistory: async (recipe) => {
    const hasBackend = await checkBackendHealth();
    
    if (hasBackend) {
      try {
        return await api.post('/api/history', recipe);
      } catch (error) {
        console.log('Backend not available, saving to localStorage');
        // Fallback to localStorage
        const history = JSON.parse(localStorage.getItem('recipeHistory') || '[]');
        recipe.lastCooked = new Date().toISOString();
        history.unshift(recipe);
        localStorage.setItem('recipeHistory', JSON.stringify(history.slice(0, 50)));
        return { success: true, recipe };
      }
    } else {
      // Use localStorage as fallback
      const history = JSON.parse(localStorage.getItem('recipeHistory') || '[]');
      recipe.lastCooked = new Date().toISOString();
      recipe.isHistory = true;
      history.unshift(recipe);
      localStorage.setItem('recipeHistory', JSON.stringify(history.slice(0, 50)));
      return { success: true, recipe };
    }
  },

  /**
   * Clear all cooking history
   * @returns {Promise<Object>} Success response
   */
  clearHistory: async () => {
    const hasBackend = await checkBackendHealth();
    
    if (hasBackend) {
      try {
        return await api.delete('/api/history');
      } catch (error) {
        localStorage.removeItem('recipeHistory');
        return { success: true };
      }
    } else {
      localStorage.removeItem('recipeHistory');
      return { success: true };
    }
  },

  /**
   * Get detailed information for a specific recipe
   * @param {string} recipeUrl - The recipe URL to scrape
   * @returns {Promise<Object>} Recipe details with ingredients and tools
   */
  getRecipeDetails: async (recipeUrl) => {
    // Check if it's a TheMealDB URL
    if (recipeUrl && recipeUrl.includes('themealdb.com/meal/')) {
      const mealId = recipeUrl.split('/').pop();
      return fetchTheMealDBDetails(mealId);
    }
    
    // For other URLs, try backend scraper
    const hasBackend = await checkBackendHealth();
    
    if (hasBackend) {
      try {
        return await api.post('/api/recipe/details', { url: recipeUrl });
      } catch (error) {
        console.log('Backend not available for recipe details');
        // Return mock data structure if backend fails
        return { ingredients: [], tools: [] };
      }
    } else {
      // Return empty arrays if no backend
      return { ingredients: [], tools: [] };
    }
  },
};
