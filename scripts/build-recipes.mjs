import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const recipesDir = path.join(__dirname, '..', 'src', 'recipes');
const outputDir = path.join(__dirname, '..', 'src', 'data');
const outputFile = path.join(outputDir, 'recipes.js');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Convert old recipe format to new multiple products format
 * @param {Object} recipeData - The original recipe data
 * @returns {Object} - Recipe data with products array format
 */
function convertToNewFormat(recipeData) {
    const converted = { ...recipeData };
    
    // Handle product/products conversion
    if (recipeData.product && !recipeData.products) {
        // Convert single product to products array
        if (recipeData.product === null) {
            converted.products = [];
        } else {
            converted.products = [recipeData.product];
        }
        // Remove old product field
        delete converted.product;
        console.log(`  → Converted single product to products array`);
    } else if (!recipeData.products) {
        // No product or products field - set empty array
        converted.products = [];
        console.log(`  → Added empty products array`);
    }
    
    // Ensure products is always an array
    if (converted.products && !Array.isArray(converted.products)) {
        converted.products = [converted.products];
        console.log(`  → Wrapped single product in array`);
    }
    
    return converted;
}

async function buildRecipes() {
    const recipeFiles = fs.readdirSync(recipesDir)
        .filter(file => file.endsWith('.json'))
        .filter(file => !file.startsWith('.'))
        .filter(file => file !== 'index.json'); // Skip index file

    const recipes = {};
    let convertedCount = 0;

    for (const file of recipeFiles) {
        const recipeName = path.basename(file, '.json');
        const filePath = path.join(recipesDir, file);
        
        try {
            // Read and parse the JSON file
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const originalData = JSON.parse(fileContent);
            
            // Convert to new format
            const recipeData = convertToNewFormat(originalData);
            
            // Check if conversion happened
            if (originalData.product !== undefined && recipeData.products !== undefined) {
                convertedCount++;
            }
            
            // Add to recipes object using filename as key
            recipes[recipeName] = recipeData;
            
            console.log(`✓ Added recipe: ${recipeName}`);
        } catch (error) {
            console.error(`✗ Error loading recipe ${recipeName}:`, error.message);
        }
    }

    // Generate the output file
    const outputContent = `// Auto-generated file - Do not edit manually
// Generated on ${new Date().toISOString()}
// Built from JSON files in src/recipes/
// Format: Updated to support multiple products per recipe

export default ${JSON.stringify(recipes, null, 2)};
`;

    fs.writeFileSync(outputFile, outputContent);
    console.log(`\n✓ Build complete! Generated ${outputFile}`);
    console.log(`✓ Combined ${Object.keys(recipes).length} recipes`);
    console.log(`✓ Converted ${convertedCount} recipes from old format to new products array format`);
}

// Run the build
buildRecipes().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
}); 