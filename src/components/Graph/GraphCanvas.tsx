'use client';

import React, { useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge as FlowEdge,
  Node as FlowNode,
  ReactFlowProvider,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toJpeg, toSvg } from 'html-to-image';

import { nodeTypes } from './CustomNode';
import { edgeTypes } from './CustomEdge';
import { Graph } from '@/types/graph';

interface GraphCanvasProps {
  graph?: Graph;
  onNodesChange?: (nodes: FlowNode[]) => void;
  onEdgesChange?: (edges: FlowEdge[]) => void;
  onSelectionChange?: (selectedNodes: FlowNode[], selectedEdges: FlowEdge[]) => void;
}

export interface GraphCanvasRef {
  exportToPNG: (filename?: string) => Promise<void>;
  exportToJPEG: (filename?: string) => Promise<void>;
  exportToSVG: (filename?: string) => Promise<void>;
}

const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({
  graph,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
}, ref) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Convert our custom types to ReactFlow types
  const initialNodes: FlowNode[] = graph?.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    selected: node.selected,
    dragging: node.dragging,
  })) || [];

  const initialEdges: FlowEdge[] = graph?.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    data: edge.data,
  })) || [];

  const [nodes, setNodes, onNodesStateChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesStateChange] = useEdgesState(initialEdges);

  // Export functionality
  const exportToPNG = useCallback(async (filename: string = 'knowledge-graph.png') => {
    if (!reactFlowWrapper.current) return;

    try {
      const dataUrl = await toPng(reactFlowWrapper.current, {
        cacheBust: true,
        pixelRatio: 2,
        width: reactFlowWrapper.current.scrollWidth,
        height: reactFlowWrapper.current.scrollHeight,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export graph as PNG:', error);
    }
  }, []);

  const exportToJPEG = useCallback(async (filename: string = 'knowledge-graph.jpg') => {
    if (!reactFlowWrapper.current) return;

    try {
      const dataUrl = await toJpeg(reactFlowWrapper.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
        width: reactFlowWrapper.current.scrollWidth,
        height: reactFlowWrapper.current.scrollHeight,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export graph as JPEG:', error);
    }
  }, []);

  const exportToSVG = useCallback(async (filename: string = 'knowledge-graph.svg') => {
    if (!reactFlowWrapper.current) return;

    try {
      const dataUrl = await toSvg(reactFlowWrapper.current, {
        cacheBust: true,
        width: reactFlowWrapper.current.scrollWidth,
        height: reactFlowWrapper.current.scrollHeight,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export graph as SVG:', error);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    exportToPNG,
    exportToJPEG,
    exportToSVG,
  }), [exportToPNG, exportToJPEG, exportToSVG]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: FlowEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'causal',
        data: { label: 'New Relationship' },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      onEdgesChange?.(edges.concat(newEdge));
    },
    [edges, onEdgesChange, setEdges]
  );

  const onInit = useCallback((rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
  }, []);

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesStateChange(changes);
      onNodesChange?.(nodes);
    },
    [nodes, onNodesChange, onNodesStateChange]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesStateChange(changes);
      onEdgesChange?.(edges);
    },
    [edges, onEdgesChange, onEdgesStateChange]
  );

  const onSelectionChangeHandler = useCallback(
    (params: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
      onSelectionChange?.(params.nodes, params.edges);
    },
    [onSelectionChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) return;

      const newNode: FlowNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: { 
          label: `New ${type} node`,
          description: 'Click to edit description',
          eventType: type === 'event' ? 'Default Event' : undefined,
          timestamp: new Date(),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      onNodesChange?.(nodes.concat(newNode));
    },
    [reactFlowInstance, nodes, onNodesChange, setNodes]
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onSelectionChange={onSelectionChangeHandler}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <MiniMap />
        <Background variant={'dots' as any} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
});

const GraphCanvasWrapper = forwardRef<GraphCanvasRef, GraphCanvasProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

GraphCanvasWrapper.displayName = 'GraphCanvasWrapper';

export default GraphCanvasWrapper;
