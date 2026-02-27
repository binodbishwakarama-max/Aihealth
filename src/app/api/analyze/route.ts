import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeSymptoms } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  sanitizeAge,
  sanitizeSeverity,
  sanitizeDuration,
  sanitizeGender,
  sanitizeSymptoms,
  logSecurityEvent,
} from '@/lib/security';

// Rate limit config: 10 requests per minute per IP
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 10,
  keyPrefix: 'analyze',
};

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
    if (!rateLimit.success) {
      logSecurityEvent('rate_limit', {
        ip: clientIP,
        route: '/api/analyze',
        resetIn: rateLimit.resetIn
      });
      return rateLimitResponse(rateLimit.resetIn);
    }

    const body = await request.json();

    // Validate and sanitize inputs
    const age = sanitizeAge(body.age);
    const severity = sanitizeSeverity(body.severity);
    const duration = sanitizeDuration(body.duration);
    const gender = sanitizeGender(body.gender);
    const symptoms = sanitizeSymptoms(body.symptoms);

    // Validate required fields
    if (age === null) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'age', value: body.age });
      return NextResponse.json(
        { error: 'Invalid age. Must be between 0 and 150.' },
        { status: 400 }
      );
    }

    if (symptoms === null) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'symptoms' });
      return NextResponse.json(
        { error: 'Symptoms description is required (minimum 10 characters).' },
        { status: 400 }
      );
    }

    if (duration === null) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'duration' });
      return NextResponse.json(
        { error: 'Duration is required.' },
        { status: 400 }
      );
    }

    if (severity === null) {
      logSecurityEvent('invalid_input', { ip: clientIP, field: 'severity' });
      return NextResponse.json(
        { error: 'Severity must be between 1 and 10.' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    const { userId } = await auth();

    // Get language preference
    const language = body.language || 'English';

    // Analyze symptoms with AI
    const aiResponse = await analyzeSymptoms({
      age,
      gender,
      symptoms,
      duration,
      severity,
      language,
    });

    // Save to database
    let recordId: string | null = null;

    try {
      const supabase = supabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase
          .from('symptom_checks')
          .insert({
            user_id: userId || null,
            age,
            gender: gender || null,
            symptoms,
            duration,
            severity,
            risk_level: aiResponse.risk_level,
            ai_response: aiResponse,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Database error:', error);
          // Continue even if database save fails
        } else {
          recordId = data?.id;
        }
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Continue even if database is not configured
    }

    return NextResponse.json({
      id: recordId,
      ai_response: aiResponse,
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
}
