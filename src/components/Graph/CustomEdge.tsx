import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

interface CustomEdgeData {
  label?: string;
  description?: string;
  relationshipType?: string;
  strength?: number;
}

const CausalEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const edgeData = data as unknown as CustomEdgeData;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strengthColor = edgeData?.strength 
    ? `hsl(${Math.round((edgeData.strength / 100) * 120)}, 70%, 50%)`
    : '#64748b';

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: strengthColor,
          strokeWidth: edgeData?.strength ? Math.max(1, (edgeData.strength / 100) * 4) : 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded border shadow-sm text-xs font-medium"
          >
            {edgeData.label}
            {edgeData.relationshipType && (
              <div className="text-gray-500 text-xs">
                {edgeData.relationshipType}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const ProcessEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const edgeData = data as unknown as CustomEdgeData;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#10b981',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-green-50 px-2 py-1 rounded border border-green-200 shadow-sm text-xs font-medium text-green-800"
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export const edgeTypes = {
  causal: CausalEdge,
  process: ProcessEdge,
};

export { CausalEdge, ProcessEdge };
