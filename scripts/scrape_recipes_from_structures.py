#!/usr/bin/env python3
"""
PotBS Recipe Scraper
Visits each structure page and extracts recipe URLs from specific "Provides recipes:" and "Uses recipes:" table cells.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
import re

def scrape_recipes_from_structure(structure_url, structure_name):
    """
    Scrape a PotBS structure page and extract recipe URLs from specific table cells.
    
    Args:
        structure_url (str): URL of the structure page to scrape
        structure_name (str): Name of the structure
        
    Returns:
        list: List of recipes found on the page
    """
    print(f"  Scraping {structure_name}...")
    
    try:
        # Add headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(structure_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        recipes = []
        
        # Look for table cells with specific styles and text
        all_tds = soup.find_all('td')
        
        for td in all_tds:
            # Check for either "Provides recipes:" or "Uses recipes:" cells
            if (td.get('style') == 'white-space:nowrap;' and 
                td.get_text().strip() in ['Provides recipes:', 'Uses recipes:']):
                
                # Find the next td (sibling) that contains the recipe links
                next_td = td.find_next_sibling('td')
                if next_td:
                    links = next_td.find_all('a', href=True)
                    for link in links:
                        href = link.get('href')
                        if href and href.startswith('/wiki/'):
                            full_url = urljoin(structure_url, href)
                            recipe_name = link.get_text().strip()
                            if recipe_name:
                                recipes.append({
                                    'name': recipe_name,
                                    'url': full_url,
                                    'structure': structure_name
                                })
        
        # Remove duplicates within this structure
        unique_recipes = []
        seen_urls = set()
        for recipe in recipes:
            if recipe['url'] not in seen_urls:
                seen_urls.add(recipe['url'])
                unique_recipes.append(recipe)
        
        if unique_recipes:
            print(f"    Found {len(unique_recipes)} recipes")
        else:
            print(f"    No recipe sections found")
        
        return unique_recipes
        
    except requests.RequestException as e:
        print(f"    Error fetching {structure_url}: {e}")
        return []
    except Exception as e:
        print(f"    Error parsing {structure_url}: {e}")
        return []

def deduplicate_recipes(all_recipes):
    """
    Deduplicate recipes across all structures and create a clean mapping.
    
    Args:
        all_recipes (list): All recipes from all structures
        
    Returns:
        list: Deduplicated recipes with structure lists
    """
    print("Deduplicating recipes...")
    
    # Create a master list of unique recipes by URL
    unique_recipes = {}
    
    # Process all recipes
    for recipe in all_recipes:
        url = recipe['url']
        if url not in unique_recipes:
            unique_recipes[url] = {
                'name': recipe['name'],
                'url': recipe['url'],
                'structures': set()
            }
        unique_recipes[url]['structures'].add(recipe['structure'])
    
    # Convert to final format
    deduplicated_recipes = []
    for url, recipe_data in unique_recipes.items():
        deduplicated_recipes.append({
            'name': recipe_data['name'],
            'url': recipe_data['url'],
            'structures': sorted(list(recipe_data['structures']))
        })
    
    # Sort by recipe name for consistency
    deduplicated_recipes.sort(key=lambda x: x['name'])
    
    print(f"Deduplicated {len(all_recipes)} total entries into {len(deduplicated_recipes)} unique recipes")
    
    return deduplicated_recipes

def main():
    """Main function to scrape recipes from all structure pages."""
    
    structures_file = "potbs_structures_filtered.json"
    output_file = "potbs_recipes_clean.json"
    
    print("PotBS Recipe Scraper - Clean Unique Recipes")
    print("=" * 60)
    
    try:
        # Load structure URLs
        with open(structures_file, 'r', encoding='utf-8') as f:
            structures = json.load(f)
        
        print(f"Loaded {len(structures)} structures to process")
        
        all_recipes = []
        structure_recipe_count = {}
        
        # Process each structure
        print(f"Processing all {len(structures)} structures...")
        
        for i, structure in enumerate(structures):
            print(f"\n[{i+1}/{len(structures)}] Processing: {structure['name']}")
            
            recipes = scrape_recipes_from_structure(structure['url'], structure['name'])
            
            if recipes:
                all_recipes.extend(recipes)
                structure_recipe_count[structure['name']] = len(recipes)
            
            # Be polite to the server
            time.sleep(1)
        
        print(f"\n" + "=" * 60)
        print(f"INITIAL SUMMARY:")
        print(f"Processed {len(structures)} structures")
        print(f"Found {len(all_recipes)} total recipe entries")
        print(f"Structures with recipes: {len(structure_recipe_count)}")
        
        if all_recipes:
            # Deduplicate the recipes
            unique_recipes = deduplicate_recipes(all_recipes)
            
            # Create comprehensive output
            output_data = {
                'recipes': unique_recipes,
                'summary': {
                    'total_structures_processed': len(structures),
                    'structures_with_recipes': len(structure_recipe_count),
                    'unique_recipes_count': len(unique_recipes),
                    'total_raw_entries': len(all_recipes),
                    'duplicates_removed': len(all_recipes) - len(unique_recipes)
                }
            }
            
            # Save data
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            print(f"\nClean recipes saved to {output_file}")
            
            # Show sample results
            print(f"\nSample unique recipes found:")
            for recipe in unique_recipes[:10]:
                structures_str = ', '.join(recipe['structures'])
                print(f"  - {recipe['name']}")
                print(f"    Structures: {structures_str}")
                print()
            
            if len(unique_recipes) > 10:
                print(f"  ... and {len(unique_recipes) - 10} more unique recipes")
                
            # Show deduplication statistics
            print(f"\nDEDUPLICATION STATISTICS:")
            print(f"Original entries: {len(all_recipes)}")
            print(f"Unique recipes: {len(unique_recipes)}")
            print(f"Duplicates removed: {len(all_recipes) - len(unique_recipes)}")
            
        else:
            print("No recipes found in any structure pages.")
            
    except FileNotFoundError:
        print(f"Error: {structures_file} not found. Please run filter_structures.py first.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 