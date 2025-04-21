import React from 'react';
import { useColoringStore, Tool } from '../store/coloringStore';
import './ToolBar.css';

const ToolBar: React.FC = () => {
  const { currentTool, setTool } = useColoringStore();

  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: 'brush', icon: '🖌️', label: 'Brush' },
    { id: 'fill', icon: '🪣', label: 'Fill' },
  ];

  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className={`tool-item ${currentTool === tool.id ? 'selected' : ''}`}
          onClick={() => setTool(tool.id)}
        >
          <div className="tool-icon">{tool.icon}</div>
          <div className="tool-label">{tool.label}</div>
        </div>
      ))}
    </div>
  );
};

export default ToolBar;
