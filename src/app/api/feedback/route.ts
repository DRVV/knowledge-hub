import { NextRequest, NextResponse } from 'next/server';
import { logUserFeedback, flushLangfuse } from '@/lib/langfuse';

interface FeedbackRequest {
  traceId: string;
  sessionId: string;
  score?: number; // 1-5 scale
  comment?: string;
  useful?: boolean;
  accuracy?: number; // 1-10 scale
  completeness?: number; // 1-10 scale
  graphQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  improvements?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { 
      traceId, 
      sessionId, 
      score, 
      comment, 
      useful, 
      accuracy, 
      completeness,
      graphQuality,
      improvements 
    } = body;

    if (!traceId || !sessionId) {
      return NextResponse.json(
        { error: 'traceId and sessionId are required' },
        { status: 400 }
      );
    }

    // Log feedback to Langfuse
    await logUserFeedback(traceId, {
      score,
      comment: comment || `Quality: ${graphQuality}${improvements?.length ? `, Improvements: ${improvements.join(', ')}` : ''}`,
      useful,
      accuracy,
      completeness,
    });

    // Flush to ensure feedback is sent immediately
    await flushLangfuse();

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
