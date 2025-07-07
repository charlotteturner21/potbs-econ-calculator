#!/usr/bin/env python3
"""
Create an index file for all recipe JSON files
"""

import json
import os
from pathlib import Path

def create_recipe_index():
    """Create an index file listing all recipes."""
    
    recipes_dir = Path("src/recipes")
    index_file = recipes_dir / "index.json"
    
    print("Creating recipe index...")
    print("=" * 40)
    
    recipe_files = []
    recipe_summary = {
        "totalRecipes": 0,
        "recipesByStructure": {},
        "recipes": []
    }
    
    # Find all JSON files in recipes directory
    json_files = list(recipes_dir.glob("*.json"))
    
    for json_file in json_files:
        if json_file.name == "index.json":  # Skip the index file itself
            continue
            
        try:
            # Load recipe data
            with open(json_file, 'r', encoding='utf-8') as f:
                recipe = json.load(f)
            
            # Handle recipes with null products
            product_name = "Unknown"
            if recipe.get("product") and recipe["product"].get("name"):
                product_name = recipe["product"]["name"]
            
            # Add to summary
            recipe_info = {
                "name": product_name,
                "filename": json_file.name,
                "structures": recipe.get("buildings", []),
                "inputCount": len(recipe.get("ingredients", [])),
                "outputCount": 1 if recipe.get("product") else 0,
                "laborHours": recipe.get("cost", {}).get("labour", {}).get("hours", 0),
                "cost": recipe.get("cost", {}).get("gold", 0)
            }
            
            recipe_summary["recipes"].append(recipe_info)
            
            # Count by structure
            for structure in recipe.get("buildings", []):
                if structure not in recipe_summary["recipesByStructure"]:
                    recipe_summary["recipesByStructure"][structure] = 0
                recipe_summary["recipesByStructure"][structure] += 1
            
            print(f"  Added: {product_name} ({json_file.name})")
            
        except Exception as e:
            print(f"  Error reading {json_file}: {e}")
    
    recipe_summary["totalRecipes"] = len(recipe_summary["recipes"])
    
    # Sort recipes by name
    recipe_summary["recipes"].sort(key=lambda x: x["name"])
    
    # Save index file
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(recipe_summary, f, indent=2, ensure_ascii=False)
    
    print(f"\n" + "=" * 40)
    print(f"Recipe index created: {index_file}")
    print(f"Total recipes: {recipe_summary['totalRecipes']}")
    print(f"Structures covered: {len(recipe_summary['recipesByStructure'])}")
    
    # Show structure breakdown
    print(f"\nRecipes by structure:")
    for structure, count in sorted(recipe_summary["recipesByStructure"].items()):
        print(f"  {structure}: {count} recipes")

def main():
    """Main function."""
    create_recipe_index()

if __name__ == "__main__":
    main() 