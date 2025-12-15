import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recipeService } from '../services/recipeService';
import './SearchResults.css';

function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters } = location.state || {};

  const [webRecipes, setWebRecipes] = useState([]);
  const [historyRecipes, setHistoryRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const searchedIngredients = filters?.selectedIngredients || ['chicken'];

        // Fetch both web results and history in parallel
        const [webData, historyData] = await Promise.all([
          recipeService.searchRecipes(
            searchedIngredients,
            { maxResults: 10 }
          ),
          recipeService.getHistory()
        ]);

        // Apply filters to web recipes
        const filteredWebRecipes = (webData.recipes || []).filter(recipe => {
          // Filter by recipe name if searching by name
          if (filters?.recipeNameSearch) {
            const nameMatch = recipe.name?.toLowerCase().includes(filters.recipeNameSearch.toLowerCase());
            if (!nameMatch) return false;
          }

          // Filter by cooking time
          const recipeTime = recipe.time || 0;
          const timeMatch = recipeTime >= (filters?.minTime || 0) &&
            recipeTime <= (filters?.maxTime || 60);

          // Filter by number of dishes
          const recipeDishes = recipe.dishes || 0;
          const dishesMatch = recipeDishes >= (filters?.minDishes || 1) &&
            recipeDishes <= (filters?.maxDishes || 10);

          // Filter by servings
          const recipeServings = recipe.servings || recipe.dishes || 4;
          const servingsMatch = recipeServings >= (filters?.minServings || 1) &&
            recipeServings <= (filters?.maxServings || 8);

          // Filter by ingredient count
          const ingredientCount = recipe.ingredients?.length || 0;
          const ingredientsMatch = ingredientCount === 0 || 
            (ingredientCount >= (filters?.minIngredients || 1) &&
             ingredientCount <= (filters?.maxIngredients || 20));

          // Filter by dietary tags (if any are selected)
          const dietaryMatch = !filters?.dietaryTags?.length || 
            filters.dietaryTags.some(tag => 
              recipe.tags?.includes(tag.toLowerCase()) || 
              recipe.dietary?.includes(tag.toLowerCase())
            );

          return timeMatch && dishesMatch && servingsMatch && ingredientsMatch && dietaryMatch;
        });
        setWebRecipes(filteredWebRecipes);

        // Filter history to only show recipes with the searched ingredients/name and filters
        const filteredHistory = (historyData.recipes || []).filter(recipe => {
          const recipeName = recipe.name?.toLowerCase() || '';
          
          // If searching by recipe name, match that
          if (filters?.recipeNameSearch) {
            const nameMatch = recipeName.includes(filters.recipeNameSearch.toLowerCase());
            if (!nameMatch) return false;
          } else {
            // Otherwise match by ingredients
            const ingredientMatch = searchedIngredients.length === 0 || searchedIngredients.some(ingredient =>
              recipeName.includes(ingredient.toLowerCase())
            );
            if (!ingredientMatch) return false;
          }

          // Filter by cooking time
          const recipeTime = recipe.time || 0;
          const timeMatch = recipeTime >= (filters?.minTime || 0) &&
            recipeTime <= (filters?.maxTime || 60);

          // Filter by number of dishes
          const recipeDishes = recipe.dishes || 0;
          const dishesMatch = recipeDishes >= (filters?.minDishes || 1) &&
            recipeDishes <= (filters?.maxDishes || 10);

          // Filter by servings
          const recipeServings = recipe.servings || recipe.dishes || 4;
          const servingsMatch = recipeServings >= (filters?.minServings || 1) &&
            recipeServings <= (filters?.maxServings || 8);

          // Filter by ingredient count
          const ingredientCount = recipe.ingredients?.length || 0;
          const ingredientsMatch = ingredientCount === 0 || 
            (ingredientCount >= (filters?.minIngredients || 1) &&
             ingredientCount <= (filters?.maxIngredients || 20));

          // Filter by dietary tags
          const dietaryMatch = !filters?.dietaryTags?.length || 
            filters.dietaryTags.some(tag => 
              recipe.tags?.includes(tag.toLowerCase()) || 
              recipe.dietary?.includes(tag.toLowerCase())
            );

          return timeMatch && dishesMatch && servingsMatch && ingredientsMatch && dietaryMatch;
        });
        setHistoryRecipes(filteredHistory);
      } catch (err) {
        console.error('Failed to fetch recipes:', err);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [filters]);

  const handleRecipeClick = async (recipe) => {
    // Save to history when clicked
    try {
      await recipeService.addToHistory(recipe);
    } catch (err) {
      console.error('Failed to add to history:', err);
    }

    // Fetch full recipe details if we have a URL
    let fullRecipeData = recipe;
    if (recipe.url) {
      try {
        const details = await recipeService.getRecipeDetails(recipe.url);
        fullRecipeData = { ...recipe, ...details };
      } catch (err) {
        console.error('Failed to fetch recipe details:', err);
        // Continue with basic data if details fetch fails
      }
    }

    // Attach current filters so downstream pages can restore the search
    const recipeWithFilters = { ...fullRecipeData, filters };

    navigate('/loading', {
      state: {
        recipeName: recipe.name,
        nextPage: 'mise-en-place',
        recipeData: recipeWithFilters,
        fromPage: 'search-results',
        filters
      }
    });
  };

  if (loading) {
    return (
      <div className="search-results">
        <button className="back-button" onClick={() => navigate('/recipe-search')}>
          ← Back
        </button>
        <h1>Loading recipes...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results">
        <button className="back-button" onClick={() => navigate('/recipe-search')}>
          ← Back
        </button>
        <h1>Error</h1>
 