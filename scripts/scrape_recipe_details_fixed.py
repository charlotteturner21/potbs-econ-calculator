#!/usr/bin/env python3
"""
PotBS Recipe Detail Scraper - Fixed Version
Visits each recipe page and extracts detailed information from specific table rows.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re

def clean_recipe_name(name):
    """
    Clean up recipe names by removing common suffixes.
    
    Args:
        name (str): Raw recipe name
        
    Returns:
        str: Cleaned recipe name
    """
    # Remove "(recipe)" suffix (case insensitive)
    if name.lower().endswith('(recipe)'):
        name = name[:-8].strip()
    elif name.lower().endswith(' (recipe)'):
        name = name[:-9].strip()
    
    return name

def scrape_recipe_details(recipe_url, recipe_name):
    """
    Scrape a PotBS recipe page and extract detailed information.
    
    Args:
        recipe_url (str): URL of the recipe page to scrape
        recipe_name (str): Name of the recipe
        
    Returns:
        dict: Detailed recipe information
    """
    # Clean the recipe name
    cleaned_name = clean_recipe_name(recipe_name)
    print(f"  Scraping {cleaned_name}...")
    
    try:
        # Add headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(recipe_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        recipe_details = {
            'name': cleaned_name,  # Use cleaned name
            'url': recipe_url,
            'required_items': [],
            'produces_items': [],
            'labour_required': None,
            'cost': None
        }
        
        # Find all table rows
        all_trs = soup.find_all('tr')
        
        for tr in all_trs:
            # Get all cells in this row
            cells = tr.find_all(['td', 'th'])
            if len(cells) < 2:
                continue
                
            # Get the first cell text (the label)
            first_cell = cells[0].get_text().strip()
            second_cell = cells[1].get_text().strip()
            
            # Check for specific labels (handle multiple synonyms)
            first_cell_lower = first_cell.lower()
            
            # Handle labor/labour variations
            if first_cell_lower in ['labor required:', 'labour required:', 'labor:', 'labour:']:
                recipe_details['labour_required'] = parse_labour_simple(second_cell)
                
            elif first_cell_lower == 'cost:':
                recipe_details['cost'] = parse_cost_simple(second_cell)
                
            # Handle required items variations
            elif first_cell_lower in ['required items:', 'inputs:', 'needs:']:
                recipe_details['required_items'] = parse_items_from_html(cells[1])
                
            # Handle produced items variations  
            elif first_cell_lower in ['produces items:', 'outputs:', 'output:', 'produces:']:
                recipe_details['produces_items'] = parse_items_from_html(cells[1])
        
        return recipe_details
        
    except requests.RequestException as e:
        print(f"    Error fetching {recipe_url}: {e}")
        return None
    except Exception as e:
        print(f"    Error parsing {recipe_url}: {e}")
        return None

def parse_labour_simple(text):
    """
    Parse labour text simply.
    
    Args:
        text (str): Labour text like '0.75 hour(s)' or '1d 12h 0m hour(s)'
        
    Returns:
        dict: Labour information
    """
    return {
        'raw_text': text,
        'parsed_hours': extract_hours_from_text(text)
    }

def extract_hours_from_text(text):
    """
    Extract total hours from text like '1d 12h 0m hour(s)' or '0.75 hour(s)'
    
    Args:
        text (str): Time text
        
    Returns:
        float: Total hours
    """
    total_hours = 0
    
    # Look for days
    days_match = re.search(r'(\d+)d', text)
    if days_match:
        total_hours += int(days_match.group(1)) * 24
    
    # Look for hours
    hours_match = re.search(r'(\d+)h', text)
    if hours_match:
        total_hours += int(hours_match.group(1))
    
    # Look for minutes
    minutes_match = re.search(r'(\d+)m', text)
    if minutes_match:
        total_hours += int(minutes_match.group(1)) / 60
    
    # Look for decimal hours like '0.75 hour(s)'
    decimal_match = re.search(r'(\d+\.?\d*)\s*hour', text)
    if decimal_match and total_hours == 0:  # Only if we didn't find d/h/m format
        total_hours = float(decimal_match.group(1))
    
    return total_hours

def parse_cost_simple(text):
    """
    Parse cost text simply.
    
    Args:
        text (str): Cost text like '120'
        
    Returns:
        dict: Cost information
    """
    # Extract numbers from the text
    numbers = re.findall(r'\d+', text)
    amount = int(numbers[0]) if numbers else None
    
    return {
        'raw_text': text,
        'amount': amount,
        'currency': 'doubloons'  # Default currency in PotBS
    }

def parse_items_simple(text):
    """
    Parse items text simply.
    
    Args:
        text (str): Items text like 'Ingot, Iron: 2' or 'Anchor: 1'
        
    Returns:
        list: List of items with quantities
    """
    items = []
    
    # Split by commas or other common separators
    parts = re.split(r'[,\n\r]+', text)
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Look for pattern like "Item Name: quantity"
        if ':' in part:
            item_name, quantity_str = part.rsplit(':', 1)
            item_name = item_name.strip()
            quantity_str = quantity_str.strip()
            
            # Extract quantity
            quantity_match = re.search(r'(\d+)', quantity_str)
            quantity = int(quantity_match.group(1)) if quantity_match else 1
            
            items.append({
                'name': item_name,
                'quantity': quantity
            })
    
    return items

def parse_items_from_html(cell_element):
    """
    Parse items from HTML table cell, extracting link text for better ingredient names.
    
    Args:
        cell_element: BeautifulSoup element (td cell)
        
    Returns:
        list: List of items with quantities
    """
    items = []
    
    # Find all links in the cell
    links = cell_element.find_all('a')
    
    if links:
        # Extract items from links
        for link in links:
            # Get the link text (this should be the proper ingredient name)
            link_text = link.get_text().strip()
            
            # Find the quantity by looking at the text after the link
            # The pattern is usually: <a>Ingredient Name</a>: quantity
            link_html = str(link)
            
            # Find the parent text that contains this link
            parent_text = cell_element.get_text()
            
            # Look for the ingredient name followed by a colon and number
            # This regex looks for the link text followed by ": number"
            pattern = re.escape(link_text) + r':\s*(\d+)'
            match = re.search(pattern, parent_text)
            
            if match:
                quantity = int(match.group(1))
                items.append({
                    'name': link_text,
                    'quantity': quantity
                })
    else:
        # Fallback to old text parsing if no links found
        text = cell_element.get_text().strip()
        return parse_items_simple(text)
    
    return items

def main():
    """Main function to scrape recipe details."""
    
    recipes_file = "potbs_recipes_clean.json"
    output_file = "potbs_recipe_details.json"
    
    print("PotBS Recipe Detail Scraper - Fixed Version")
    print("=" * 55)
    
    try:
        # Load recipe URLs
        with open(recipes_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        recipes = data['recipes']
        print(f"Loaded {len(recipes)} recipes to process")
        
        # Process all recipes
        print(f"Processing all {len(recipes)} recipes...")
        
        detailed_recipes = []
        
        for i, recipe in enumerate(recipes):
            print(f"\n[{i+1}/{len(recipes)}] Processing: {recipe['name']}")
            
            details = scrape_recipe_details(recipe['url'], recipe['name'])
            
            if details:
                # Add structure information from original data
                details['structures'] = recipe['structures']
                detailed_recipes.append(details)
                
                # Show what we found
                print(f"    Required items: {len(details['required_items'])}")
                print(f"    Produces items: {len(details['produces_items'])}")
                print(f"    Labour: {details['labour_required']['raw_text'] if details['labour_required'] else 'None'}")
                print(f"    Cost: {details['cost']['raw_text'] if details['cost'] else 'None'}")
            
            # Be polite to the server
            time.sleep(1)
        
        print(f"\n" + "=" * 55)
        print(f"FULL PROCESSING COMPLETE")
        print(f"Successfully processed {len(detailed_recipes)} recipes")
        
        if detailed_recipes:
            # Save detailed recipes
            output_data = {
                'recipes': detailed_recipes,
                'summary': {
                    'total_recipes_processed': len(detailed_recipes),
                    'sample_size': len(recipes),
                    'total_recipes_available': len(recipes)
                }
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            print(f"\nDetailed recipes saved to {output_file}")
            
            # Show sample results
            print(f"\nSample detailed recipes:")
            for recipe in detailed_recipes[:3]:
                print(f"\n{recipe['name']}:")
                print(f"  Structures: {', '.join(recipe['structures'])}")
                if recipe['required_items']:
                    print(f"  Required items:")
                    for item in recipe['required_items']:
                        print(f"    - {item['quantity']} {item['name']}")
                if recipe['produces_items']:
                    print(f"  Produces items:")
                    for item in recipe['produces_items']:
                        print(f"    - {item['quantity']} {item['name']}")
                if recipe['labour_required']:
                    print(f"  Labour: {recipe['labour_required']['raw_text']} ({recipe['labour_required']['parsed_hours']} hours)")
                if recipe['cost']:
                    print(f"  Cost: {recipe['cost']['amount']} {recipe['cost']['currency']}")
                    
        else:
            print("No recipes were successfully processed.")
            
    except FileNotFoundError:
        print(f"Error: {recipes_file} not found. Please run scrape_recipes_from_structures.py first.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 