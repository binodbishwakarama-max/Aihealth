import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';

// GET - Initiate Google OAuth flow
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('appointmentId');
  
  // Pass appointment ID in state so we can use it after callback
  const state = appointmentId ? JSON.stringify({ appointmentId }) : undefined;
  
  const authUrl = getAuthUrl(state);
  
  return NextResponse.redirect(authUrl);
}
