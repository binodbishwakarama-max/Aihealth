import { NextResponse } from 'next/server';
import { getTokensFromCode, createCalendarEvent } from '@/lib/google-calendar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Handle OAuth callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denying access
  if (error) {
    return NextResponse.redirect(
      new URL('/book?error=calendar_denied', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/book?error=no_code', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Parse state to get appointment ID
    let appointmentId: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(state);
        appointmentId = parsed.appointmentId;
      } catch {
        // State parsing failed
      }
    }

    if (!appointmentId) {
      return NextResponse.redirect(
        new URL('/book?error=no_appointment', request.url)
      );
    }

    // Get appointment details from database
    const { data: appointment, error: dbError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (dbError || !appointment) {
      return NextResponse.redirect(
        new URL('/book?error=appointment_not_found', request.url)
      );
    }

    // Create calendar event
    const appointmentTypeLabels: Record<string, string> = {
      general: 'General Consultation',
      followup: 'Follow-up Visit',
      specialist: 'Specialist Referral',
      urgent: 'Urgent Care',
    };

    const calendarEvent = await createCalendarEvent(
      tokens.access_token!,
      tokens.refresh_token || null,
      {
        title: `HealthLens: ${appointmentTypeLabels[appointment.appointment_type] || 'Medical Appointment'}`,
        description: `Appointment with HealthLens Medical Center\n\nPatient: ${appointment.patient_name}\nType: ${appointmentTypeLabels[appointment.appointment_type]}\n${appointment.symptoms ? `\nSymptoms: ${appointment.symptoms}` : ''}${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}`,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        duration: 30,
      }
    );

    // Update appointment with calendar event ID
    await supabase
      .from('appointments')
      .update({ 
        calendar_event_id: calendarEvent.id,
        calendar_link: calendarEvent.htmlLink,
      })
      .eq('id', appointmentId);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/book/success?id=${appointmentId}&calendar=added`, request.url)
    );

  } catch (error) {
    console.error('Google Calendar error:', error);
    return NextResponse.redirect(
      new URL('/book?error=calendar_error', request.url)
    );
  }
}
