import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Grid,
    IconButton,
    Divider,
    Alert,
    Paper,
    Chip,
    Stack,
    Autocomplete
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Download as DownloadIcon,
    Preview as PreviewIcon
} from '@mui/icons-material';
import buildings from '../data/buildings';

function RecipeGenerator({ generatorState, setGeneratorState }) {
    // Extract state values from props
    const { recipe, previewMode, generatedContent, fileName } = generatorState;



    const handleRecipeChange = (field, value) => {
        setGeneratorState(prev => ({
            ...prev,
            recipe: { ...prev.recipe, [field]: value }
        }));
        if (field === 'products' && value.length > 0) {
            // Use first product name for filename
            setGeneratorState(prev => ({
                ...prev,
                fileName: value[0].name.replace(/[^a-zA-Z0-9]/g, '')
            }));
        }
    };

    const handleProductChange = (index, field, value) => {
        const newProducts = [...recipe.products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setGeneratorState(prev => ({
            ...prev,
            recipe: { ...prev.recipe, products: newProducts }
        }));
        
        if (field === 'name' && index === 0) {
            setGeneratorState(prev => ({
                ...prev,
                fileName: value.replace(/[^a-zA-Z0-9]/g, '')
            }));
        }
    };

    const addProduct = () => {
        setGeneratorState(prev => ({
            ...prev,
            recipe: {
                ...prev.recipe,
                products: [...prev.recipe.products, { name: '', quantity: 1 }]
            }
        }));
    };

    const removeProduct = (index) => {
        if (recipe.products.length > 1) {
            setGeneratorState(prev => ({
                ...prev,
                recipe: {
                    ...prev.recipe,
                    products: prev.recipe.products.filter((_, i) => i !== index)
                }
            }));
        }
    };

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...recipe.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setGeneratorState(prev => ({
            ...prev,
            recipe: { ...prev.recipe, ingredients: newIngredients }
        }));
    };

    const addIngredient = () => {
        setGeneratorState(prev => ({
            ...prev,
            recipe: {
                ...prev.recipe,
                ingredients: [...prev.recipe.ingredients, { name: '', quantity: 1 }]
            }
        }));
    };

    const removeIngredient = (index) => {
        setGeneratorState(prev => ({
            ...prev,
            recipe: {
                ...prev.recipe,
                ingredients: prev.recipe.ingredients.filter((_, i) => i !== index)
            }
        }));
    };

    const handleBuildingChange = (event, newValue) => {
        setGeneratorState(prev => ({
            ...prev,
            recipe: { ...prev.recipe, buildings: newValue }
        }));
    };

    const generateRecipeFile = () => {
        const recipeData = {
            products: recipe.products.filter(p => p.name.trim()), // Filter out empty products
            ingredients: recipe.ingredients,
            buildings: recipe.buildings,
            cost: {
                labour: {
                    hours: recipe.cost.labour.hours,
                    minutes: recipe.cost.labour.minutes
                },
                gold: recipe.cost.gold
            }
        };
        
        const content = JSON.stringify(recipeData, null, 4);
        
        setGeneratorState(prev => ({
            ...prev,
            generatedContent: content,
            previewMode: true
        }));
    };

    const downloadFile = () => {
        const blob = new Blob([generatedContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName || 'recipe'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };



    const resetForm = () => {
        setGeneratorState({
            recipe: {
                products: [{ name: '', quantity: 1 }],
                ingredients: [],
                buildings: [],
                cost: {
                    labour: {
                        hours: 0,
                        minutes: 0
                    },
                    gold: 0
                }
            },
            previewMode: false,
            generatedContent: '',
            fileName: ''
        });
    };

    return (
        <Box sx={{ maxWidth: 1200, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Recipe Generator
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create new recipe JSON files with labour time and gold costs for your Pirates of the Burning Sea economy calculator
            </Typography>

            {/* Form Section - Always Full Width */}
            <Stack spacing={3} sx={{ alignItems: 'stretch' }}>
                        {/* Products Section - Own Card */}
                        <Card>
                            <CardContent sx={{ textAlign: 'left' }}>
                                <Typography variant="h6" gutterBottom>
                                    Products
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    What does this recipe produce?
                                </Typography>
                                
                                <Stack spacing={2}>
                                    {recipe.products.map((product, index) => (
                                        <Stack key={index} direction="row" spacing={2} alignItems="center">
                                            <TextField
                                                label={`Product ${index + 1} Name`}
                                                variant="outlined"
                                                value={product.name}
                                                onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                                required
                                                error={!product.name.trim()}
                                                placeholder="Enter new product name..."
                                                sx={{ flexGrow: 1 }}
                                            />
                                            <TextField
                                                label="Quantity"
                                                type="number"
                                                value={product.quantity}
                                                onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                inputProps={{ min: 1 }}
                                                sx={{ width: 120 }}
                                            />
                                            <IconButton 
                                                onClick={() => addProduct()}
                                                color="primary"
                                                size="small"
                                            >
                                                <AddIcon />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => removeProduct(index)}
                                                color="error"
                                                size="small"
                                                disabled={recipe.products.length === 1}
                                            >
                                                <RemoveIcon />
                                            </IconButton>
                                        </Stack>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Production Cost Section - Own Card */}
                        <Card>
                            <CardContent sx={{ textAlign: 'left' }}>
                                <Typography variant="h6" gutterBottom>
                                    Production Cost
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Time and gold required to produce this recipe
                                </Typography>
                                
                                <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start' }}>
                                    <TextField
                                        label="Labour Hours"
                                        type="number"
                                        value={recipe.cost.labour.hours}
                                        onChange={(e) => setGeneratorState(prev => ({
                                            ...prev,
                                            recipe: {
                                                ...prev.recipe,
                                                cost: {
                                                    ...prev.recipe.cost,
                                                    labour: {
                                                        ...prev.recipe.cost.labour,
                                                        hours: parseInt(e.target.value) || 0
                                                    }
                                                }
                                            }
                                        }))}
                                        inputProps={{ min: 0 }}
                                        helperText="Production time in hours"
                                        error={recipe.cost.labour.hours === 0 && recipe.cost.labour.minutes === 0}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        label="Labour Minutes"
                                        type="number"
                                        value={recipe.cost.labour.minutes}
                                        onChange={(e) => setGeneratorState(prev => ({
                                            ...prev,
                                            recipe: {
                                                ...prev.recipe,
                                                cost: {
                                                    ...prev.recipe.cost,
                                                    labour: {
                                                        ...prev.recipe.cost.labour,
                                                        minutes: Math.min(59, parseInt(e.target.value) || 0)
                                                    }
                                                }
                                            }
                                        }))}
                                        inputProps={{ min: 0, max: 59 }}
                                        helperText="Additional minutes (0-59)"
                                        error={recipe.cost.labour.hours === 0 && recipe.cost.labour.minutes === 0}
                                        sx={{ width: 140 }}
                                    />
                                    <TextField
                                        label="Gold Cost *"
                                        type="number"
                                        value={recipe.cost.gold}
                                        onChange={(e) => setGeneratorState(prev => ({
                                            ...prev,
                                            recipe: {
                                                ...prev.recipe,
                                                cost: {
                                                    ...prev.recipe.cost,
                                                    gold: parseInt(e.target.value) || 0
                                                }
                                            }
                                        }))}
                                        inputProps={{ min: 1 }}
                                        helperText="Gold required for production"
                                        error={recipe.cost.gold === 0}
                                        required
                                        sx={{ width: 140 }}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                        
                        {/* Ingredients Section - Own Card */}
                        <Card>
                            <CardContent sx={{ textAlign: 'left' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Typography variant="h6">
                                        Ingredients
                                    </Typography>
                                    <IconButton onClick={addIngredient} size="small" color="primary" title="Add ingredient">
                                        <AddIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Materials required to craft this recipe (leave empty for base recipes)
                                </Typography>
                                
                                {recipe.ingredients.length > 0 ? (
                                    <Stack spacing={2}>
                                        {recipe.ingredients.map((ingredient, index) => (
                                            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <TextField
                                                    label="Ingredient Name"
                                                    value={ingredient.name}
                                                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                                    placeholder="Enter ingredient name..."
                                                    sx={{ flex: 1 }}
                                                />
                                                <TextField
                                                    label="Qty"
                                                    type="number"
                                                    value={ingredient.quantity}
                                                    onChange={(e) => handleIngredientChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    sx={{ width: 80 }}
                                                    inputProps={{ min: 1 }}
                                                />
                                                <IconButton 
                                                    onClick={() => removeIngredient(index)}
                                                    color="error"
                                                    title="Remove ingredient"
                                                >
                                                    <RemoveIcon />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Paper sx={{ p: 2, textAlign: 'left', bgcolor: 'success.light', color: 'success.contrastText' }}>
                                        <Typography variant="body2">
                                            No ingredients required - Base recipe
                                        </Typography>
                                        <Typography variant="caption">
                                            This recipe only requires a cost and buildings
                                        </Typography>
                                    </Paper>
                                )}
                            </CardContent>
                        </Card>

                        {/* Buildings Section - Own Card */}
                        <Card>
                            <CardContent sx={{ textAlign: 'left' }}>
                                <Typography variant="h6" gutterBottom>
                                    Buildings *
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Required buildings where this recipe can be produced
                                </Typography>
                                
                                <Autocomplete
                                    multiple
                                    fullWidth
                                    options={buildings}
                                    value={recipe.buildings}
                                    onChange={handleBuildingChange}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Buildings"
                                            placeholder="Choose required buildings..."
                                            required
                                            error={recipe.buildings.length === 0}
                                            helperText={recipe.buildings.length === 0 ? "At least one building is required" : `${recipe.buildings.length} building(s) selected`}
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                variant="outlined"
                                                label={option}
                                                {...getTagProps({ index })}
                                                key={index}
                                            />
                                        ))
                                    }
                                    freeSolo
                                />
                            </CardContent>
                        </Card>

                        {/* Actions Section - Own Card */}
                        <Card>
                            <CardContent sx={{ textAlign: 'left' }}>
                                <Typography variant="h6" gutterBottom>
                                    Generate Recipe
                                </Typography>
                                
                                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2, justifyContent: 'flex-start' }}>
                                    <Button 
                                        variant="contained" 
                                        onClick={generateRecipeFile}
                                        startIcon={<PreviewIcon />}
                                        disabled={
                                            !recipe.products.some(p => p.name.trim()) || 
                                            recipe.buildings.length === 0 ||
                                            (recipe.cost.labour.hours === 0 && recipe.cost.labour.minutes === 0) ||
                                            recipe.cost.gold === 0
                                        }
                                    >
                                        Generate Preview
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        onClick={resetForm}
                                    >
                                        Reset Form
                                    </Button>
                                    {fileName && (
                                        <Chip 
                                            label={`File: ${fileName}.json`} 
                                            color="primary" 
                                            variant="outlined" 
                                        />
                                    )}
                                </Stack>
                                
                                {(!recipe.products.some(p => p.name.trim()) || 
                                  recipe.buildings.length === 0 ||
                                  (recipe.cost.labour.hours === 0 && recipe.cost.labour.minutes === 0) ||
                                  recipe.cost.gold === 0) && (
                                    <Alert severity="warning">
                                        <Typography variant="body2" gutterBottom>
                                            Please complete the following required fields:
                                        </Typography>
                                        <Stack spacing={0.5} sx={{ ml: 2 }}>
                                            {!recipe.products.some(p => p.name.trim()) && (
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ marginRight: '8px' }}>•</span>
                                                    At least one product with a name
                                                </Typography>
                                            )}
                                            {recipe.buildings.length === 0 && (
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ marginRight: '8px' }}>•</span>
                                                    At least one building
                                                </Typography>
                                            )}
                                            {(recipe.cost.labour.hours === 0 && recipe.cost.labour.minutes === 0) && (
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ marginRight: '8px' }}>•</span>
                                                    Labour time (hours or minutes)
                                                </Typography>
                                            )}
                                            {recipe.cost.gold === 0 && (
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ marginRight: '8px' }}>•</span>
                                                    Gold cost greater than 0
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Stack>

            {/* Preview Section - Full Width Below Form */}
            {previewMode && (
                <Card sx={{ mt: 3 }}>
                    <CardContent sx={{ textAlign: 'left' }}>
                        <Typography variant="h6" gutterBottom>
                            Generated Recipe File
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {fileName}.json
                        </Typography>
                        
                        <Paper 
                            sx={{ 
                                p: 0, 
                                bgcolor: 'grey.900', 
                                border: '1px solid',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                maxHeight: 400,
                                overflow: 'auto'
                            }}
                        >
                            <Box sx={{ p: 2 }}>
                                <Typography 
                                    variant="body2" 
                                    component="pre" 
                                    sx={{ 
                                        color: 'grey.100', 
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        lineHeight: 1.5,
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        textAlign: 'left'
                                    }}
                                >
                                    {generatedContent}
                                </Typography>
                            </Box>
                        </Paper>

                        <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'flex-start' }}>
                            <Button 
                                variant="contained" 
                                onClick={downloadFile}
                                startIcon={<DownloadIcon />}
                                fullWidth
                            >
                                Download JSON File
                            </Button>
                        </Stack>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            💡 Download the file and open a Pull Request to the <a href="https://github.com/charlotteturner21/potbs-econ-calculator" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>GitHub repository</a> to contribute new recipes to the project.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default RecipeGenerator; 