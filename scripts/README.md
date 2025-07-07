# PotBS Recipe Scraping Scripts

This directory contains the production-ready scripts for scraping authentic Pirates of the Burning Sea recipe data from the official wiki.

## Scripts Overview

### 1. Complete Workflow Scripts

**`scrape_structures.py`**
- **Purpose**: Scrapes the Category:Structures page to get all structure URLs
- **Output**: `potbs_structures.json` - Raw list of all structures
- **Usage**: `python scripts/scrape_structures.py`

**`filter_structures.py`**
- **Purpose**: Filters structure URLs to remove navigation items and keep only actual production structures
- **Input**: `potbs_structures.json`
- **Output**: `potbs_structures_filtered.json` - Clean list of 62 production structures
- **Usage**: `python scripts/filter_structures.py`

**`scrape_recipes_from_structures.py`**
- **Purpose**: Visits each structure page and extracts recipe URLs from "Provides recipes:" and "Uses recipes:" sections
- **Input**: `potbs_structures_filtered.json`
- **Output**: `potbs_recipes_clean.json` - Complete list of 1,180+ unique recipes with structure mappings
- **Usage**: `python scripts/scrape_recipes_from_structures.py`

**`scrape_recipe_details_fixed.py`**
- **Purpose**: Scrapes detailed recipe information from individual recipe pages (ingredients, outputs, labor, cost)
- **Input**: `potbs_recipes_clean.json`
- **Output**: `potbs_recipe_details.json` - Detailed recipe data
- **Usage**: `python scripts/scrape_recipe_details_fixed.py`

**`convert_to_individual_recipes.py`**
- **Purpose**: Converts scraped recipe data into individual JSON files matching the project's format
- **Input**: `potbs_recipe_details.json`
- **Output**: Individual recipe files in `src/recipes/` directory
- **Usage**: `python scripts/convert_to_individual_recipes.py`



### 2. Utility Scripts

**`create_recipe_index.py`**
- **Purpose**: Creates an index file summarizing all individual recipe files for easy React app integration
- **Input**: All JSON files in `src/recipes/`
- **Output**: `src/recipes/index.json`
- **Usage**: `python scripts/create_recipe_index.py`

### 3. Legacy Scripts

**`build-recipes.mjs`**
- **Purpose**: Original Node.js build script (may be obsolete)
- **Status**: Kept for reference, replaced by Python pipeline

## Complete Workflow

To scrape and convert all PotBS recipes from scratch:

```bash
# 1. Get all structure URLs
python scripts/scrape_structures.py

# 2. Filter to production structures only
python scripts/filter_structures.py

# 3. Extract recipe URLs from all structures  
python scripts/scrape_recipes_from_structures.py

# 4. Scrape detailed recipe information
python scripts/scrape_recipe_details_fixed.py

# 5. Convert to individual JSON files
python scripts/convert_to_individual_recipes.py

# 6. (Optional) Create index file
python scripts/create_recipe_index.py
```

## Output Format

Individual recipe files follow this format (matching `Mediator.json`):

```json
{
    "product": {
        "name": "Recipe Output Name",
        "quantity": 1
    },
    "ingredients": [
        {
            "name": "Required Item",
            "quantity": 5
        }
    ],
    "buildings": [
        "Structure Name"
    ],
    "cost": {
        "labour": {
            "hours": 2,
            "minutes": 30
        },
        "gold": 100
    }
}
```

## Features

- **Comprehensive Coverage**: Scrapes all 1,180+ authentic PotBS recipes
- **Clean Data**: Handles recipe name cleaning (removes "(recipe)" suffix)
- **Intelligent HTML Parsing**: Extracts proper ingredient names from HTML links instead of plain text
- **Synonym Support**: Handles different table formats ("Labor:" vs "Labor required:", "Outputs:" vs "Produces items:")
- **Complex Time Parsing**: Converts "1d 12h 30m hour(s)" to hours and minutes
- **Structure Mapping**: Shows which buildings can make each recipe
- **Error Handling**: Graceful handling of missing data and parsing errors
- **Rate Limiting**: Includes delays to be respectful to the wiki server

## Data Quality

The scripts successfully extract:
- ✅ Recipe names (cleaned)
- ✅ Required ingredients with quantities
- ✅ Produced items with quantities  
- ✅ Labor time (hours and minutes)
- ✅ Gold costs
- ✅ Building/structure requirements
- ✅ Cross-references between recipes and structures

## Notes

- Scripts include 1-second delays between requests to avoid overwhelming the wiki
- Sample processing is enabled by default (first 10 recipes); modify `sample_size` variables to process all recipes
- All scripts include comprehensive error handling and progress reporting
- Output files are UTF-8 encoded to handle special characters in recipe names 