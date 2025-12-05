import { api } from './api';
import { detectToolsFromText } from '../utils/recipeParser';

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
 * @returns {Promise<Object>} Recipe details with ingredients, tools, and instructions. The returned object has the structure: { ingredients: string[], tools: string[], instructions: string }
 */
const fetchTheMealDBDetails = async (mealId) => {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    const data = await response.json();
    
    if (!data.meals || !data.meals[0]) {
      return { ingredients: [], tools: [], instructions: '' };
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
    
    // Extract tools from instructions using shared utility
    const instructions = meal.strInstructions || '';
    const tools = detectToolsFromText(instructions);
    
    return { 
      ingredients, 
      tools,
      instructions: meal.strInstructions 
    };
  } catch (error) {
    console.error('Failed to fetch TheMealDB details:', error);
    return { ingredients: [], tools: [], instructions: '' };
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
   * Helper function to update localStorage history with deduplication
   * @param {Object} recipe - Recipe object to add
   * @returns {{ success: boolean, recipe: Object }} Object containing success status and the updated recipe
   */
  updateLocalStorageHistory: (recipe) => {
    const history = JSON.parse(localStorage.getItem('recipeHistory') || '[]');
    
    // Check for existing recipe by URL or name+source
    let existingIndex = -1;
    for (let i = 0; i < history.length; i++) {
      if (recipe.url && history[i].url === recipe.url) {
        existingIndex = i;
        break;
      }
      if (!recipe.url && !history[i].url && 
          history[i].name === recipe.name && 
          history[i].source === recipe.source) {
        existingIndex = i;
        break;
      }
    }
    
    if (existingIndex !== -1) {
      // Update existing recipe
      history[existingIndex].lastCooked = new Date().toISOString();
      history[existingIndex].cookCount = (history[existingIndex].cookCount || 1) + 1;
      // Update any new fields
      Object.keys(recipe).forEach(key => {
        if (key !== 'lastCooked' && key !== 'cookCount' && key !== 'isHistory') {
          history[existingIndex][key] = recipe[key];
        }
      });
      // Move to front
      const updated = history.splice(existingIndex, 1)[0];
      history.unshift(updated);
    } else {
      // Add new recipe
      recipe.lastCooked = new Date().toISOString();
      recipe.cookCount = 1;
      recipe.isHistory = true;
      history.unshift(recipe);
    }
    
    localStorage.setItem('recipeHistory', JSON.stringify(history.slice(0, 50)));
    return { success: true, recipe };
  },

  /**
   * Add a recipe to cooking history
   * @param {Object} recipe - Recipe object to add
   * @param {Object} llmParsedData - Optional LLM-parsed timeline data to cache
   * @returns {Promise<Object>} Success response with recipe
   */
  addToHistory: async (recipe, llmParsedData = null) => {
    // Cache LLM data if provided (saves API tokens on subsequent loads)
    if (llmParsedData) {
      const cacheKey = `timeline_${recipe.name || recipe.url}`;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(llmParsedData));
        console.log('💾 Cached LLM timeline data for', recipe.name);
      } catch (error) {
        console.warn('Failed to cache timeline data:', error);
      }
    }
    
    const hasBackend = await checkBackendHealth();
    
    if (hasBackend) {
      try {
        return await api.post('/api/history', recipe);
      } catch (error) {
        console.log('Backend not available, saving to localStorage');
        return recipeService.updateLocalStorageHistory(recipe);
      }
    } else {
      return recipeService.updateLocalStorageHistory(recipe);
    }
  },

  /**
   * Get cached LLM timeline data for a recipe
   * @param {string} recipeNameOrUrl - Recipe name or URL
   * @returns {Object|null} Cached timeline data or null
   */
  getCachedTimeline: (recipeNameOrUrl) => {
    const cacheKey = `timeline_${recipeNameOrUrl}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.log('💰 Using cached LLM timeline data (saving API tokens!)');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to retrieve cached timeline:', error);
    }
    return null;
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
