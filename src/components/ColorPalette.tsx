import React from 'react';
import { useColoringStore } from '../store/coloringStore';
import './ColorPalette.css';

const COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3', // Violet
  '#FF1493', // Deep Pink
  '#00BFFF', // Deep Sky Blue
  '#32CD32', // Lime Green
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#8A2BE2', // Blue Violet
  '#00FFFF', // Cyan
  '#FF69B4', // Hot Pink
  '#CD853F', // Peru
  '#8B4513', // Saddle Brown
  '#2E8B57', // Sea Green
  '#A52A2A', // Brown
  '#000000', // Black
  '#FFFFFF', // White
  '#808080', // Gray
];

const ColorPalette: React.FC = () => {
  const { currentColor, setColor } = useColoringStore();

  return (
    <div className="color-palette">
      <div className="colors-container">
        {COLORS.map((color) => (
          <div 
            key={color}
            className={`color-item ${currentColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setColor(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;
