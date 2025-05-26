# Langfuse LLMOps Integration

This knowledge hub now includes comprehensive LLMOps capabilities using Langfuse for observability, prompt management, and feedback collection.

## Features Implemented

### 1. **Prompt Management**
- ✅ Centralized prompt templates in Langfuse
- ✅ Version control for prompts
- ✅ Fallback to local prompts when Langfuse is unavailable
- ✅ Template variable substitution

### 2. **Observability & Logging**
- ✅ Complete trace logging for LLM generations
- ✅ Token usage tracking
- ✅ Performance metrics (processing time, LLM latency)
- ✅ Error logging and categorization
- ✅ Session-based tracking

### 3. **User Feedback Collection**
- ✅ Interactive feedback dialog
- ✅ Multi-dimensional ratings (accuracy, completeness, usefulness)
- ✅ Structured feedback categories
- ✅ Integration with Langfuse scoring system

### 4. **Session Management**
- ✅ UUID-based session tracking
- ✅ User identification for analytics
- ✅ Cross-request trace correlation

## Configuration

### Environment Variables
Add these to your `.env.local`:

```bash
# Langfuse Configuration
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_HOST=https://cloud.langfuse.com
```

### Prompt Templates
The system automatically creates these prompt templates:
- `graph-generation-system`: System instructions for the LLM
- `graph-generation-user`: User prompt template with context variables

## Usage

### For Users
1. **Generate Graph**: Click "Generate Graph with AI" 
2. **Provide Context**: Add optional context to improve generation
3. **Rate Results**: Use the "Rate this generation" button for feedback
4. **Track Progress**: View detailed metrics about processing time and token usage

### For Developers
```javascript
// Example trace creation
const trace = createGraphGenerationTrace(
  sessionId, 
  userId, 
  { csvHeaders, csvRowCount, maxNodes, maxEdges }
);

// Log LLM generation
await logLLMGeneration(trace, input, output, usage, model, startTime, endTime);

// Collect user feedback
await logUserFeedback(traceId, feedback);
```

## Benefits

### 1. **Production Monitoring**
- Track LLM performance and costs
- Monitor user satisfaction and feedback
- Identify failure patterns and bottlenecks

### 2. **Prompt Engineering**
- A/B test different prompts
- Version control for prompt improvements
- Analytics on prompt effectiveness

### 3. **User Experience**
- Detailed feedback collection
- Performance transparency
- Continuous improvement based on user input

### 4. **Cost Management**
- Token usage tracking
- Cost analysis per session/user
- Optimization opportunities identification

## Langfuse Dashboard Features

Once connected to Langfuse, you'll have access to:

1. **Traces View**: See complete LLM interaction flows
2. **Generations**: Analyze individual LLM calls with inputs/outputs
3. **Scores**: View user feedback and ratings
4. **Sessions**: Track user journeys and patterns
5. **Prompts**: Manage and version prompt templates
6. **Analytics**: Cost, performance, and usage insights

## Architecture

```
User Input → GraphGenerator → API Route → Langfuse Trace
                                ↓
                         OpenAI/Azure OpenAI
                                ↓
                         Response Processing
                                ↓
                         Langfuse Logging
                                ↓
                         User Feedback → Langfuse Scores
```

## Next Steps

To get the full benefits:

1. **Set up Langfuse account** at https://langfuse.com
2. **Configure environment variables** with your API keys
3. **Initialize prompt templates** (happens automatically on first run)
4. **Start generating graphs** to see traces in Langfuse
5. **Collect user feedback** to improve the system

## Troubleshooting

- **No traces appearing**: Check environment variables and API keys
- **Prompt template errors**: Templates will auto-create on first use
- **Feedback not working**: Ensure traceId is properly captured
- **Performance issues**: Monitor token usage and consider prompt optimization

The system gracefully degrades when Langfuse is unavailable, falling back to local prompts and logging warnings instead of errors.
