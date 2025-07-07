#!/usr/bin/env python3
"""
Filter structure URLs to keep only actual PotBS structures.
"""

import json
import re

def is_structure_name(name):
    """
    Check if a name appears to be a PotBS structure.
    
    Args:
        name (str): The name to check
        
    Returns:
        bool: True if this appears to be a structure
    """
    # Common structure types and keywords
    structure_keywords = [
        'forge', 'mine', 'plantation', 'quarry', 'shipyard', 'logging camp',
        'lumber mill', 'distillery', 'brewery', 'refinery', 'mill', 'camp',
        'lodge', 'yard', 'office', 'smelter', 'tannery', 'textile',
        'advanced', 'master', 'basic', 'company', 'assembly', 'careening',
        'draughtsman', 'fishing', 'hunting', 'powder', 'sugar', 'pasture'
    ]
    
    # Material/resource names that appear in structure names
    materials = [
        'copper', 'iron', 'gold', 'silver', 'zinc', 'sulfur', 'coal',
        'ironwood', 'oak', 'teak', 'fir', 'granite', 'limestone', 'marble',
        'cotton', 'sugar', 'tobacco', 'cacao', 'coffee', 'prickly pear',
        'general', 'gravel', 'small', 'medium', 'large'
    ]
    
    name_lower = name.lower()
    
    # Check if name contains structure keywords
    for keyword in structure_keywords:
        if keyword in name_lower:
            return True
    
    # Check if name contains materials (often part of structure names)
    for material in materials:
        if f'({material})' in name_lower or f' {material} ' in name_lower:
            return True
    
    return False

def is_navigation_item(name):
    """
    Check if a name appears to be a navigation item rather than a structure.
    
    Args:
        name (str): The name to check
        
    Returns:
        bool: True if this appears to be a navigation item
    """
    navigation_items = [
        'main page', 'the game', 'missions', 'reputation', 'personal equipment',
        'marks of conquest', 'commendations', 'alternative install', 'ships',
        'ship overview', 'ammunition', 'economy', 'community', 'wiki forum',
        'wiki admins', 'outfitting', 'spreadsheets', 'recipes', 'structures',
        'recipe books', 'raw materials', 'manufactured goods', 'shipwright materials',
        'guides', 'societies', 'templates', 'interactive maps', 'recent blog posts'
    ]
    
    name_lower = name.lower()
    
    for nav_item in navigation_items:
        if nav_item in name_lower:
            return True
    
    return False

def filter_structures(input_file, output_file):
    """
    Filter structure URLs to keep only actual structures.
    
    Args:
        input_file (str): Path to input JSON file
        output_file (str): Path to output JSON file
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        all_items = json.load(f)
    
    print(f"Processing {len(all_items)} items...")
    
    structures = []
    
    for item in all_items:
        name = item['name']
        
        # Skip navigation items
        if is_navigation_item(name):
            print(f"Skipping navigation: {name}")
            continue
        
        # Keep items that look like structures
        if is_structure_name(name):
            structures.append(item)
            print(f"Keeping structure: {name}")
        else:
            print(f"Skipping unknown: {name}")
    
    print(f"\nFiltered down to {len(structures)} structures")
    
    # Save filtered results
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(structures, f, indent=2, ensure_ascii=False)
    
    return structures

def main():
    """Main function to filter structures."""
    
    input_file = "potbs_structures_clean.json"
    output_file = "potbs_structures_filtered.json"
    
    print("PotBS Structure Filter")
    print("=" * 30)
    
    try:
        structures = filter_structures(input_file, output_file)
        
        if structures:
            print(f"\nFiltered structure list saved to {output_file}")
            
            print("\nFirst 10 filtered structures:")
            for i, structure in enumerate(structures[:10], 1):
                print(f"{i:2d}. {structure['name']}")
        else:
            print("No structures found after filtering.")
            
    except FileNotFoundError:
        print(f"Error: {input_file} not found. Please run scrape_structures.py first.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 