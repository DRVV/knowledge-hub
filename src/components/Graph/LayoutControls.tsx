'use client';

import React from 'react';
import { GraphCanvasRef } from './GraphCanvas';

interface LayoutControlsProps {
  graphCanvasRef: React.RefObject<GraphCanvasRef | null>;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({ graphCanvasRef }) => {
  const handleDagreLayout = (direction: 'TB' | 'BT' | 'LR' | 'RL') => {
    graphCanvasRef.current?.applyDagreLayout(direction);
  };

  const handleCircularLayout = () => {
    graphCanvasRef.current?.applyCircularLayout();
  };

  const handleGridLayout = () => {
    graphCanvasRef.current?.applyGridLayout();
  };

  const handleForceLayout = () => {
    graphCanvasRef.current?.applyForceLayout();
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Layout Controls</h3>
      
      <div className="space-y-3">
        {/* Dagre Layout Options */}
        <div>
          <p className="text-xs text-gray-600 mb-2 font-medium">Hierarchical (Dagre)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDagreLayout('TB')}
              className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
              title="Top to Bottom"
            >
              ↓ TB
            </button>
            <button
              onClick={() => handleDagreLayout('BT')}
              className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
              title="Bottom to Top"
            >
              ↑ BT
            </button>
            <button
              onClick={() => handleDagreLayout('LR')}
              className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
              title="Left to Right"
            >
              → LR
            </button>
            <button
              onClick={() => handleDagreLayout('RL')}
              className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
              title="Right to Left"
            >
              ← RL
            </button>
          </div>
        </div>

        {/* Other Layout Options */}
        <div>
          <p className="text-xs text-gray-600 mb-2 font-medium">Alternative Layouts</p>
          <div className="space-y-2">
            <button
              onClick={handleCircularLayout}
              className="w-full px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded transition-colors"
              title="Arrange nodes in a circular pattern"
            >
              ○ Circular
            </button>
            <button
              onClick={handleGridLayout}
              className="w-full px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded transition-colors"
              title="Arrange nodes in a grid pattern"
            >
              ⊞ Grid
            </button>
            <button
              onClick={handleForceLayout}
              className="w-full px-3 py-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded transition-colors"
              title="Force-directed layout based on node connections"
            >
              ⚡ Force
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Apply different layouts to improve graph readability
        </p>
      </div>
    </div>
  );
};

export default LayoutControls;
