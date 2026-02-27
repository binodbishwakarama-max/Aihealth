import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/history(.*)',
  '/book(.*)',
]);

// Define API routes
const isApiRoute = createRouteMatcher([
  '/api/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect admin and user-specific routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
  
  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Prevent caching of sensitive pages
  if (isProtectedRoute(request) || isApiRoute(request)) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
