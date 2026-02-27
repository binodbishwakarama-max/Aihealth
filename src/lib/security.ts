/**
 * Security utilities for HealthLens
 * - Rate limiting
 * - Input sanitization
 * - Admin verification
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ============================================
// RATE LIMITER
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for rate limit key
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = config;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // If no entry or expired, create new one
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
    };
  }

  // If within limit, increment
  if (entry.count < maxRequests) {
    entry.count++;
    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  // Rate limited
  return {
    success: false,
    remaining: 0,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { 
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(resetIn / 1000)
    },
    { 
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetIn / 1000)),
        'X-RateLimit-Remaining': '0',
      }
    }
  );
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input - removes potential XSS and injection attempts
 */
export function sanitizeString(input: string, maxLength: number = 5000): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Trim whitespace
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove HTML tags (basic XSS prevention)
    .replace(/<[^>]*>/g, '')
    // Remove script-like patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Truncate to max length
    .slice(0, maxLength);
}

/**
 * Validate and sanitize age input
 */
export function sanitizeAge(age: unknown): number | null {
  const num = Number(age);
  if (isNaN(num) || num < 0 || num > 150 || !Number.isInteger(num)) {
    return null;
  }
  return num;
}

/**
 * Validate and sanitize severity input (1-10)
 */
export function sanitizeSeverity(severity: unknown): number | null {
  const num = Number(severity);
  if (isNaN(num) || num < 1 || num > 10) {
    return null;
  }
  return Math.round(num);
}

/**
 * Validate duration string
 */
export function sanitizeDuration(duration: unknown): string | null {
  if (typeof duration !== 'string') return null;

  const cleaned = duration.toLowerCase().trim();
  
  // Check if it matches known patterns or is reasonably short
  if (cleaned.length > 50) return null;
  
  return sanitizeString(duration, 50);
}

/**
 * Validate gender input
 */
export function sanitizeGender(gender: unknown): string {
  if (typeof gender !== 'string') return '';
  const cleaned = gender.toLowerCase().trim();
  
  const validGenders = ['male', 'female', 'other', 'prefer not to say', ''];
  if (validGenders.includes(cleaned)) {
    return cleaned;
  }
  return '';
}

/**
 * Validate symptoms input
 */
export function sanitizeSymptoms(symptoms: unknown): string | null {
  if (typeof symptoms !== 'string') return null;
  
  const cleaned = sanitizeString(symptoms, 2000);
  
  // Must be at least 10 characters for meaningful symptoms
  if (cleaned.length < 10) return null;
  
  return cleaned;
}

// ============================================
// ADMIN VERIFICATION
// ============================================

// Admin user IDs or emails (configure via environment variable)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

/**
 * Verify if current user is an admin
 * Checks against environment-configured admin list
 */
export async function verifyAdmin(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { isAdmin: false, userId: null, error: 'Not authenticated' };
    }

    // Check if user ID is in admin list
    if (ADMIN_USER_IDS.includes(userId)) {
      return { isAdmin: true, userId };
    }

    // Check email against admin list
    if (ADMIN_EMAILS.length > 0) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
        
        if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
          return { isAdmin: true, userId };
        }
      } catch (e) {
        console.error('Error fetching user details:', e);
      }
    }

    // For development: if no admins configured, allow any authenticated user
    // Remove this in production!
    if (ADMIN_EMAILS.length === 0 && ADMIN_USER_IDS.length === 0) {
      console.warn('⚠️ No ADMIN_EMAILS or ADMIN_USER_IDS configured. Allowing all authenticated users as admin.');
      return { isAdmin: true, userId };
    }

    return { isAdmin: false, userId, error: 'Not authorized as admin' };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { isAdmin: false, userId: null, error: 'Verification failed' };
  }
}

/**
 * Create unauthorized response for admin routes
 */
export function adminUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

// ============================================
// REQUEST VALIDATION
// ============================================

/**
 * Get client IP from request (handles proxies)
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return 'unknown';
}

/**
 * Log security event (for audit trail)
 */
export function logSecurityEvent(
  event: 'rate_limit' | 'invalid_input' | 'admin_access' | 'unauthorized',
  details: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    type: 'SECURITY_EVENT',
    event,
    timestamp,
    ...details,
  }));
}
