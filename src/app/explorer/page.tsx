'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import { Search, Filter, MessageSquare, History, Settings, Plus, Download } from 'lucide-react';
import GraphCanvas, { GraphCanvasRef } from '@/components/Graph/GraphCanvas';
import { Graph } from '@/types/graph';

function ExplorerContent() {
  const searchParams = useSearchParams();
  const graphId = searchParams.get('graph');
  const graphCanvasRef = useRef<GraphCanvasRef>(null);
  
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'search' | 'properties' | 'comments' | 'versions'>('search');
  const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<FlowEdge[]>([]);

  // Sample data for demonstration
  const sampleGraph: Graph = {
    _id: 'sample',
    title: 'Semiconductor Process Knowledge Graph',
    description: 'A comprehensive knowledge graph showcasing semiconductor manufacturing processes and their relationships',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo-user',
    metadata: {
      provider: 'Sample Data',
      originalFilename: 'demo.json',
    },
    nodes: [
      {
        id: '1',
        type: 'event',
        position: { x: 100, y: 100 },
        data: {
          label: 'Silicon Wafer Preparation',
          description: 'Initial preparation of silicon wafers for semiconductor manufacturing',
          eventType: 'Manufacturing Process',
          timestamp: new Date('2024-01-15'),
        },
      },
      {
        id: '2',
        type: 'process',
        position: { x: 350, y: 100 },
        data: {
          label: 'Photolithography',
          description: 'Pattern transfer process using light-sensitive materials',
        },
      },
      {
        id: '3',
        type: 'material',
        position: { x: 600, y: 100 },
        data: {
          label: 'Photoresist',
          description: 'Light-sensitive polymer used in photolithography',
        },
      },
      {
        id: '4',
        type: 'event',
        position: { x: 100, y: 300 },
        data: {
          label: 'Etching Process',
          description: 'Removal of material to create patterns',
          eventType: 'Chemical Process',
          timestamp: new Date('2024-01-16'),
        },
      },
      {
        id: '5',
        type: 'process',
        position: { x: 350, y: 300 },
        data: {
          label: 'Ion Implantation',
          description: 'Introduction of dopant atoms into semiconductor substrate',
        },
      },
      {
        id: '6',
        type: 'material',
        position: { x: 600, y: 300 },
        data: {
          label: 'Dopant Materials',
          description: 'Boron, Phosphorus, or Arsenic used for doping',
        },
      },
    ],
    edges: [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        type: 'causal',
        data: {
          label: 'enables',
          relationshipType: 'process_flow',
          strength: 85,
        },
      },
      {
        id: 'e2-3',
        source: '2',
        target: '3',
        type: 'causal',
        data: {
          label: 'requires',
          relationshipType: 'material_dependency',
          strength: 95,
        },
      },
      {
        id: 'e1-4',
        source: '1',
        target: '4',
        type: 'causal',
        data: {
          label: 'followed by',
          relationshipType: 'sequence',
          strength: 70,
        },
      },
      {
        id: 'e4-5',
        source: '4',
        target: '5',
        type: 'process',
        data: {
          label: 'precedes',
          relationshipType: 'process_sequence',
        },
      },
      {
        id: 'e5-6',
        source: '5',
        target: '6',
        type: 'causal',
        data: {
          label: 'uses',
          relationshipType: 'material_usage',
          strength: 90,
        },
      },
    ],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
  };

  const fetchGraph = async () => {
    if (!graphId || graphId === 'sample') {
      setGraph(sampleGraph);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/graphs/${graphId}`);
      if (response.ok) {
        const data = await response.json();
        setGraph(data);
      } else {
        // Fallback to sample data if graph not found
        setGraph(sampleGraph);
      }
    } catch (error) {
      console.error('Error fetching graph:', error);
      setGraph(sampleGraph);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [graphId]);

  const handleNodesChange = (nodes: FlowNode[]) => {
    // Handle node changes
    console.log('Nodes changed:', nodes);
  };

  const handleEdgesChange = (edges: FlowEdge[]) => {
    // Handle edge changes
    console.log('Edges changed:', edges);
  };

  const handleSelectionChange = (nodes: FlowNode[], edges: FlowEdge[]) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleExportToPNG = async () => {
    if (graphCanvasRef.current) {
      const filename = `${graph?.title?.replace(/\s+/g, '-').toLowerCase() || 'knowledge-graph'}.png`;
      await graphCanvasRef.current.exportToPNG(filename);
    }
  };

  const handleExportToJPEG = async () => {
    if (graphCanvasRef.current) {
      const filename = `${graph?.title?.replace(/\s+/g, '-').toLowerCase() || 'knowledge-graph'}.jpg`;
      await graphCanvasRef.current.exportToJPEG(filename);
    }
  };

  const handleExportToSVG = async () => {
    if (graphCanvasRef.current) {
      const filename = `${graph?.title?.replace(/\s+/g, '-').toLowerCase() || 'knowledge-graph'}.svg`;
      await graphCanvasRef.current.exportToSVG(filename);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-sm border-r flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {graph?.title || 'Knowledge Graph Explorer'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {graph?.description || 'Explore the knowledge graph'}
          </p>
        </div>

        {/* Sidebar Tabs */}
        <div className="border-b">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              onClick={() => setSidebarTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                sidebarTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button
              onClick={() => setSidebarTab('properties')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                sidebarTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Properties
            </button>
            <button
              onClick={() => setSidebarTab('comments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                sidebarTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Comments
            </button>
          </nav>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === 'search' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Nodes
                </label>
                <div className="space-y-2">
                  <div
                    className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'event')}
                  >
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Event Node</span>
                  </div>
                  <div
                    className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'process')}
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Process Node</span>
                  </div>
                  <div
                    className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-move"
                    draggable
                    onDragStart={(e) => onDragStart(e, 'material')}
                  >
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Material Node</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Filters
                </label>
                <input
                  type="text"
                  placeholder="Search nodes and edges..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {sidebarTab === 'properties' && (
            <div className="space-y-4">
              {selectedNodes.length > 0 || selectedEdges.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Selection Properties
                  </h3>
                  {selectedNodes.map((node) => (
                    <div key={node.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {(node.data as any)?.label || node.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Type: {node.type}
                      </div>
                      <div className="text-xs text-gray-500">
                        Position: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                      </div>
                    </div>
                  ))}
                  {selectedEdges.map((edge) => (
                    <div key={edge.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {(edge.data as any)?.label || edge.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {edge.source} → {edge.target}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No selection</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select nodes or edges to view their properties.
                  </p>
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'comments' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No comments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comments will appear here when added to the graph.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Main Content Header */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">Graph Visualization</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span>{graph?.nodes.length || 0} nodes</span>
              <span className="mx-2">•</span>
              <span>{graph?.edges.length || 0} edges</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleExportToPNG}
                className="px-3 py-2 text-sm border border-gray-300 rounded-l-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>PNG</span>
              </button>
              <button 
                onClick={handleExportToJPEG}
                className="px-3 py-2 text-sm border-t border-b border-gray-300 hover:bg-gray-50 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>JPEG</span>
              </button>
              <button 
                onClick={handleExportToSVG}
                className="px-3 py-2 text-sm border border-gray-300 rounded-r-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>SVG</span>
              </button>
            </div>
            <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1">
          {graph && (
            <GraphCanvas
              ref={graphCanvasRef}
              graph={graph}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ExplorerContent />
    </Suspense>
  );
}
