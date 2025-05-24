'use client';

import React from 'react';
import { GraphCanvasRef } from './GraphCanvas';

interface ExportButtonsProps {
  graphRef: React.RefObject<GraphCanvasRef>;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ graphRef }) => {
  const handleExportPNG = async () => {
    if (!graphRef.current) return;
    await graphRef.current.exportToPNG('knowledge-graph.png');
  };

  const handleExportJPEG = async () => {
    if (!graphRef.current) return;
    await graphRef.current.exportToJPEG('knowledge-graph.jpg');
  };

  const handleExportSVG = async () => {
    if (!graphRef.current) return;
    await graphRef.current.exportToSVG('knowledge-graph.svg');
  };

  return (
    <div className="flex gap-2 p-4">
      <button
        onClick={handleExportPNG}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Export as PNG
      </button>
      <button
        onClick={handleExportJPEG}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        Export as JPEG
      </button>
      <button
        onClick={handleExportSVG}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
      >
        Export as SVG
      </button>
    </div>
  );
};

export default ExportButtons;
