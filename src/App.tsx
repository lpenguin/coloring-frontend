import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Gallery from './pages/Gallery';
import ColoringPage from './pages/ColoringPage';

function App() {
  return (
    <Router basename="/coloring-frontend">
      <div className="app">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/coloring/:id" element={<ColoringPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
