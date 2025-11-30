# Dish It Out - Backend API

FastAPI backend for recipe search and history management.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Mac/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python app.py
```

The API will start on `http://localhost:8000`

## Features

- 🔍 Recipe search via web scraping (AllRecipes)
- 📚 Cooking history storage (JSON file)
- 🚀 FastAPI with automatic API documentation
- ✅ Request/response validation with Pydantic
- 🔄 CORS enabled for React frontend

## API Documentation

Once running, visit:
- Interactive docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Endpoints

### GET /api/health
Health check endpoint

### POST /api/search
Search for recipes by ingredient
```json
{
  "ingredients": ["chicken"],
  "maxResults": 10
}
```

### GET /api/history
Get cooking history

### POST /api/history
Add recipe to history
```json
{
  "id": "123",
  "name": "Recipe Name",
  "url": "https://...",
  "time": 30,
  "dishes": 4
}
```

### DELETE /api/history
Clear all history

## Development

The server runs with auto-reload enabled. Changes to code will automatically restart the server.
