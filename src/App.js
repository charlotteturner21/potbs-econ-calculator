import logo from './logo.svg';
import './App.css';
import {Button, Select} from "@mui/material";
import RecipeSelector from "./components/RecipeSelector";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <Button variant="contained">TEST BUTTON</Button>
          <RecipeSelector />
      </header>
    </div>
  );
}

export default App;
