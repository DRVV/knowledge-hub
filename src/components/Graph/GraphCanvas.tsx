'use client';

import React, { useCallback, useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
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
  Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toJpeg, toSvg } from 'html-to-image';

import { nodeTypes } from './CustomNode';
import { edgeTypes } from './CustomEdge';
import { Graph } from '@/types/graph';
import { 
  getLayoutedElements, 
  getCircularLayout, 
  getGridLayout, 
  getForceLayout 
} from '@/utils/layout';

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
  applyDagreLayout: (direction?: 'TB' | 'BT' | 'LR' | 'RL') => void;
  applyCircularLayout: () => void;
  applyGridLayout: () => void;
  applyForceLayout: () => void;
}

const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({
  graph,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
}, ref) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [currentViewport, setCurrentViewport] = useState<Viewport>(
    graph?.viewport || { x: 0, y: 0, zoom: 1 }
  );
  const [isInitialized, setIsInitialized] = useState(false);
  
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

  // Update nodes and edges when graph prop changes
  useEffect(() => {
    if (graph) {
      const newNodes: FlowNode[] = graph.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        selected: node.selected,
        dragging: node.dragging,
      }));

      const newEdges: FlowEdge[] = graph.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        data: edge.data,
      }));

      setNodes(newNodes);
      setEdges(newEdges);

      // Auto-fit view when graph is updated with new AI-generated content
      if (reactFlowInstance && graph.metadata?.aiGenerated) {
        // Small delay to ensure nodes are rendered before fitting view
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.1, duration: 500 });
        }, 100);
      }
    }
  }, [graph, setNodes, setEdges, reactFlowInstance]);

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

  // Layout functions
  const applyDagreLayout = useCallback((direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB') => {
    const currentNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'entity',
      position: node.position,
      data: {
        label: (typeof node.data?.label === 'string' ? node.data.label : `Node ${node.id}`),
        description: (typeof node.data?.description === 'string' ? node.data.description : undefined),
        eventType: (typeof node.data?.eventType === 'string' ? node.data.eventType : undefined),
        timestamp: (node.data?.timestamp instanceof Date ? node.data.timestamp : undefined),
      },
    }));
    
    const currentEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'causal',
      data: edge.data || {},
    }));

    const { nodes: layoutedNodes } = getLayoutedElements(currentNodes, currentEdges, {
      direction,
      nodeWidth: 172,
      nodeHeight: 80,
      rankSep: 150,
      nodeSep: 100,
    });

    setNodes(layoutedNodes as FlowNode[]);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.1, duration: 500 });
    }, 100);
  }, [nodes, edges, reactFlowInstance, setNodes]);

  const applyCircularLayout = useCallback(() => {
    const currentNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'entity',
      position: node.position,
      data: {
        label: (typeof node.data?.label === 'string' ? node.data.label : `Node ${node.id}`),
        description: (typeof node.data?.description === 'string' ? node.data.description : undefined),
        eventType: (typeof node.data?.eventType === 'string' ? node.data.eventType : undefined),
        timestamp: (node.data?.timestamp instanceof Date ? node.data.timestamp : undefined),
      },
    }));
    
    const currentEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'causal',
      data: edge.data || {},
    }));

    const { nodes: layoutedNodes } = getCircularLayout(currentNodes, currentEdges);
    setNodes(layoutedNodes as FlowNode[]);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.1, duration: 500 });
    }, 100);
  }, [nodes, edges, reactFlowInstance, setNodes]);

  const applyGridLayout = useCallback(() => {
    const currentNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'entity',
      position: node.position,
      data: {
        label: (typeof node.data?.label === 'string' ? node.data.label : `Node ${node.id}`),
        description: (typeof node.data?.description === 'string' ? node.data.description : undefined),
        eventType: (typeof node.data?.eventType === 'string' ? node.data.eventType : undefined),
        timestamp: (node.data?.timestamp instanceof Date ? node.data.timestamp : undefined),
      },
    }));
    
    const currentEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'causal',
      data: edge.data || {},
    }));

    const { nodes: layoutedNodes } = getGridLayout(currentNodes, currentEdges);
    setNodes(layoutedNodes as FlowNode[]);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.1, duration: 500 });
    }, 100);
  }, [nodes, edges, reactFlowInstance, setNodes]);

  const applyForceLayout = useCallback(() => {
    const currentNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'entity',
      position: node.position,
      data: {
        label: (typeof node.data?.label === 'string' ? node.data.label : `Node ${node.id}`),
        description: (typeof node.data?.description === 'string' ? node.data.description : undefined),
        eventType: (typeof node.data?.eventType === 'string' ? node.data.eventType : undefined),
        timestamp: (node.data?.timestamp instanceof Date ? node.data.timestamp : undefined),
      },
    }));
    
    const currentEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'causal',
      data: edge.data || {},
    }));

    const { nodes: layoutedNodes } = getForceLayout(currentNodes, currentEdges);
    setNodes(layoutedNodes as FlowNode[]);
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.1, duration: 500 });
    }, 100);
  }, [nodes, edges, reactFlowInstance, setNodes]);

  useImperativeHandle(ref, () => ({
    exportToPNG,
    exportToJPEG,
    exportToSVG,
    applyDagreLayout,
    applyCircularLayout,
    applyGridLayout,
    applyForceLayout,
  }), [exportToPNG, exportToJPEG, exportToSVG, applyDagreLayout, applyCircularLayout, applyGridLayout, applyForceLayout]);

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
    if (!isInitialized) {
      // Only fit view on initial load
      rfi.fitView();
      setIsInitialized(true);
    } else {
      // Restore viewport on subsequent renders
      rfi.setViewport(currentViewport);
    }
  }, [isInitialized, currentViewport]);

  // Handle viewport changes
  const onViewportChange = useCallback((viewport: Viewport) => {
    setCurrentViewport(viewport);
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
        onViewportChange={onViewportChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        attributionPosition="top-right"
        defaultViewport={currentViewport}
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
