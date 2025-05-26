import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Node, Edge } from '@/types/graph';
import { getLayoutedElements } from '@/utils/layout';
import {
  createGraphGenerationTrace,
  getPrompt,
  logLLMGeneration,
  flushLangfuse,
  PROMPT_TEMPLATES,
} from '@/lib/langfuse';
import { randomUUID } from 'crypto';

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
  sessionId?: string; // For Langfuse tracing
  userId?: string; // For user tracking
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
  const startTime = new Date();
  let trace: any = null;
  
  try {
    const body: GenerateGraphRequest = await request.json();
    const { 
      csvData, 
      context = '', 
      maxNodes = 20, 
      maxEdges = 30,
      sessionId = randomUUID(),
      userId 
    } = body;

    if (!csvData || !csvData.headers || !csvData.rows) {
      return NextResponse.json(
        { error: 'Invalid CSV data provided' },
        { status: 400 }
      );
    }

    // Create Langfuse trace for this graph generation request
    trace = createGraphGenerationTrace(
      sessionId,
      userId,
      {
        csvHeaders: csvData.headers,
        csvRowCount: csvData.rows.length,
        maxNodes,
        maxEdges,
        hasContext: !!context,
      }
    );

    // Check for API key configuration
    const useAzure = process.env.USE_AZURE_OPENAI === 'true';
    const hasApiKey = useAzure 
      ? process.env.AZURE_OPENAI_API_KEY 
      : process.env.OPENAI_API_KEY;

    if (!hasApiKey) {
      if (trace) trace.update({ tags: ['error', 'api-key-missing'] });
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = createOpenAIClient();

    // Prepare CSV data for the prompt (limit to first 50 rows for token efficiency)
    const limitedRows = csvData.rows.slice(0, 50);
    const csvText = [csvData.headers.join(','), ...limitedRows.map(row => row.join(','))].join('\n');

    // Get prompts from Langfuse (with fallbacks)
    const systemPrompt = await getPrompt(PROMPT_TEMPLATES.GRAPH_GENERATION_SYSTEM, {
      maxNodes,
      maxEdges,
    });

    const userPrompt = await getPrompt(PROMPT_TEMPLATES.GRAPH_GENERATION_USER, {
      context,
      csvData: csvText,
    });

    // Track the LLM call timing
    const llmStartTime = new Date();
    
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

    const llmEndTime = new Date();

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    let llmResponse: LLMGraphResponse;
    try {
      llmResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      if (trace) trace.update({ tags: ['error', 'json-parse-error'] });
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

    // Log LLM generation to Langfuse
    if (trace) {
      await logLLMGeneration(
        trace,
        {
          systemPrompt,
          userPrompt,
          csvRowCount: csvData.rows.length,
          maxNodes,
          maxEdges,
        },
        {
          response: responseText,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          reasoning: llmResponse.reasoning,
        },
        {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
        useAzure ? process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4' : 'gpt-4o',
        llmStartTime,
        llmEndTime
      );

      // Update trace with success
      trace.update({ 
        tags: ['success', 'graph-generation-complete'],
        output: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          reasoning: llmResponse.reasoning,
        },
      });
    }

    const endTime = new Date();

    // Flush Langfuse events
    await flushLangfuse();

    return NextResponse.json({
      nodes,
      edges,
      reasoning: llmResponse.reasoning,
      metadata: {
        generatedAt: endTime.toISOString(),
        sourceRowCount: csvData.rows.length,
        processedRowCount: limitedRows.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        sessionId,
        processingTimeMs: endTime.getTime() - startTime.getTime(),
        llmTimeMs: llmEndTime.getTime() - llmStartTime.getTime(),
        tokenUsage: completion.usage,
      },
    });

  } catch (error) {
    console.error('Error generating graph:', error);
    
    // Update trace with error
    if (trace) {
      trace.update({ 
        tags: ['error', 'graph-generation-failed'],
        output: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      await flushLangfuse();
    }
    
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
