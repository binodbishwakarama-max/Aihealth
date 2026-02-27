import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAppointmentConfirmation } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create new appointment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      appointmentType,
      preferredDate,
      preferredTime,
      symptoms,
      notes,
      userId,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !appointmentType || !preferredDate || !preferredTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slot is still available
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', preferredDate)
      .eq('appointment_time', preferredTime)
      .eq('status', 'confirmed');

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another time.' },
        { status: 409 }
      );
    }

    // Create appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: userId || null,
        patient_name: name,
        patient_email: email,
        patient_phone: phone,
        appointment_type: appointmentType,
        appointment_date: preferredDate,
        appointment_time: preferredTime,
        symptoms: symptoms || null,
        notes: notes || null,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      await sendAppointmentConfirmation({
        patientName: name,
        patientEmail: email,
        appointmentDate: preferredDate,
        appointmentTime: preferredTime,
        appointmentType: appointmentType,
        bookingId: data.id,
        symptoms: symptoms,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      id: data.id,
      message: 'Appointment booked successfully',
      appointment: {
        date: preferredDate,
        time: preferredTime,
        type: appointmentType,
      }
    });

  } catch (error) {
    console.error('Appointment booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List appointments (for admin or user)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointments: data });

  } catch (error) {
    console.error('Fetch appointments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
