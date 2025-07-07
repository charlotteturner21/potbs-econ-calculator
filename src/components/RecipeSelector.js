import React, { useMemo } from 'react';
import {
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    Chip,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Autocomplete,
    TextField,
    Stack,
    Tabs,
    Tab
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Build as BuildIcon,
    ShoppingCart as ShoppingCartIcon,
    Schedule as ScheduleIcon,
    AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import recipes from "../data/recipes";

function RecipeSelector({ selectorState, setSelectorState }) {
    // Extract state values from props
    const { selectedRecipe, tabValue } = selectorState;
    
    const handleRecipeChange = (event, newValue) => {
        setSelectorState(prev => ({
            ...prev,
            selectedRecipe: newValue || ''
        }));
    };

    const handleTabChange = (event, newValue) => {
        setSelectorState(prev => ({
            ...prev,
            tabValue: newValue
        }));
    };

    // Helper function to get products array from recipe data (handles both old and new format)
    const getRecipeProducts = (recipeData) => {
        // Safety check: return empty array if recipeData is undefined/null
        if (!recipeData) {
            return [];
        }
        
        // New format: products array
        if (recipeData.products && Array.isArray(recipeData.products)) {
            return recipeData.products;
        }
        // Old format: single product object
        if (recipeData.product) {
            return [recipeData.product];
        }
        return [];
    };

    // Function to find recipes that produce a given ingredient
    const findRecipesByProduct = (productName) => {
        return Object.entries(recipes).filter(([recipeName, recipeData]) => {
            const products = getRecipeProducts(recipeData);
            return products.some(product => product?.name === productName);
        });
    };

    // Function to calculate the complete dependency tree
    const calculateDependencyTree = useMemo(() => {
        if (!selectedRecipe) return null;

        const tree = {};
        const visited = new Set();
        const processing = new Set();

        const buildTree = (recipeName, multiplier = 1, depth = 0) => {
            // Prevent infinite recursion
            if (processing.has(recipeName)) {
                return { circular: true };
            }
            
            if (visited.has(recipeName)) {
                return tree[recipeName] || { circular: true };
            }

            processing.add(recipeName);
            
            const recipeData = recipes[recipeName];
            if (!recipeData) {
                console.warn(`Recipe not found: ${recipeName}`);
                processing.delete(recipeName);
                return null;
            }

            const products = getRecipeProducts(recipeData);
            const node = {
                name: recipeName,
                products: products, // Updated to handle multiple products
                ingredients: recipeData.ingredients,
                buildings: recipeData.buildings,
                cost: recipeData.cost,
                multiplier: multiplier,
                depth: depth,
                dependencies: {},
                missingRecipes: []
            };

            // Calculate total quantities needed
            node.totalQuantity = multiplier;
            node.totalCost = {
                labour: {
                    hours: recipeData.cost.labour.hours * multiplier,
                    minutes: recipeData.cost.labour.minutes * multiplier
                },
                gold: recipeData.cost.gold * multiplier
            };

            // Process each ingredient
            recipeData.ingredients.forEach(ingredient => {
                const producingRecipes = findRecipesByProduct(ingredient.name);
                
                if (producingRecipes.length > 0) {
                    // Use the first recipe that produces this ingredient
                    const [subRecipeName, subRecipeData] = producingRecipes[0];
                    const quantityNeeded = ingredient.quantity * multiplier;
                    
                    // Find the specific product that matches our ingredient
                    const subProducts = getRecipeProducts(subRecipeData);
                    const matchingProduct = subProducts.find(p => p?.name === ingredient.name);
                    const productQuantity = matchingProduct?.quantity || 1;
                    
                    const subMultiplier = Math.ceil(quantityNeeded / productQuantity);
                    
                    const subTree = buildTree(subRecipeName, subMultiplier, depth + 1);
                    if (subTree) {
                        node.dependencies[ingredient.name] = {
                            recipe: subTree,
                            quantityNeeded: quantityNeeded,
                            multiplier: subMultiplier
                        };
                    }
                } else {
                    // No recipe found for this ingredient
                    node.missingRecipes.push({
                        name: ingredient.name,
                        quantity: ingredient.quantity * multiplier
                    });
                }
            });

            tree[recipeName] = node;
            visited.add(recipeName);
            processing.delete(recipeName);
            
            return node;
        };

        const result = buildTree(selectedRecipe);
        return result;
    }, [selectedRecipe]);

    // Function to flatten the dependency tree into execution order
    const getExecutionOrder = useMemo(() => {
        if (!calculateDependencyTree) return [];

        const ordered = [];
        const visited = new Set();

        const traverse = (node) => {
            if (!node || visited.has(node.name) || node.circular) return;

            // First, process all dependencies
            Object.values(node.dependencies).forEach(dep => {
                if (dep.recipe) {
                    traverse(dep.recipe);
                }
            });

            // Then add this node
            if (!visited.has(node.name)) {
                ordered.push(node);
                visited.add(node.name);
            }
        };

        traverse(calculateDependencyTree);
        return ordered;
    }, [calculateDependencyTree]);

    // Function to calculate total material requirements
    const getTotalMaterials = useMemo(() => {
        if (!calculateDependencyTree) return { withRecipes: {}, withoutRecipes: {} };

        const withRecipes = {};
        const withoutRecipes = {};
        const visited = new Set();

        const collectMaterials = (node) => {
            if (!node || visited.has(node.name) || node.circular) return;
            visited.add(node.name);

            // If this recipe has no dependencies, it's a base material
            if (Object.keys(node.dependencies).length === 0) {
                // Handle multiple products
                node.products.forEach(product => {
                    const productName = product?.name;
                    const quantity = product?.quantity * node.multiplier;
                    if (productName) {
                        withRecipes[productName] = (withRecipes[productName] || 0) + quantity;
                    }
                });
            } else {
                // Process dependencies
                Object.values(node.dependencies).forEach(dep => {
                    if (dep.recipe) {
                        collectMaterials(dep.recipe);
                    }
                });
            }

            // Add missing recipes to withoutRecipes
            node.missingRecipes.forEach(missing => {
                withoutRecipes[missing.name] = (withoutRecipes[missing.name] || 0) + missing.quantity;
            });
        };

        collectMaterials(calculateDependencyTree);
        return { withRecipes, withoutRecipes };
    }, [calculateDependencyTree]);

    // Function to calculate building requirements with grouping
    const getBuildingGroups = useMemo(() => {
        if (!calculateDependencyTree) return {};

        const buildingGroups = {};
        const visited = new Set();

        const processRecipeForBuildings = (node, visited = new Set()) => {
            if (!node || visited.has(node.name) || node.circular) return;
            visited.add(node.name);

            // Process this node's buildings
            if (node.buildings && node.buildings.length > 0) {
                node.buildings.forEach(building => {
                    if (!buildingGroups[building]) {
                        buildingGroups[building] = {
                            recipes: [],
                            totalTime: { hours: 0, minutes: 0 },
                            totalGold: 0,
                            totalRecipes: 0
                        };
                    }

                    buildingGroups[building].recipes.push({
                        name: node.name,
                        products: node.products,
                        multiplier: node.multiplier,
                        cost: node.cost
                    });

                    buildingGroups[building].totalTime.hours += node.cost.labour.hours * node.multiplier;
                    buildingGroups[building].totalTime.minutes += node.cost.labour.minutes * node.multiplier;
                    buildingGroups[building].totalGold += node.cost.gold * node.multiplier;
                    buildingGroups[building].totalRecipes += 1;
                });
            }

            // Process dependencies
            Object.values(node.dependencies).forEach(dep => {
                if (dep.recipe) {
                    processRecipeForBuildings(dep.recipe, visited);
                }
            });
        };

        processRecipeForBuildings(calculateDependencyTree, visited);

        // Convert excess minutes to hours
        Object.values(buildingGroups).forEach(group => {
            if (group.totalTime.minutes >= 60) {
                group.totalTime.hours += Math.floor(group.totalTime.minutes / 60);
                group.totalTime.minutes = group.totalTime.minutes % 60;
            }
        });

        return buildingGroups;
    }, [calculateDependencyTree]);

    // Calculate building efficiency stats
    const getBuildingEfficiency = useMemo(() => {
        const groups = getBuildingGroups;
        const buildingStats = {};

        Object.entries(groups).forEach(([building, group]) => {
            const totalTimeInMinutes = group.totalTime.hours * 60 + group.totalTime.minutes;
            buildingStats[building] = {
                ...group,
                totalTimeInMinutes,
                goldPerHour: totalTimeInMinutes > 0 ? (group.totalGold / (totalTimeInMinutes / 60)).toFixed(0) : 0,
                recipesPerHour: totalTimeInMinutes > 0 ? (group.totalRecipes / (totalTimeInMinutes / 60)).toFixed(1) : 0
            };
        });

        return buildingStats;
    }, [getBuildingGroups]);

    const selectedRecipeData = selectedRecipe ? recipes[selectedRecipe] : null;

    // Calculate total production cost
    const getTotalProductionCost = useMemo(() => {
        if (!getExecutionOrder || getExecutionOrder.length === 0) {
            // For base recipes (no dependencies), just return the selected recipe's cost
            if (selectedRecipeData) {
                return {
                    totalGold: selectedRecipeData.cost.gold,
                    totalTimeHours: selectedRecipeData.cost.labour.hours,
                    totalTimeMinutes: selectedRecipeData.cost.labour.minutes,
                    stepCount: 1
                };
            }
            return { totalGold: 0, totalTimeHours: 0, totalTimeMinutes: 0, stepCount: 0 };
        }

        const totalGold = getExecutionOrder.reduce((sum, step) => sum + step.totalCost.gold, 0);
        const totalMinutes = getExecutionOrder.reduce((sum, step) => {
            return sum + (step.totalCost.labour.hours * 60) + step.totalCost.labour.minutes;
        }, 0);
        
        return {
            totalGold,
            totalTimeHours: Math.floor(totalMinutes / 60),
            totalTimeMinutes: totalMinutes % 60,
            stepCount: getExecutionOrder.length
        };
    }, [getExecutionOrder, selectedRecipeData]);

    const TabPanel = ({ children, value, index }) => (
        <div hidden={value !== index}>
            {value === index && children}
        </div>
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    Recipe Calculator
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Calculate complete dependency chains for any recipe
                </Typography>
            </Box>

            {/* Recipe Search */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Autocomplete
                        options={Object.keys(recipes).sort((a, b) => {
                            const recipeDataA = recipes[a];
                            const recipeDataB = recipes[b];
                            const productsA = getRecipeProducts(recipeDataA);
                            const productsB = getRecipeProducts(recipeDataB);
                            const nameA = productsA.length > 0 ? productsA[0]?.name || a : a;
                            const nameB = productsB.length > 0 ? productsB[0]?.name || b : b;
                            return nameA.localeCompare(nameB);
                        })}
                        value={selectedRecipe}
                        onChange={handleRecipeChange}
                        getOptionLabel={(option) => {
                            const recipeData = recipes[option];
                            if (!recipeData) return option;
                            const products = getRecipeProducts(recipeData);
                            const label = products.length > 0 ? products.map(p => p.name).join(' + ') : option;
                            return label.length > 50 ? label.substring(0, 50) + '...' : label;
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search for a recipe..."
                                placeholder="Type product name (e.g., Granite, Cannon, Sails)"
                                variant="outlined"
                                size="large"
                                fullWidth
                            />
                        )}
                        renderOption={(props, option) => {
                            const recipeData = recipes[option];
                            if (!recipeData) return <li {...props}>{option}</li>;
                            const products = getRecipeProducts(recipeData);
                            
                            return (
                                <li {...props}>
                                    <Box sx={{ py: 1 }}>
                                        <Typography variant="body1" fontWeight="medium">
                                            {products.length > 0 ? products.map(p => p.name).join(' + ') : option}
                                        </Typography>
                                        {products.length > 0 && (
                                            <Typography variant="caption" color="text.secondary">
                                                {products.map(p => `${p.quantity}x ${p.name}`).join(', ')}
                                            </Typography>
                                        )}
                                    </Box>
                                </li>
                            );
                        }}
                        filterOptions={(options, { inputValue }) => {
                            const searchTerm = inputValue.toLowerCase();
                            return options.filter(option => {
                                const recipeData = recipes[option];
                                if (!recipeData) return option.toLowerCase().includes(searchTerm);
                                const products = getRecipeProducts(recipeData);
                                
                                return option.toLowerCase().includes(searchTerm) ||
                                      products.some(product => 
                                          product?.name?.toLowerCase().includes(searchTerm)
                                      );
                            });
                        }}
                        noOptionsText="No recipes found"
                        clearOnEscape
                        size="medium"
                    />
                </CardContent>
            </Card>

            {/* Results */}
            {selectedRecipeData ? (
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Recipe Details - Left Side */}
                    <Box sx={{ 
                        width: { xs: '100%', sm: '400px' }, 
                        flexShrink: 0,
                        minWidth: 0,
                        overflow: 'hidden'
                    }}>
                        <Stack spacing={2}>
                            {/* Recipe Overview */}
                            <Card>
                                <CardContent sx={{ textAlign: 'left' }}>
                                    <Typography 
                                        variant="h5" 
                                        gutterBottom
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '100%'
                                        }}
                                        title={getRecipeProducts(selectedRecipeData).map(p => p.name).join(' + ') || 'Unknown Product'}
                                    >
                                        {getRecipeProducts(selectedRecipeData).map(p => p.name).join(' + ') || 'Unknown Product'}
                                    </Typography>
                                    
                                    <Stack spacing={1} sx={{ mb: 2, alignItems: 'flex-start' }}>
                                        {/* Time and Cost - First Row */}
                                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ justifyContent: 'flex-start' }}>
                                            <Chip 
                                                icon={<ScheduleIcon />}
                                                label={`${selectedRecipeData.cost.labour.hours > 0 ? `${selectedRecipeData.cost.labour.hours}h ` : ''}${selectedRecipeData.cost.labour.minutes}m`} 
                                                color="primary" 
                                                variant="outlined"
                                            />
                                            <Chip 
                                                icon={<AttachMoneyIcon />}
                                                label={`${selectedRecipeData.cost.gold} gold`} 
                                                color="warning" 
                                                variant="outlined"
                                            />
                                        </Stack>
                                        
                                        {/* Products - Second Row (gets its own space) */}
                                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-start' }}>
                                            <Chip 
                                                label={`Produces: ${getRecipeProducts(selectedRecipeData).map(p => `${p.quantity}x ${p.name}`).join(', ')}`} 
                                                color="success" 
                                                variant="outlined"
                                                sx={{ 
                                                    maxWidth: '100%',
                                                    width: 'fit-content',
                                                    '& .MuiChip-label': {
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '200px',
                                                        whiteSpace: 'nowrap'
                                                    }
                                                }}
                                                title={`Produces: ${getRecipeProducts(selectedRecipeData).map(p => `${p.quantity}x ${p.name}`).join(', ')}`}
                                            />
                                        </Stack>
                                    </Stack>

                                    {/* Buildings */}
                                    <Typography variant="subtitle2" gutterBottom>
                                        <BuildIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 18 }} />
                                        Buildings Required
                                    </Typography>
                                    <Box sx={{ pl: 3, mb: 2 }}>
                                        {selectedRecipeData.buildings.map((building, index) => (
                                            <Typography 
                                                key={index} 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={building}
                                            >
                                                • {building}
                                            </Typography>
                                        ))}
                                    </Box>

                                    {/* Ingredients */}
                                    <Typography variant="subtitle2" gutterBottom>
                                        <ShoppingCartIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 18 }} />
                                        Ingredients Required
                                    </Typography>
                                    <Box sx={{ pl: 3 }}>
                                        {selectedRecipeData.ingredients.length > 0 ? (
                                            selectedRecipeData.ingredients.map((ingredient, index) => (
                                                <Typography 
                                                    key={index} 
                                                    variant="body2" 
                                                    color="text.secondary"
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    title={`${ingredient.quantity}x ${ingredient.name}`}
                                                >
                                                    • {ingredient.quantity}x {ingredient.name}
                                                </Typography>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                No ingredients required (base resource)
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            {(Object.keys(getTotalMaterials.withRecipes).length > 0 || Object.keys(getTotalMaterials.withoutRecipes).length > 0) && (
                                <Card>
                                    <CardContent sx={{ textAlign: 'left' }}>
                                        <Typography variant="h6" gutterBottom>
                                            Material Summary
                                        </Typography>
                                        
                                        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
                                            <Typography variant="body2" color="error.main" fontWeight="medium" sx={{ fontSize: '0.95rem' }}>
                                                💰 Total Production Cost: {getTotalProductionCost.totalGold} gold
                                            </Typography>
                                            <Typography variant="body2" color="info.main" fontWeight="medium">
                                                ⏱ Total Time: {getTotalProductionCost.totalTimeHours > 0 ? `${getTotalProductionCost.totalTimeHours}h ` : ''}{getTotalProductionCost.totalTimeMinutes}m
                                            </Typography>
                                            <Typography variant="body2" color="success.main" fontWeight="medium">
                                                ✓ Can craft: {Object.keys(getTotalMaterials.withRecipes).length} items
                                            </Typography>
                                            <Typography variant="body2" color="warning.main" fontWeight="medium">
                                                ⚠ Need to source: {Object.keys(getTotalMaterials.withoutRecipes).length} items
                                            </Typography>
                                            <Typography variant="body2" color="primary.main" fontWeight="medium">
                                                🏗 Buildings needed: {Object.keys(getBuildingGroups).length}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Missing Data Summary */}
                            {Object.keys(getTotalMaterials.withoutRecipes).length > 0 && (
                                <Card sx={{ borderLeft: 3, borderColor: 'warning.main' }}>
                                    <CardContent sx={{ textAlign: 'left' }}>
                                        <Typography variant="h6" gutterBottom color="warning.main">
                                            ⚠ Missing Recipe Data
                                        </Typography>
                                        
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            The following ingredients don't have recipes and may indicate missing data:
                                        </Typography>
                                        
                                        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
                                            {Object.entries(getTotalMaterials.withoutRecipes).map(([material, quantity]) => (
                                                <Typography key={material} variant="body2" color="warning.main" fontWeight="medium">
                                                    • {quantity}x {material}
                                                </Typography>
                                            ))}
                                        </Stack>
                                        
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                            These items likely need recipe data to be complete.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>
                    </Box>

                    {/* Detailed Analysis - Right Side */}
                    <Box sx={{ 
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden'
                    }}>
                        <Card>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs value={tabValue} onChange={handleTabChange}>
                                    <Tab label="Production Chain" />
                                    <Tab label="Materials" />
                                    <Tab label="Buildings" />
                                </Tabs>
                            </Box>

                            {/* Production Chain Tab */}
                            <TabPanel value={tabValue} index={0}>
                                <CardContent>
                                    <Stack spacing={2}>
                                        {/* Production Summary */}
                                        <Box sx={{ 
                                            p: 2, 
                                            bgcolor: 'background.default', 
                                            borderRadius: 1,
                                            border: 1,
                                            borderColor: 'divider'
                                        }}>
                                            <Typography variant="h6" gutterBottom color="primary.main">
                                                Production Summary
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                                                    <Typography variant="h6" color="error.main" fontWeight="bold">
                                                        {getTotalProductionCost.totalGold} gold
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">Total Time</Typography>
                                                    <Typography variant="h6" color="info.main" fontWeight="bold">
                                                        {getTotalProductionCost.totalTimeHours > 0 ? `${getTotalProductionCost.totalTimeHours}h ` : ''}{getTotalProductionCost.totalTimeMinutes}m
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">Total Steps</Typography>
                                                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                        {getTotalProductionCost.stepCount}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">Buildings</Typography>
                                                    <Typography variant="h6" color="secondary.main" fontWeight="bold">
                                                        {Object.keys(getBuildingGroups).length}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Typography variant="h6" gutterBottom>
                                            Execution Order
                                        </Typography>
                                        {getExecutionOrder.length > 0 ? (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Step</TableCell>
                                                        <TableCell>Product</TableCell>
                                                        <TableCell>Building</TableCell>
                                                        <TableCell>Time</TableCell>
                                                        <TableCell>Cost</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {getExecutionOrder.map((step, index) => (
                                                        <TableRow key={step.name}>
                                                            <TableCell>{index + 1}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {step.products.map(p => p.name).join(' + ') || step.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {step.products.map(p => `${p.quantity * step.multiplier}x ${p.name}`).join(', ')}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {step.buildings.join(', ')}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {step.totalCost.labour.hours > 0 ? `${step.totalCost.labour.hours}h ` : ''}{step.totalCost.labour.minutes}m
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {step.totalCost.gold}g
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                This is a base recipe with no dependencies.
                                            </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </TabPanel>

                            {/* Materials Tab */}
                            <TabPanel value={tabValue} index={1}>
                                <CardContent>
                                    <Stack spacing={3}>
                                        {Object.keys(getTotalMaterials.withRecipes).length > 0 && (
                                            <Box>
                                                <Typography variant="h6" gutterBottom color="success.main">
                                                    ✓ Craftable Materials
                                                </Typography>
                                                <List dense>
                                                    {Object.entries(getTotalMaterials.withRecipes).map(([material, quantity]) => (
                                                        <ListItem key={material} sx={{ py: 0.5 }}>
                                                            <ListItemText 
                                                                primary={material}
                                                                secondary={`Total needed: ${quantity}`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        )}

                                        {Object.keys(getTotalMaterials.withoutRecipes).length > 0 && (
                                            <Box>
                                                <Typography variant="h6" gutterBottom color="warning.main">
                                                    ⚠ Materials to Source
                                                </Typography>
                                                <List dense>
                                                    {Object.entries(getTotalMaterials.withoutRecipes).map(([material, quantity]) => (
                                                        <ListItem key={material} sx={{ py: 0.5 }}>
                                                            <ListItemText 
                                                                primary={material}
                                                                secondary={`Total needed: ${quantity} (harvest/buy/gather)`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                                <Alert severity="info" sx={{ mt: 2 }}>
                                                    These materials don't have recipes and must be harvested, mined, or purchased.
                                                </Alert>
                                            </Box>
                                        )}
                                    </Stack>
                                </CardContent>
                            </TabPanel>

                            {/* Buildings Tab */}
                            <TabPanel value={tabValue} index={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Building Requirements
                                    </Typography>
                                    {Object.keys(getBuildingGroups).length > 0 ? (
                                        <List>
                                            {Object.entries(getBuildingEfficiency).map(([building, stats]) => (
                                                <ListItem key={building} sx={{ py: 1 }}>
                                                    <ListItemText 
                                                        primary={building}
                                                        secondary={
                                                            <Box>
                                                                <Typography variant="caption" display="block">
                                                                    {stats.totalRecipes} recipes • {stats.totalTime.hours}h {stats.totalTime.minutes}m total
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Efficiency: {stats.goldPerHour} gold/hour
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                            No buildings required for this recipe.
                                        </Typography>
                                    )}
                                </CardContent>
                            </TabPanel>
                        </Card>
                    </Box>
                </Box>
            ) : (
                <Card>
                    <CardContent sx={{ textAlign: 'left', py: 6 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Select a recipe to get started
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Search for any product name in the box above to see its complete dependency chain
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default RecipeSelector;
