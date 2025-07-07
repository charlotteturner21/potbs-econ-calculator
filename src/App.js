import React, { useState } from 'react';
import './App.css';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Container,
  Paper
} from "@mui/material";
import {
  Restaurant as RecipeIcon,
  Add as AddIcon
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pirates of the Burning Sea - Economy Calculator
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 2 }}>
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
          <RecipeSelector />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <RecipeGenerator />
        </TabPanel>
      </Container>
    </div>
  );
}

export default App;
