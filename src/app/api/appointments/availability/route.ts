import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALL_TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

// GET - Check available time slots for a specific date
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get all confirmed appointments for the given date
    const { data: bookedAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .eq('status', 'confirmed');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      );
    }

    // Get booked time slots
    const bookedSlots = bookedAppointments?.map(apt => apt.appointment_time) || [];

    // Filter out booked slots
    const availableSlots = ALL_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));

    // If the date is today, filter out past time slots
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const filteredSlots = availableSlots.filter(slot => {
        const [time, period] = slot.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let slotHour = hours;
        
        if (period === 'PM' && hours !== 12) {
          slotHour += 12;
        } else if (period === 'AM' && hours === 12) {
          slotHour = 0;
        }

        // Add 1 hour buffer
        if (slotHour < currentHour + 1) {
          return false;
        }
        if (slotHour === currentHour + 1 && minutes <= currentMinute) {
          return false;
        }

        return true;
      });

      return NextResponse.json({
        date,
        availableSlots: filteredSlots,
        totalSlots: ALL_TIME_SLOTS.length,
      });
    }

    return NextResponse.json({
      date,
      availableSlots,
      totalSlots: ALL_TIME_SLOTS.length,
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
