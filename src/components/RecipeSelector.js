import {MenuItem, Select} from "@mui/material";
import recipes from "../models/Recipes"

function RecipeSelector() {
    return (
        <Select>
            {Object.keys(recipes).map((recipe) => (<MenuItem value={recipes[recipe].id}>{recipe}</MenuItem>))}
        </Select>
    );
}

export default RecipeSelector;
