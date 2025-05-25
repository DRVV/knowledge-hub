import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Node, Edge } from '@/types/graph';
import { getLayoutedElements } from '@/utils/layout';

// OpenAI client configuration (supports both OpenAI and Azure OpenAI)
function createOpenAIClient() {
  const useAzure = process.env.USE_AZURE_OPENAI === 'true';
  
  if (useAzure) {
    // Azure OpenAI configuration
    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
      },
    });
  } else {
    // Regular OpenAI configuration
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}

interface GenerateGraphRequest {
  csvData: {
    headers: string[];
    rows: string[][];
  };
  context?: string;
  maxNodes?: number;
  maxEdges?: number;
}

interface LLMGraphResponse {
  nodes: {
    id: string;
    type: 'event' | 'process' | 'material' | 'entity' | 'concept';
    label: string;
    description: string;
    properties?: Record<string, unknown>;
  }[];
  edges: {
    source: string;
    target: string;
    type: 'causal' | 'process' | 'temporal' | 'dependency' | 'association';
    label: string;
    description?: string;
    strength?: number;
    relationshipType?: string;
  }[];
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateGraphRequest = await request.json();
    const { csvData, context = '', maxNodes = 20, maxEdges = 30 } = body;

    if (!csvData || !csvData.headers || !csvData.rows) {
      return NextResponse.json(
        { error: 'Invalid CSV data provided' },
        { status: 400 }
      );
    }

    // Check for API key configuration
    const useAzure = process.env.USE_AZURE_OPENAI === 'true';
    const hasApiKey = useAzure 
      ? process.env.AZURE_OPENAI_API_KEY 
      : process.env.OPENAI_API_KEY;

    if (!hasApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = createOpenAIClient();

    // Prepare CSV data for the prompt (limit to first 50 rows for token efficiency)
    const limitedRows = csvData.rows.slice(0, 50);
    const csvText = [csvData.headers.join(','), ...limitedRows.map(row => row.join(','))].join('\n');

    const systemPrompt = `You are an expert knowledge graph generator. Your task is to analyze CSV data and create meaningful nodes and edges that represent the relationships and entities in the data.

Guidelines:
1. Create nodes for important entities, concepts, processes, events, or materials mentioned in the data
2. Each node should have: id, type (event/process/material/entity/concept), label, description, and optional properties
3. Create edges that represent meaningful relationships between nodes
4. Each edge should have: source, target, type (causal/process/temporal/dependency/association), label, optional description, strength (0-100), and relationshipType
5. Focus on the most important and meaningful relationships
6. Node IDs should be simple strings (e.g., "silicon_wafer", "photolithography")
7. Edge IDs will be auto-generated
8. Maximum ${maxNodes} nodes and ${maxEdges} edges
9. Ensure all edge source/target IDs match existing node IDs
10. Provide reasoning for your choices

Return ONLY a valid JSON object with this structure:
{
  "nodes": [...],
  "edges": [...],
  "reasoning": "Brief explanation of your analysis approach"
}`;

    const userPrompt = `Analyze this CSV data and generate a knowledge graph:

${context ? `Additional Context: ${context}\n\n` : ''}CSV Data (headers and sample rows):
${csvText}

Generate nodes and edges that best represent the relationships and entities in this data.`;

    const completion = await openai.chat.completions.create({
      model: useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4' : 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,

      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    let llmResponse: LLMGraphResponse;
    try {
      llmResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      throw new Error('Invalid JSON response from LLM');
    }

    // Create initial nodes with temporary positions
    const initialNodes: Node[] = llmResponse.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: { x: 0, y: 0 }, // Temporary position, will be layouted by Dagre
      data: {
        label: node.label,
        description: node.description,
        ...node.properties,
      },
    }));

    const initialEdges: Edge[] = llmResponse.edges
      .filter(edge => {
        // Ensure source and target nodes exist
        const sourceExists = initialNodes.some(n => n.id === edge.source);
        const targetExists = initialNodes.some(n => n.id === edge.target);
        return sourceExists && targetExists;
      })
      .map(edge => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: {
          label: edge.label,
          description: edge.description,
          relationshipType: edge.relationshipType,
          strength: edge.strength,
        },
      }));

    // Apply Dagre layout algorithm for better positioning
    const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges, {
      direction: 'TB', // Top to Bottom layout
      nodeWidth: 172,
      nodeHeight: 80,
      rankSep: 150,
      nodeSep: 100,
    });

    return NextResponse.json({
      nodes,
      edges,
      reasoning: llmResponse.reasoning,
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceRowCount: csvData.rows.length,
        processedRowCount: limitedRows.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    });

  } catch (error) {
    console.error('Error generating graph:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API configuration error' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded or billing issue' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate graph from CSV data' },
      { status: 500 }
    );
  }
}
