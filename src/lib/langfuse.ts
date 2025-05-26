import { Langfuse } from 'langfuse';

// Initialize Langfuse client
let langfuse: Langfuse | null = null;

export function getLangfuseClient(): Langfuse | null {
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
    console.warn('Langfuse credentials not configured. LLMOps features will be disabled.');
    return null;
  }

  if (!langfuse) {
    try {
      langfuse = new Langfuse({
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
        flushAt: 1, // Send immediately for development
      });
    } catch (error) {
      console.error('Failed to initialize Langfuse:', error);
      return null;
    }
  }

  return langfuse;
}

// Prompt template names
export const PROMPT_TEMPLATES = {
  GRAPH_GENERATION_SYSTEM: 'graph-generation-system',
  GRAPH_GENERATION_USER: 'graph-generation-user',
} as const;

// Initialize default prompt templates
export async function initializePromptTemplates() {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    // System prompt template
    await client.createPrompt({
      name: PROMPT_TEMPLATES.GRAPH_GENERATION_SYSTEM,
      prompt: `You are an expert knowledge graph generator. Your task is to analyze CSV data and create meaningful nodes and edges that represent the relationships and entities in the data.

Guidelines:
1. Create nodes for important entities, concepts, processes, events, or materials mentioned in the data
2. Each node should have: id, type (event/process/material/entity/concept), label, description, and optional properties
3. Create edges that represent meaningful relationships between nodes
4. Each edge should have: source, target, type (causal/process/temporal/dependency/association), label, optional description, strength (0-100), and relationshipType
5. Focus on the most important and meaningful relationships
6. Node IDs should be simple strings (e.g., "silicon_wafer", "photolithography")
7. Edge IDs will be auto-generated
8. Maximum {{maxNodes}} nodes and {{maxEdges}} edges
9. Ensure all edge source/target IDs match existing node IDs
10. Provide reasoning for your choices

Return ONLY a valid JSON object with this structure:
{
  "nodes": [...],
  "edges": [...],
  "reasoning": "Brief explanation of your analysis approach"
}`,
      isActive: true,
      config: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
      },
      labels: ['graph-generation', 'system-prompt'],
    });

    // User prompt template
    await client.createPrompt({
      name: PROMPT_TEMPLATES.GRAPH_GENERATION_USER,
      prompt: `Analyze this CSV data and generate a knowledge graph:

{{#if context}}
Additional Context: {{context}}

{{/if}}CSV Data (headers and sample rows):
{{csvData}}

Generate nodes and edges that best represent the relationships and entities in this data.`,
      isActive: true,
      labels: ['graph-generation', 'user-prompt'],
    });

    console.log('Langfuse prompt templates initialized successfully');
  } catch (error) {
    console.error('Failed to initialize prompt templates:', error);
  }
}

// Get prompt from Langfuse with fallback
export async function getPrompt(templateName: string, variables: Record<string, any> = {}): Promise<string> {
  const client = getLangfuseClient();
  
  if (!client) {
    // Fallback prompts when Langfuse is not available
    return getFallbackPrompt(templateName, variables);
  }

  try {
    // Try to get prompt with 'production' label first, then without label as fallback
    let prompt;
    try {
      prompt = await client.getPrompt(templateName, undefined, { label: 'production' });
    } catch (labelError) {
      // If the first attempt fails, try without any label
      prompt = await client.getPrompt(templateName);
    }
    
    if (prompt?.prompt) {
      // Simple template variable replacement
      let compiledPrompt = prompt.prompt;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        compiledPrompt = compiledPrompt.replace(regex, String(value));
      }
      
      // Handle conditional blocks (simple implementation)
      compiledPrompt = compiledPrompt.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
        return variables[condition] ? content : '';
      });
      
      return compiledPrompt;
    }
  } catch (error) {
    console.error(`Failed to get prompt ${templateName} from Langfuse:`, error);
  }

  // Fallback to local prompts
  return getFallbackPrompt(templateName, variables);
}

// Fallback prompts when Langfuse is not available
function getFallbackPrompt(templateName: string, variables: Record<string, any>): string {
  const { maxNodes = 20, maxEdges = 30, context = '', csvData = '' } = variables;

  switch (templateName) {
    case PROMPT_TEMPLATES.GRAPH_GENERATION_SYSTEM:
      return `You are an expert knowledge graph generator. Your task is to analyze CSV data and create meaningful nodes and edges that represent the relationships and entities in the data.

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

    case PROMPT_TEMPLATES.GRAPH_GENERATION_USER:
      return `Analyze this CSV data and generate a knowledge graph:

${context ? `Additional Context: ${context}\n\n` : ''}CSV Data (headers and sample rows):
${csvData}

Generate nodes and edges that best represent the relationships and entities in this data.`;

    default:
      throw new Error(`Unknown prompt template: ${templateName}`);
  }
}

// Create a trace for graph generation
export function createGraphGenerationTrace(
  sessionId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  const client = getLangfuseClient();
  if (!client) return null;

  return client.trace({
    name: 'graph-generation',
    sessionId,
    userId,
    metadata: {
      feature: 'csv-to-graph',
      ...metadata,
    },
    tags: ['graph-generation', 'csv-analysis'],
  });
}

// Log LLM generation with detailed metrics
export async function logLLMGeneration(
  trace: any,
  input: {
    systemPrompt: string;
    userPrompt: string;
    csvRowCount: number;
    maxNodes: number;
    maxEdges: number;
  },
  output: {
    response: string;
    nodeCount: number;
    edgeCount: number;
    reasoning: string;
  },
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  },
  model: string,
  startTime: Date,
  endTime: Date
) {
  if (!trace) return;

  try {
    const generation = trace.generation({
      name: 'csv-to-graph-llm-call',
      model,
      modelParameters: {
        temperature: 0.7,
        maxTokens: 2000,
        responseFormat: 'json_object',
      },
      input: {
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        metadata: {
          csvRowCount: input.csvRowCount,
          maxNodes: input.maxNodes,
          maxEdges: input.maxEdges,
        },
      },
      output: {
        response: output.response,
        reasoning: output.reasoning,
        metadata: {
          generatedNodes: output.nodeCount,
          generatedEdges: output.edgeCount,
        },
      },
      usage: {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      },
      startTime,
      endTime,
    });

    await generation.end();
  } catch (error) {
    console.error('Failed to log LLM generation to Langfuse:', error);
  }
}

// Log user feedback/scores
export async function logUserFeedback(
  traceId: string,
  feedback: {
    score?: number; // 1-5 or 1-10 scale
    comment?: string;
    useful?: boolean;
    accuracy?: number;
    completeness?: number;
  }
) {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    // Only send score if it's defined
    if (feedback.score !== undefined) {
      await client.score({
        traceId,
        name: 'user-feedback',
        value: feedback.score,
        comment: feedback.comment,
      });
    } else if (feedback.comment) {
      // Send just comment if no score
      await client.score({
        traceId,
        name: 'user-feedback',
        value: 0, // Default value when only comment is provided
        comment: feedback.comment,
      });
    }
  } catch (error) {
    console.error('Failed to log user feedback to Langfuse:', error);
  }
}

// Flush pending events (useful for serverless environments)
export async function flushLangfuse() {
  const client = getLangfuseClient();
  if (client) {
    await client.flushAsync();
  }
}

// Shutdown Langfuse client
export async function shutdownLangfuse() {
  const client = getLangfuseClient();
  if (client) {
    await client.shutdown();
    langfuse = null;
  }
}
