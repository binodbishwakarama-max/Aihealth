import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single appointment details
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment: data });

  } catch (error) {
    console.error('Fetch appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update appointment (reschedule or cancel)
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { status, preferredDate, preferredTime, notes } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (preferredDate) {
      updateData.appointment_date = preferredDate;
    }

    if (preferredTime) {
      updateData.appointment_time = preferredTime;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // If rescheduling, check availability
    if (preferredDate && preferredTime) {
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('appointment_date', preferredDate)
        .eq('appointment_time', preferredTime)
        .eq('status', 'confirmed')
        .neq('id', id);

      if (existingAppointments && existingAppointments.length > 0) {
        return NextResponse.json(
          { error: 'This time slot is not available' },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Appointment updated successfully',
      appointment: data,
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel and delete appointment
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Appointment cancelled and deleted successfully',
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
