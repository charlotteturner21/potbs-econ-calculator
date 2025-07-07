#!/usr/bin/env python3
"""
Fix product names that were truncated during scraping
"""

import json
import os
import re
from pathlib import Path

def clean_filename_to_product_name(filename):
    """
    Convert a filename back to a proper product name.
    
    Args:
        filename (str): The filename without extension
        
    Returns:
        str: The proper product name
    """
    # Remove common prefixes
    name = filename
    if name.startswith('Recipe_'):
        name = name[7:]  # Remove 'Recipe_' prefix
    
    # Replace underscores with spaces
    name = name.replace('_', ' ')
    
    # Handle special cases with apostrophes
    name = re.sub(r'\b([A-Z][a-z]+)s\b', r"\1's", name)  # Convert "Admirals" to "Admiral's"
    
    return name

def should_fix_product_name(recipe_data, filename):
    """
    Determine if a product name needs fixing.
    
    Args:
        recipe_data (dict): The recipe data
        filename (str): The filename without extension
        
    Returns:
        bool: True if the product name needs fixing
    """
    if not recipe_data.get('product') or not recipe_data['product'].get('name'):
        return False
    
    product_name = recipe_data['product']['name']
    
    # List of quality descriptors that are often truncated
    quality_descriptors = [
        'First-Rate', 'Well-made', 'Rough', 'Inferior', 'Standard', 
        'Improved', 'Quality', 'Fine', 'Crude', 'Master\'s', 'Heavy',
        'Superior', 'Unknown'
    ]
    
    # Check if product name is just a quality descriptor
    if product_name in quality_descriptors:
        return True
    
    # Check if the filename suggests a longer name
    expected_name = clean_filename_to_product_name(filename)
    if len(expected_name) > len(product_name) and product_name in expected_name:
        return True
    
    return False

def fix_recipe_file(filepath):
    """
    Fix a single recipe file's product name.
    
    Args:
        filepath (Path): Path to the recipe file
        
    Returns:
        bool: True if the file was modified
    """
    try:
        # Load the recipe
        with open(filepath, 'r', encoding='utf-8') as f:
            recipe_data = json.load(f)
        
        filename = filepath.stem
        
        # Check if this recipe needs fixing
        if should_fix_product_name(recipe_data, filename):
            # Fix the product name
            corrected_name = clean_filename_to_product_name(filename)
            old_name = recipe_data['product']['name']
            recipe_data['product']['name'] = corrected_name
            
            # Save the corrected recipe
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(recipe_data, f, indent=2, ensure_ascii=False)
            
            print(f"Fixed: {old_name} → {corrected_name} ({filepath.name})")
            return True
        
        return False
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Fix all recipe files with truncated product names."""
    
    recipes_dir = Path("src/recipes")
    
    print("Fixing truncated product names...")
    print("=" * 60)
    
    fixed_count = 0
    total_count = 0
    
    # Process all JSON files except the index
    for json_file in recipes_dir.glob("*.json"):
        if json_file.name == "index.json":
            continue
            
        total_count += 1
        if fix_recipe_file(json_file):
            fixed_count += 1
    
    print(f"\n" + "=" * 60)
    print(f"Fixed {fixed_count} out of {total_count} recipe files")
    
    if fixed_count > 0:
        print(f"\nRebuilding recipe index...")
        # We should rebuild the index after fixing the names
        import subprocess
        try:
            subprocess.run(["python", "scripts/create_recipe_index.py"], check=True)
            print("Recipe index rebuilt successfully")
        except Exception as e:
            print(f"Error rebuilding index: {e}")

if __name__ == "__main__":
    main() 