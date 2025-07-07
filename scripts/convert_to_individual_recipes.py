#!/usr/bin/env python3
"""
Convert scraped recipe data into individual JSON files
"""

import json
import os
import re
from pathlib import Path

def clean_filename(name):
    """
    Clean a recipe name to create a valid filename.
    
    Args:
        name (str): Recipe name
        
    Returns:
        str: Clean filename
    """
    # Remove special characters and spaces
    filename = re.sub(r'[^\w\s-]', '', name)
    filename = re.sub(r'\s+', '_', filename)
    filename = filename.strip('_')
    return filename

def convert_recipe_to_format(recipe_data):
    """
    Convert scraped recipe data to the project's recipe format.
    
    Args:
        recipe_data (dict): Scraped recipe data
        
    Returns:
        dict: Recipe in project format
    """
    # Convert labor hours to hours and minutes
    total_hours = 0
    if recipe_data.get("labour_required") and recipe_data["labour_required"].get("parsed_hours"):
        total_hours = recipe_data["labour_required"]["parsed_hours"]
    
    hours = int(total_hours)
    minutes = int((total_hours - hours) * 60)
    
    # Get the first (and usually only) produced item as the product
    product = None
    if recipe_data.get("produces_items") and recipe_data["produces_items"]:
        first_output = recipe_data["produces_items"][0]
        product = {
            "name": first_output.get("name", "Unknown"),
            "quantity": first_output.get("quantity", 1)
        }
    
    # Convert to project format
    converted = {
        "product": product,
        "ingredients": [],
        "buildings": recipe_data.get("structures", []),
        "cost": {
            "labour": {
                "hours": hours,
                "minutes": minutes
            },
            "gold": recipe_data.get("cost", {}).get("amount", 0)
        }
    }
    
    # Convert required items to ingredients
    required_items = recipe_data.get("required_items", [])
    for item in required_items:
        converted["ingredients"].append({
            "name": item.get("name", "Unknown"),
            "quantity": item.get("quantity", 1)
        })
    
    return converted

def main():
    """Convert all scraped recipes to individual JSON files."""
    
    input_file = "potbs_recipe_details.json"
    output_dir = "src/recipes"
    
    print("Converting scraped recipes to individual JSON files...")
    print("=" * 60)
    
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    try:
        # Load scraped recipe data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both dict format (with "recipes" key) and direct list format
        if isinstance(data, dict) and "recipes" in data:
            recipes = data["recipes"]
        elif isinstance(data, list):
            recipes = data
        else:
            raise ValueError(f"Unexpected data format: {type(data)}")
        
        print(f"Found {len(recipes)} recipes to convert")
        
        converted_count = 0
        skipped_count = 0
        
        for i, recipe in enumerate(recipes):
            try:
                # Convert to project format
                converted_recipe = convert_recipe_to_format(recipe)
                
                # Create filename
                recipe_name = recipe.get("name", f"Recipe_{i}")
                filename = clean_filename(recipe_name)
                filepath = Path(output_dir) / f"{filename}.json"
                
                # Save individual recipe file
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(converted_recipe, f, indent=2, ensure_ascii=False)
                
                converted_count += 1
                
                print(f"  [{converted_count}/{len(recipes)}] Created: {filepath}")
                
            except Exception as e:
                skipped_count += 1
                recipe_name = recipe.get("name", f"Recipe_{i}")
                print(f"  [SKIPPED] {recipe_name}: {e}")
                continue
        
        print(f"\n" + "=" * 60)
        print(f"Successfully converted {converted_count} recipes")
        if skipped_count > 0:
            print(f"Skipped {skipped_count} recipes due to errors")
        print(f"Individual recipe files saved to: {output_dir}")
        
        # Show some sample conversions
        print(f"\nSample converted recipes:")
        for i, recipe in enumerate(recipes[:3]):
            filename = clean_filename(recipe["name"])
            filepath = Path(output_dir) / f"{filename}.json"
            
            print(f"\n{i+1}. {recipe['name']}")
            print(f"   File: {filepath}")
            
            # Calculate labor breakdown
            total_hours = recipe['labour_required']['parsed_hours'] if recipe['labour_required'] else 0
            hours = int(total_hours)
            minutes = int((total_hours - hours) * 60)
            
            print(f"   Ingredients: {len(recipe['required_items'])}")
            print(f"   Product: {recipe['produces_items'][0]['name'] if recipe['produces_items'] else 'None'}")
            print(f"   Buildings: {', '.join(recipe['structures'])}")
            print(f"   Labor: {hours}h {minutes}m")
            print(f"   Cost: {recipe['cost']['amount'] if recipe['cost'] else 0} gold")
            
    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
        print("Please run scrape_recipe_details_fixed.py first.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 