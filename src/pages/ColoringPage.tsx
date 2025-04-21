import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useColoringStore } from '../store/coloringStore';
import ColorPalette from '../components/ColorPalette';
import ToolBar from '../components/ToolBar';
import './ColoringPage.css';

const ColoringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number, y: number } | null>(null);
  
  const { 
    currentColor, 
    currentTool, 
    fetchImageById, 
    currentImage, 
    saveDrawing, 
    isLoading, 
    error 
  } = useColoringStore();

  useEffect(() => {
    if (id) {
      fetchImageById(parseInt(id));
    }
  }, [id, fetchImageById]);

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

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
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
    
    // Convert to SVG coordinates
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    return { x, y };
  };

  const drawDot = (x: number, y: number) => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    
    circle.setAttribute('cx', x.toString());
    circle.setAttribute('cy', y.toString());
    circle.setAttribute('r', '2');
    circle.setAttribute('fill', currentColor);
    
    svg.appendChild(circle);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', currentColor);
    line.setAttribute('stroke-width', '4');
    line.setAttribute('stroke-linecap', 'round');
    
    svg.appendChild(line);
  };

  const handleFill = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return;
    
    const point = getCoordinates(e);
    // Get element under pointer
    const element = document.elementFromPoint(point.x, point.y) as SVGElement;
    
    if (element && element.tagName !== 'svg') {
      // Fill the element
      element.setAttribute('fill', currentColor);
    }
  };

  const handleClearAll = () => {
    if (!svgRef.current || !currentImage?.svgData) return;
    
    // Clear all drawing elements while preserving the base SVG
    const svgContainer = svgRef.current;
    
    // Keep the original SVG content and remove all added drawings
    svgContainer.innerHTML = currentImage.svgData;
    
    // Reset all fills to white
    const shapes = svgContainer.querySelectorAll('path, circle, rect, polygon, ellipse');
    shapes.forEach(shape => {
      shape.setAttribute('fill', 'white');
    });
  };

  const handleSave = () => {
    if (!svgRef.current) return;
    
    const svgData = svgRef.current.outerHTML;
    saveDrawing(svgData);
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
        
        <div className="svg-container">
          <div
            className="svg-wrapper"
            onMouseDown={handleStartDrawing}
            onMouseMove={handleMovement}
            onMouseUp={handleEndDrawing}
            onMouseLeave={handleEndDrawing}
            onTouchStart={handleStartDrawing}
            onTouchMove={handleMovement}
            onTouchEnd={handleEndDrawing}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 800 600"
              dangerouslySetInnerHTML={{ __html: currentImage.svgData || '' }}
            ></svg>
          </div>
        </div>
        
        <ColorPalette />
      </div>
    </div>
  );
};

export default ColoringPage;
