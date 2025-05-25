'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import { Search, Filter, MessageSquare, History, Settings, Plus, Download, Table, LayoutGrid, Maximize2, Minimize2 } from 'lucide-react';
import GraphCanvas, { GraphCanvasRef } from '@/components/Graph/GraphCanvas';
import DataTable from '@/components/Table/DataTable';
import { Graph, CSVData, TableViewState } from '@/types/graph';
import { parseCSV, generateSampleCSVData } from '@/utils/csvParser';

function ExplorerContent() {
  const searchParams = useSearchParams();
  const graphId = searchParams.get('graph');
  const graphCanvasRef = useRef<GraphCanvasRef>(null);
  
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'search' | 'properties' | 'comments' | 'versions'>('search');
  const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<FlowEdge[]>([]);
  
  // Table view state
  const [tableViewState, setTableViewState] = useState<TableViewState>({
    showTable: false,
    tablePosition: 'bottom',
    tableHeight: 350,
    tableWidth: 400,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  // CSV save handler
  const handleSaveCSV = async (data: CSVData) => {
    if (!graph?.metadata.csvPath) {
      throw new Error('No CSV path available');
    }

    try {
      const response = await fetch(`/api/csv?path=${encodeURIComponent(graph.metadata.csvPath)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save CSV');
      }

      // Update local state with saved data
      setCsvData(data);
      
      console.log('CSV saved successfully');
    } catch (error) {
      console.error('Failed to save CSV:', error);
      throw error;
    }
  };

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
      csvPath: 'sample-data.csv',
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

  // Table functionality
  const loadCSVData = async () => {
    if (!graph?.metadata.csvPath) {
      // Use sample data if no CSV path is available
      setCsvData(generateSampleCSVData());
      return;
    }

    setCsvLoading(true);
    try {
      const data = await parseCSV(graph.metadata.csvPath);
      setCsvData(data);
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      // Fallback to sample data
      setCsvData(generateSampleCSVData());
    } finally {
      setCsvLoading(false);
    }
  };

  const toggleTable = async () => {
    if (!tableViewState.showTable && !csvData && !csvLoading) {
      await loadCSVData();
    }
    setTableViewState(prev => ({
      ...prev,
      showTable: !prev.showTable
    }));
  };

  const handleTablePositionChange = (position: 'bottom' | 'right' | 'overlay') => {
    setTableViewState(prev => ({
      ...prev,
      tablePosition: position
    }));
  };

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent, direction: 'horizontal' | 'vertical') => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startHeight = tableViewState.tableHeight || 350;
    const startWidth = tableViewState.tableWidth || 400;

    const handleMouseMove = (e: MouseEvent) => {
      if (direction === 'vertical') {
        const deltaY = startY - e.clientY;
        const newHeight = Math.max(200, Math.min(600, startHeight + deltaY));
        setTableViewState(prev => ({
          ...prev,
          tableHeight: newHeight
        }));
      } else {
        const deltaX = startX - e.clientX;
        const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
        setTableViewState(prev => ({
          ...prev,
          tableWidth: newWidth
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
            {/* Table Toggle Button */}
            <button
              onClick={toggleTable}
              disabled={csvLoading}
              className={`px-3 py-2 text-sm border rounded-md flex items-center space-x-1 ${
                tableViewState.showTable
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              } ${csvLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {csvLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Table className="w-4 h-4" />
              )}
              <span>Table View</span>
            </button>
            
            {/* Table Position Controls */}
            {tableViewState.showTable && (
              <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
                <button
                  onClick={() => handleTablePositionChange('bottom')}
                  className={`px-2 py-1 text-xs rounded-l-md ${
                    tableViewState.tablePosition === 'bottom'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                  title="Bottom position"
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleTablePositionChange('right')}
                  className={`px-2 py-1 text-xs ${
                    tableViewState.tablePosition === 'right'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                  title="Right position"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleTablePositionChange('overlay')}
                  className={`px-2 py-1 text-xs rounded-r-md ${
                    tableViewState.tablePosition === 'overlay'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                  title="Overlay position"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
            )}

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

        {/* Graph Canvas and Table Layout */}
        <div className="flex-1 relative">
          {tableViewState.showTable && tableViewState.tablePosition === 'right' ? (
            // Side-by-side layout
            <div className="flex h-full">
              <div className="flex-1 min-w-0">
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
              {/* Vertical resize handle */}
              <div
                className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'horizontal')}
              />
              <div 
                className="border-l bg-white flex flex-col shrink-0 overflow-hidden"
                style={{ 
                  width: `${Math.min(tableViewState.tableWidth || 400, 500)}px`,
                  maxWidth: '40vw'
                }}
              >
                {csvData && (
                  <DataTable
                    data={csvData}
                    maxHeight="100vh"
                    showSearch={true}
                    showExport={true}
                    editable={true}
                    onSave={handleSaveCSV}
                    csvPath={graph?.metadata.csvPath}
                  />
                )}
              </div>
            </div>
          ) : tableViewState.showTable && tableViewState.tablePosition === 'bottom' ? (
            // Stacked layout
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0">
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
              {/* Horizontal resize handle */}
              <div
                className="h-1 bg-gray-300 hover:bg-blue-500 cursor-row-resize transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'vertical')}
              />
              <div 
                className="border-t bg-white flex flex-col overflow-hidden"
                style={{ height: `${tableViewState.tableHeight}px`, minHeight: '200px' }}
              >
                {csvData && (
                  <DataTable
                    data={csvData}
                    maxHeight={`${(tableViewState.tableHeight || 350) - 60}px`}
                    showSearch={true}
                    showExport={true}
                    editable={true}
                    onSave={handleSaveCSV}
                    csvPath={graph?.metadata.csvPath}
                  />
                )}
              </div>
            </div>
          ) : (
            // Full graph view or overlay
            <>
              <div className="h-full">
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
              
              {/* Overlay Table */}
              {tableViewState.showTable && tableViewState.tablePosition === 'overlay' && csvData && (
                <div className="absolute top-4 right-4 w-96 max-h-96 bg-white shadow-lg rounded-lg border z-10">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="text-sm font-medium text-gray-900">Source Data</h3>
                    <button
                      onClick={() => setTableViewState(prev => ({ ...prev, showTable: false }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <DataTable
                    data={csvData}
                    maxHeight="300px"
                    showSearch={false}
                    showExport={false}
                    className="border-0"
                    editable={true}
                    onSave={handleSaveCSV}
                    csvPath={graph?.metadata.csvPath}
                  />
                </div>
              )}
            </>
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
