import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET settings (public)
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    
    if (!supabase) {
      // Return defaults if Supabase not configured
      return NextResponse.json({
        app_name: 'CareAI',
        logo_url: null,
        primary_color: '#3b82f6',
        booking_url: null,
      });
    }
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
    }

    // Return defaults if no settings exist
    return NextResponse.json({
      app_name: data?.app_name || 'CareAI',
      logo_url: data?.logo_url || null,
      primary_color: data?.primary_color || '#3b82f6',
      booking_url: data?.booking_url || null,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      app_name: 'CareAI',
      logo_url: null,
      primary_color: '#3b82f6',
      booking_url: null,
    });
  }
}

// POST/PUT settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production, verify admin role here
    
    const body = await request.json();
    const { app_name, logo_url, primary_color, booking_url } = body;

    const supabase = supabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    
    if (existing?.id) {
      // Update existing
      result = await supabase
        .from('settings')
        .update({
          app_name,
          logo_url,
          primary_color,
          booking_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('settings')
        .insert({
          app_name,
          logo_url,
          primary_color,
          booking_url,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
