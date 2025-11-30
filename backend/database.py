import json
import os
from datetime import datetime

HISTORY_FILE = 'recipe_history.json'

def get_history():
    """Load recipe history from JSON file"""
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    return []

def add_to_history(recipe):
    """Add a recipe to history with timestamp"""
    history = get_history()
    
    # Check if recipe already exists in history
    existing_index = next((i for i, r in enumerate(history) if r.get('id') == recipe.get('id')), None)
    
    if existing_index is not None:
        # Update existing recipe's timestamp
        history[existing_index]['lastCooked'] = datetime.now().isoformat()
        history[existing_index]['cookCount'] = history[existing_index].get('cookCount', 1) + 1
        # Move to front
        recipe_data = history.pop(existing_index)
        history.insert(0, recipe_data)
    else:
        # Add new recipe
        recipe['lastCooked'] = datetime.now().isoformat()
        recipe['cookCount'] = 1
        recipe['isHistory'] = True
        history.insert(0, recipe)
    
    # Keep only last 50 recipes
    history = history[:50]
    
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)
    
    return recipe

def clear_history():
    """Clear all recipe history"""
    if os.path.exists(HISTORY_FILE):
        os.remove(HISTORY_FILE)
    return True
