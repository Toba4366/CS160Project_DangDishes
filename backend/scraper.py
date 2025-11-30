import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_allrecipes(ingredient):
    """
    Scrape AllRecipes for recipes containing the given ingredient
    Returns a list of recipe dictionaries
    """
    url = f"https://www.allrecipes.com/search?q={ingredient}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        # Add small delay to be respectful
        time.sleep(0.5)
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        recipes = []
        
        # Debug: Print response status and a snippet
        print(f"Fetched {url} - Status: {response.status_code}")
        
        # Try multiple selectors as AllRecipes structure changes frequently
        # Method 1: Look for cards with specific structure
        recipe_cards = soup.find_all('a', {'id': lambda x: x and x.startswith('mntl-card-list-items')})
        
        if not recipe_cards:
            # Method 2: Look for any links with recipe patterns
            recipe_cards = soup.find_all('a', href=lambda x: x and '/recipe/' in x)
        
        if not recipe_cards:
            # Method 3: Look for common card classes
            recipe_cards = soup.select('a[href*="/recipe/"]')
        
        print(f"Found {len(recipe_cards)} potential recipe cards")
        
        seen_ids = set()
        
        for card in recipe_cards[:20]:  # Process more cards to filter duplicates
            try:
                # Extract link first
                link = card.get('href', '')
                if not link or '/recipe/' not in link:
                    continue
                
                # Generate ID from URL
                recipe_id = link.split('/')[-2] if '/' in link else str(hash(link))
                
                # Skip duplicates
                if recipe_id in seen_ids:
                    continue
                seen_ids.add(recipe_id)
                
                # Try to extract title from various possible locations
                title = None
                
                # Try span with card__title class
                title_elem = card.find('span', class_='card__title')
                if title_elem:
                    title = title_elem.text.strip()
                
                # Try other common title locations
                if not title:
                    title_elem = card.find('span', class_='card__title-text')
                    if title_elem:
                        title = title_elem.text.strip()
                
                # Try getting text directly from the link
                if not title:
                    title = card.get_text(strip=True)
                
                # Try extracting from URL as last resort
                if not title or len(title) < 3:
                    title = link.split('/')[-2].replace('-', ' ').title()
                
                if title and len(title) > 3:
                    recipes.append({
                        'id': recipe_id,
                        'name': title,
                        'url': link if link.startswith('http') else f"https://www.allrecipes.com{link}",
                        'time': random.randint(15, 60),  # Mock data
                        'dishes': random.randint(2, 6),   # Mock data
                        'isHistory': False,
                        'source': 'AllRecipes'
                    })
                    
                    if len(recipes) >= 15:
                        break
                        
            except Exception as e:
                print(f"Error parsing recipe card: {e}")
                continue
        
        print(f"Successfully parsed {len(recipes)} recipes")
        return recipes
        
    except requests.RequestException as e:
        print(f"Error fetching recipes: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error in scraper: {e}")
        import traceback
        traceback.print_exc()
        return []

def scrape_recipe_details(url):
    """
    Scrape detailed information from a recipe page
    Extracts ingredients, tools, and instructions
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        time.sleep(0.5)  # Be respectful
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        print(f"Scraping details from: {url}")
        
        # Extract ingredients
        ingredients = []
        
        # Method 1: Look for ingredient list items
        ingredient_elements = soup.select('li.mntl-structured-ingredients__list-item')
        if ingredient_elements:
            for elem in ingredient_elements:
                # Get the full ingredient text
                text = elem.get_text(strip=True)
                if text and len(text) > 1:
                    ingredients.append(text)
        
        # Method 2: Try different selectors
        if not ingredients:
            ingredient_elements = soup.select('[data-ingredient-name="true"]')
            for elem in ingredient_elements:
                text = elem.get_text(strip=True)
                if text:
                    ingredients.append(text)
        
        # Method 3: Look for any list with ingredient-related classes
        if not ingredients:
            ingredient_elements = soup.find_all(['li', 'p'], class_=lambda x: x and 'ingredient' in x.lower())
            for elem in ingredient_elements:
                text = elem.get_text(strip=True)
                if text and len(text) > 2:
                    ingredients.append(text)
        
        # Extract tools from ingredients (common kitchen tools)
        common_tools = [
            'pan', 'pot', 'bowl', 'spatula', 'spoon', 'knife', 'cutting board',
            'whisk', 'mixer', 'oven', 'stove', 'blender', 'food processor',
            'baking sheet', 'measuring cup', 'measuring spoon', 'colander',
            'strainer', 'grater', 'peeler', 'tongs', 'ladle'
        ]
        
        tools = []
        recipe_text = soup.get_text().lower()
        
        for tool in common_tools:
            if tool in recipe_text and tool not in [t.lower() for t in tools]:
                tools.append(tool.title())
        
        # Extract instructions
        instructions = []
        instruction_elements = soup.select('li.mntl-sc-block-group--LI, ol li, .recipe-directions li')
        for elem in instruction_elements:
            text = elem.get_text(strip=True)
            if text and len(text) > 10:
                instructions.append(text)
        
        # Extract times
        prep_time = None
        cook_time = None
        total_time = None
        servings = None
        
        # Look for time elements
        time_elements = soup.find_all(['div', 'span'], class_=lambda x: x and 'time' in str(x).lower())
        for elem in time_elements:
            text = elem.get_text(strip=True).lower()
            if 'prep' in text:
                prep_time = text
            elif 'cook' in text:
                cook_time = text
            elif 'total' in text:
                total_time = text
        
        recipe_details = {
            'ingredients': ingredients[:20] if ingredients else [],  # Limit to 20
            'tools': tools[:10] if tools else [],  # Limit to 10
            'instructions': instructions[:30] if instructions else [],  # Limit to 30
            'prepTime': prep_time,
            'cookTime': cook_time,
            'totalTime': total_time,
            'servings': servings
        }
        
        print(f"Extracted {len(ingredients)} ingredients, {len(tools)} tools, {len(instructions)} steps")
        return recipe_details
        
    except Exception as e:
        print(f"Error scraping recipe details: {e}")
        import traceback
        traceback.print_exc()
        return None

def search_recipes(ingredient, max_results=10):
    """
    Main search function that can be extended to search multiple sources
    """
    all_recipes = []
    
    # Search AllRecipes
    allrecipes_results = scrape_allrecipes(ingredient)
    all_recipes.extend(allrecipes_results[:max_results])
    
    # Could add more sources here:
    # - Food Network
    # - Serious Eats
    # - etc.
    
    return all_recipes
