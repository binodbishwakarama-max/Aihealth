import { NextRequest, NextResponse } from 'next/server';
import { analyzeVision } from '@/lib/ai';
import { checkRateLimit, rateLimitResponse, getClientIP, logSecurityEvent } from '@/lib/security';
import { auth } from '@clerk/nextjs/server';

const RATE_LIMIT_CONFIG = {
    windowMs: 60 * 1000,
    maxRequests: 5, // Lower rate limit for expensive image processing
    keyPrefix: 'vision',
};

export async function POST(request: NextRequest) {
    const clientIP = getClientIP(request);

    try {
        const rateLimit = checkRateLimit(clientIP, RATE_LIMIT_CONFIG);
        if (!rateLimit.success) {
            logSecurityEvent('rate_limit', {
                ip: clientIP,
                route: '/api/analyze-vision',
                resetIn: rateLimit.resetIn
            });
            return rateLimitResponse(rateLimit.resetIn);
        }

        const body = await request.json();
        const { image, mimeType, language } = body;

        if (!image || !mimeType) {
            return NextResponse.json(
                { error: 'Image base64 data and mimeType are required.' },
                { status: 400 }
            );
        }

        // Call the vision AI
        const analysis = await analyzeVision(image, mimeType, language);

        return NextResponse.json(
            { analysis },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                }
            }
        );

    } catch (error: any) {
        console.error('Vision API error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to analyze symptoms visually.' },
            { status: 500 }
        );
    }
}
