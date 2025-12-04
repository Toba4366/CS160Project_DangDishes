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
    
    # Check if recipe already exists by name, URL, and source (not just ID)
    # This prevents duplicates when the same recipe is saved multiple times
    existing_index = None
    for i, r in enumerate(history):
        # Match by URL if both have URLs
        if recipe.get('url') and r.get('url') == recipe.get('url'):
            existing_index = i
            break
        # Match by name and source if no URL (for text recipes)
        if (not recipe.get('url') and not r.get('url') and 
            r.get('name') == recipe.get('name') and 
            r.get('source') == recipe.get('source')):
            existing_index = i
            break
    
    if existing_index is not None:
        # Update existing recipe's timestamp and cook count
        history[existing_index]['lastCooked'] = datetime.now().isoformat()
        history[existing_index]['cookCount'] = history[existing_index].get('cookCount', 1) + 1
        # Update any new fields from the recipe (like ingredients if they were parsed later)
        for key, value in recipe.items():
            if key not in ['lastCooked', 'cookCount', 'isHistory']:
                history[existing_index][key] = value
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
