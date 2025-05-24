import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface CustomNodeData {
  label: string;
  description?: string;
  eventType?: string;
  timestamp?: Date;
}

const EventNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className={`relative bg-white rounded-lg border-2 p-4 shadow-lg min-w-[200px] ${
      selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="space-y-2">
        <div className="font-semibold text-gray-900 text-sm">
          {nodeData.label}
        </div>
        
        {nodeData.description && (
          <div className="text-xs text-gray-600 leading-relaxed">
            {nodeData.description}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 text-xs">
          {nodeData.eventType && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {nodeData.eventType}
            </span>
          )}
          
          {nodeData.timestamp && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {new Date(nodeData.timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const ProcessNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className={`relative bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 p-4 shadow-lg min-w-[180px] ${
      selected ? 'border-green-500 ring-2 ring-green-200' : 'border-green-300'
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="space-y-2">
        <div className="font-semibold text-green-900 text-sm">
          {nodeData.label}
        </div>
        
        {nodeData.description && (
          <div className="text-xs text-green-700 leading-relaxed">
            {nodeData.description}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

const MaterialNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className={`relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 p-4 shadow-lg min-w-[160px] ${
      selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-300'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="space-y-2">
        <div className="font-semibold text-purple-900 text-sm">
          {nodeData.label}
        </div>
        
        {nodeData.description && (
          <div className="text-xs text-purple-700 leading-relaxed">
            {nodeData.description}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export const nodeTypes = {
  event: EventNode,
  process: ProcessNode,
  material: MaterialNode,
};

export { EventNode, ProcessNode, MaterialNode };
