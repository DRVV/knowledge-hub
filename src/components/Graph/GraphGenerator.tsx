'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, Settings, Loader2, Info, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { Node, Edge, CSVData } from '@/types/graph';
import FeedbackDialog from './FeedbackDialog';

// Browser-compatible UUID generation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface GraphGeneratorProps {
  csvData: CSVData | null;
  onGraphGenerated: (nodes: Node[], edges: Edge[], metadata: Record<string, unknown>) => void;
  disabled?: boolean;
}

interface GenerationOptions {
  context: string;
  maxNodes: number;
  maxEdges: number;
}

interface GenerationResult {
  nodes: Node[];
  edges: Edge[];
  reasoning: string;
  metadata: Record<string, unknown>;
}

const GraphGenerator: React.FC<GraphGeneratorProps> = ({
  csvData,
  onGraphGenerated,
  disabled = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Session and trace management for Langfuse
  const sessionIdRef = useRef<string>(generateUUID());
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);
  
  const [options, setOptions] = useState<GenerationOptions>({
    context: '',
    maxNodes: 20,
    maxEdges: 30,
  });

  const handleGenerate = async () => {
    if (!csvData) {
      setError('No CSV data available for graph generation');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);
    setCurrentTraceId(null);

    try {
      const response = await fetch('/api/generate-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          context: options.context,
          maxNodes: options.maxNodes,
          maxEdges: options.maxEdges,
          sessionId: sessionIdRef.current,
          userId: 'demo-user', // In production, this would come from auth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate graph');
      }

      const result = await response.json();
      setGenerationResult(result);
      setCurrentTraceId(result.metadata?.sessionId || sessionIdRef.current);
      onGraphGenerated(result.nodes, result.edges, result.metadata);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Graph generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenFeedback = () => {
    setShowFeedback(true);
  };

  const handleFeedbackSubmitted = () => {
    console.log('Feedback submitted successfully');
    // Could show a success message here
  };

  const canGenerate = csvData && csvData.rows.length > 0 && !disabled && !isGenerating;

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${
            canGenerate
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } transition-all duration-200`}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {isGenerating ? 'Generating...' : 'Generate Graph with AI'}
          </span>
        </button>
        
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-1"
        >
          <Settings className="w-4 h-4" />
          <span>Options</span>
        </button>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Generation Options</span>
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Context (Optional)
              </label>
              <textarea
                value={options.context}
                onChange={(e) => setOptions(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Provide additional context about your data to help the AI generate more relevant relationships..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Nodes
                </label>
                <input
                  type="number"
                  value={options.maxNodes}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxNodes: parseInt(e.target.value) || 20 }))}
                  min="5"
                  max="50"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Edges
                </label>
                <input
                  type="number"
                  value={options.maxEdges}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxEdges: parseInt(e.target.value) || 30 }))}
                  min="5"
                  max="100"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="border border-red-200 rounded-lg p-3 bg-red-50 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Generation Failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {generationResult && (
        <div className="border border-green-200 rounded-lg p-3 bg-green-50 space-y-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Graph Generated Successfully</p>
              <div className="text-xs text-green-600 mt-1 space-y-1">
                <p>Generated {generationResult.nodes.length} nodes and {generationResult.edges.length} edges</p>
                <p>Processed {String(generationResult.metadata.processedRowCount || 0)} of {String(generationResult.metadata.sourceRowCount || 0)} rows</p>
                {typeof generationResult.metadata.processingTimeMs === 'number' && (
                  <p>Processing time: {Math.round(generationResult.metadata.processingTimeMs)}ms</p>
                )}
                {generationResult.metadata.tokenUsage && (
                  <p>Tokens used: {String((generationResult.metadata.tokenUsage as any)?.total_tokens || 0)}</p>
                )}
              </div>
            </div>
          </div>
          
          {generationResult.reasoning && (
            <div className="p-2 bg-white rounded border border-green-200">
              <div className="flex items-center space-x-1 mb-1">
                <Info className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">AI Analysis</span>
              </div>
              <p className="text-xs text-gray-600">{generationResult.reasoning}</p>
            </div>
          )}

          {/* Feedback Button */}
          <div className="flex justify-end pt-2 border-t border-green-200">
            <button
              onClick={handleOpenFeedback}
              className="flex items-center space-x-2 px-3 py-1 text-xs bg-white border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Rate this generation</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator during generation */}
      {isGenerating && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800">Analyzing your data...</p>
              <p className="text-xs text-blue-600 mt-1">
                AI is identifying entities and relationships in your CSV data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info about CSV data */}
      {csvData && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          <strong>Source Data:</strong> {csvData.rows.length} rows × {csvData.headers.length} columns
          <br />
          <strong>Headers:</strong> {csvData.headers.slice(0, 5).join(', ')}{csvData.headers.length > 5 ? '...' : ''}
        </div>
      )}

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        traceId={currentTraceId || undefined}
        sessionId={sessionIdRef.current}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
};

export default GraphGenerator;
