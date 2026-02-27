import { NextRequest, NextResponse } from 'next/server';
import { healthChat, ChatMessage } from '@/lib/ai';
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  sanitizeString,
  logSecurityEvent,
} from '@/lib/security';

// Rate limit config: 20 chat messages per minute per IP
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 20,
  keyPrefix: 'chat',
};

// Maximum message length
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 50;

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
    if (!rateLimit.success) {
      logSecurityEvent('rate_limit', {
        ip: clientIP,
        route: '/api/chat',
        resetIn: rateLimit.resetIn
      });
      return rateLimitResponse(rateLimit.resetIn);
    }

    const body = await request.json();
    const { messages, context, language } = body as {
      messages: ChatMessage[];
      context?: { symptoms?: string; analysis?: string };
      language?: string;
    };

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'messages', reason: 'empty' });
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Limit number of messages (prevent memory attacks)
    if (messages.length > MAX_MESSAGES) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'messages', reason: 'too_many' });
      return NextResponse.json(
        { error: `Maximum ${MAX_MESSAGES} messages allowed` },
        { status: 400 }
      );
    }

    // Validate and sanitize each message
    const sanitizedMessages: ChatMessage[] = [];
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        logSecurityEvent('invalid_input', { ip: clientIP, field: 'message_format' });
        return NextResponse.json(
          { error: 'Invalid message format' },
          { status: 400 }
        );
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        logSecurityEvent('invalid_input', { ip: clientIP, field: 'message_role', value: msg.role });
        return NextResponse.json(
          { error: 'Invalid message role' },
          { status: 400 }
        );
      }

      // Sanitize message content
      const sanitizedContent = sanitizeString(msg.content, MAX_MESSAGE_LENGTH);
      if (sanitizedContent.length === 0) {
        return NextResponse.json(
          { error: 'Message content cannot be empty' },
          { status: 400 }
        );
      }

      sanitizedMessages.push({
        role: msg.role,
        content: sanitizedContent,
      });
    }

    // Sanitize context if provided
    const sanitizedContext = context ? {
      symptoms: context.symptoms ? sanitizeString(context.symptoms, 2000) : undefined,
      analysis: context.analysis ? sanitizeString(context.analysis, 5000) : undefined,
    } : undefined;

    const response = await healthChat(sanitizedMessages, sanitizedContext, language || 'English');

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
