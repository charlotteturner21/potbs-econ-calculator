import React, { useState } from 'react';
import './App.css';
import {
  Typography,
  Tabs,
  Tab,
  Box,
  Container,
  Paper
} from "@mui/material";
import {
  Restaurant as RecipeIcon,
  Add as AddIcon,
  GitHub as GitHubIcon
} from "@mui/icons-material";
import RecipeSelector from "./components/RecipeSelector";
import RecipeGenerator from "./components/RecipeGenerator";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  // Persistent state for Recipe Generator
  const [generatorState, setGeneratorState] = useState({
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

  // Persistent state for Recipe Selector
  const [selectorState, setSelectorState] = useState({
    selectedRecipe: '',
    tabValue: 0
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="App">
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Paper elevation={2}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="recipe tabs">
            <Tab 
              label="Recipe Selector" 
              icon={<RecipeIcon />} 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              label="Recipe Generator" 
              icon={<AddIcon />} 
              iconPosition="start" 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Paper>
        
        <TabPanel value={tabValue} index={0}>
          <RecipeSelector 
            selectorState={selectorState}
            setSelectorState={setSelectorState}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <RecipeGenerator 
            generatorState={generatorState}
            setGeneratorState={setGeneratorState}
          />
        </TabPanel>
      </Container>
      
      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          mt: 4, 
          py: 2, 
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <GitHubIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          View source code on{' '}
          <a 
            href="https://github.com/charlotteturner21/potbs-econ-calculator" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'inherit', 
              textDecoration: 'none' 
            }}
          >
            GitHub
          </a>
        </Typography>
      </Box>
    </div>
  );
}

export default App;
