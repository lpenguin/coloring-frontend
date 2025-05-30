import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useColoringStore } from '../store/coloringStore';
import ColorPalette from '../components/ColorPalette';
import ToolBar from '../components/ToolBar';
import './ColoringPage.css';

interface PixelData {
  width: number;
  height: number;
  data: ImageData;
}

// Color comparison tolerance constant
const COLOR_TOLERANCE = 128;

const ColoringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number, y: number } | null>(null);
  const [pixelData, setPixelData] = useState<PixelData | null>(null);
  
  const { 
    currentColor, 
    currentTool, 
    fetchImageById, 
    currentImage, 
    saveDrawing, 
    isLoading, 
    error 
  } = useColoringStore();

  // Load the image
  useEffect(() => {
    if (id) {
      fetchImageById(parseInt(id));
    }
  }, [id, fetchImageById]);

  // Set up the canvas and load the image
  useEffect(() => {
    if (!currentImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a new image element
    const img = new Image();
    imageRef.current = img;
    
    // When the image loads, draw it on the canvas
    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Get the initial pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setPixelData({
        width: canvas.width,
        height: canvas.height,
        data: imageData
      });
    };
    
    // Set source and start loading
    img.src = currentImage.url;
    
  }, [currentImage]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate CSS scaling (actual displayed size vs. internal canvas size)
    const cssScaleX = rect.width / canvas.width;
    const cssScaleY = rect.height / canvas.height;
    
    // Convert mouse position from screen coordinates to canvas coordinates
    const canvasX = Math.round((clientX - rect.left) / cssScaleX);
    const canvasY = Math.round((clientY - rect.top) / cssScaleY);

    return { x: canvasX, y: canvasY };
  };

  const drawDot = (x: number, y: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = currentColor;
    ctx.fill();
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const handleFill = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !pixelData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const point = getCoordinates(e);
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    
    // Get current imageData
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Perform flood fill
    floodFill(imageData, x, y, hexToRgb(currentColor));
    
    // Put the modified imageData back
    ctx.putImageData(imageData, 0, 0);
  };

  // Convert hex color to RGB values
  const hexToRgb = (hex: string): [number, number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255]; // Full opacity
  };

  // Flood fill algorithm for canvas
  const floodFill = (imageData: ImageData, x: number, y: number, fillColor: [number, number, number, number]) => {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Make sure coordinates are inside the canvas
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }
    
    // Get the color at the starting position
    const startIdx = (y * width + x) * 4;
    const startColor: [number, number, number, number] = [
      data[startIdx],
      data[startIdx + 1],
      data[startIdx + 2],
      data[startIdx + 3]
    ];
    
    // If already the same color, no need to fill
    if (colorsEqualWithTolerance(startColor, fillColor, COLOR_TOLERANCE)) {
      return;
    }
    
    // Prevent filling black or near-black pixels to preserve outlines
    if (isBlackOrNearBlack(startColor)) {
      return;
    }
    
    // Use a typed array for better performance
    const visitedArray = new Uint8Array(width * height);
    
    // Create a queue for pixels to check (reuse arrays to avoid GC)
    const queue = new Int32Array(width * height * 4); // x,y pairs
    let queueStart = 0;
    let queueEnd = 2;
    
    // Add starting pixel
    queue[0] = x;
    queue[1] = y;
    
    while (queueStart < queueEnd) {
      const currX = queue[queueStart++];
      const currY = queue[queueStart++];
      
      // Calculate index in the visited array
      const visitedIdx = currY * width + currX;
      
      // Skip if already visited
      if (visitedArray[visitedIdx] === 1) continue;
      visitedArray[visitedIdx] = 1;
      
      const idx = visitedIdx * 4;
      const currentPixelColor: [number, number, number, number] = [
        data[idx],
        data[idx + 1],
        data[idx + 2],
        data[idx + 3]
      ];
      
      // Check if this pixel has a color similar to the start color
      if (!colorsEqualWithTolerance(currentPixelColor, startColor, COLOR_TOLERANCE)) {
        continue;
      }
      
      // Apply the color
      data[idx] = fillColor[0];
      data[idx + 1] = fillColor[1];
      data[idx + 2] = fillColor[2];
      data[idx + 3] = 255; // Keep full opacity
      
      // Add adjacent pixels - check only 4 cardinal directions for better performance
      // Note: For most coloring cases, 4-way fill looks better than 8-way fill
      if (currX > 0) {
        queue[queueEnd++] = currX - 1;
        queue[queueEnd++] = currY;
      }
      if (currX < width - 1) {
        queue[queueEnd++] = currX + 1;
        queue[queueEnd++] = currY;
      }
      if (currY > 0) {
        queue[queueEnd++] = currX;
        queue[queueEnd++] = currY - 1;
      }
      if (currY < height - 1) {
        queue[queueEnd++] = currX;
        queue[queueEnd++] = currY + 1;
      }
    }
  };

  // Helper function for comparing colors with tolerance
  const colorsEqualWithTolerance = (
    a: [number, number, number, number], 
    b: [number, number, number, number], 
    tolerance: number
  ): boolean => {
    return (
      Math.abs(a[0] - b[0]) < tolerance &&
      Math.abs(a[1] - b[1]) < tolerance &&
      Math.abs(a[2] - b[2]) < tolerance &&
      Math.abs(a[3] - b[3]) < tolerance
    );
  };

  // Helper function to check if a color is black or near-black
  const isBlackOrNearBlack = (color: [number, number, number, number]): boolean => {
    const [r, g, b] = color;
    const threshold = 10; // +/- 10 color units as specified
    return r <= threshold && g <= threshold && b <= threshold;
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    if (currentTool === 'fill') {
      handleFill(e);
      return;
    }
    
    setIsDragging(true);
    const point = getCoordinates(e);
    setLastPoint(point);
    drawDot(point.x, point.y);
  };

  const handleMovement = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging || currentTool !== 'brush') return;
    
    const point = getCoordinates(e);
    if (lastPoint) {
      drawLine(lastPoint.x, lastPoint.y, point.x, point.y);
    }
    setLastPoint(point);
  };

  const handleEndDrawing = () => {
    setIsDragging(false);
    setLastPoint(null);
  };

  const handleClearAll = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Redraw the original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    // Convert canvas to data URL as PNG
    const dataUrl = canvas.toDataURL('image/png');
    saveDrawing(dataUrl);
    alert('Drawing saved successfully!');
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) return <div className="loading">Loading coloring page...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!currentImage) return <div className="error">Image not found</div>;

  return (
    <div className="coloring-page">
      <div className="coloring-header">
        <button onClick={handleBack} className="back-button">Back to Gallery</button>
        <h2 className="image-title">{currentImage.name}</h2>
        <div className="action-buttons">
          <button onClick={handleClearAll}>Clear All</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
      
      <div className="coloring-workspace">
        <ToolBar />
        
        <div className="canvas-container">
          <div
            className="canvas-wrapper"
            onMouseDown={handleStartDrawing}
            onMouseMove={handleMovement}
            onMouseUp={handleEndDrawing}
            onMouseLeave={handleEndDrawing}
            onTouchStart={handleStartDrawing}
            onTouchMove={handleMovement}
            onTouchEnd={handleEndDrawing}
          >
            <canvas
              ref={canvasRef}
              style={{
                transformOrigin: 'top left'
              }}
            />
          </div>
        </div>
        
        <ColorPalette />
      </div>
    </div>
  );
};

export default ColoringPage;
