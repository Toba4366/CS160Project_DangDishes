from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from scraper import search_recipes, scrape_recipe_details
from database import get_history, add_to_history, clear_history

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Dish It Out Recipe API",
    description="Recipe search and history management API",
    version="1.0.0"
)

# Configure CORS - must be more permissive for OPTIONS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Pydantic models for request/response validation
class SearchRequest(BaseModel):
    ingredients: List[str]
    maxResults: Optional[int] = 10

class Recipe(BaseModel):
    id: str
    name: str
    url: Optional[str] = None
    time: Optional[int] = None
    dishes: Optional[int] = None
    isHistory: Optional[bool] = False
    source: Optional[str] = None
    lastCooked: Optional[str] = None
    cookCount: Optional[int] = None

class SearchResponse(BaseModel):
    recipes: List[dict]
    count: int
    searchTerm: Optional[str] = None

class HistoryResponse(BaseModel):
    recipes: List[dict]
    count: int

class SuccessResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    recipe: Optional[dict] = None

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🍽️ Dish It Out Recipe API",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Recipe API is running"
    }

@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """
    Search for recipes based on ingredients
    """
    try:
        if not request.ingredients:
            raise HTTPException(status_code=400, detail="No ingredients provided")
        
        # Search using the first ingredient (can be enhanced to combine multiple)
        primary_ingredient = request.ingredients[0]
        recipes = search_recipes(primary_ingredient, request.maxResults)
        
        return {
            "recipes": recipes,
            "count": len(recipes),
            "searchTerm": primary_ingredient
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history", response_model=HistoryResponse)
async def get_recipe_history():
    """Get all recipes from cooking history"""
    try:
        history = get_history()
        return {
            "recipes": history,
            "count": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/history", response_model=SuccessResponse)
async def add_recipe_to_history(recipe: Recipe):
    """Add a recipe to cooking history"""
    try:
        if not recipe.name:
            raise HTTPException(status_code=400, detail="Recipe name is required")
        
        # Convert Pydantic model to dict
        recipe_dict = recipe.model_dump()
        updated_recipe = add_to_history(recipe_dict)
        
        return {
            "success": True,
            "recipe": updated_recipe
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history", response_model=SuccessResponse)
async def clear_recipe_history():
    """Clear all cooking history"""
    try:
        clear_history()
        return {
            "success": True,
            "message": "History cleared"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RecipeDetailsRequest(BaseModel):
    url: str

@app.post("/api/recipe/details")
async def get_recipe_details(request: RecipeDetailsRequest):
    """
    Get detailed information for a specific recipe by URL
    Returns ingredients, tools, instructions, etc.
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="Recipe URL is required")
        
        details = scrape_recipe_details(request.url)
        
        if details is None:
            # Return reasonable defaults if scraping fails
            return {
                "ingredients": [],
                "tools": [],
                "instructions": [],
                "prepTime": None,
                "cookTime": None,
                "servings": None
            }
        
        return details
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    
    print(f"🍽️  Recipe API starting on port {port}")
    print(f"📡 CORS enabled for http://localhost:5173")
    print(f"📚 API docs available at http://localhost:{port}/docs")
    
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
