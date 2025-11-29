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
    This is a placeholder for future implementation
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract detailed recipe data
        recipe_details = {
            'ingredients': [],
            'instructions': [],
            'prepTime': None,
            'cookTime': None,
            'totalTime': None,
            'servings': None
        }
        
        # Add scraping logic for recipe details here
        # This would need to be customized based on AllRecipes' current HTML structure
        
        return recipe_details
        
    except Exception as e:
        print(f"Error scraping recipe details: {e}")
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
