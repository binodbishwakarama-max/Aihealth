import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  bookingId: string;
  symptoms?: string;
}

const appointmentTypeLabels: Record<string, string> = {
  general: 'General Consultation',
  followup: 'Follow-up Visit',
  specialist: 'Specialist Referral',
  urgent: 'Urgent Care',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const { patientName, patientEmail, appointmentDate, appointmentTime, appointmentType, bookingId, symptoms } = data;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdfa;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✓ Appointment Confirmed</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">HealthLens Medical Center</p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Hello <strong>${patientName}</strong>,
          </p>
          <p style="color: #374151; font-size: 16px; margin-bottom: 25px;">
            Your appointment has been successfully booked. Here are your appointment details:
          </p>
          
          <!-- Appointment Details Card -->
          <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Booking ID</td>
                <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right; font-family: monospace;">${bookingId.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Date</td>
                <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${formatDate(appointmentDate)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Time</td>
                <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${appointmentTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Type</td>
                <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${appointmentTypeLabels[appointmentType] || appointmentType}</td>
              </tr>
              ${symptoms ? `
              <tr>
                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Symptoms</td>
                <td style="padding: 10px 0; color: #111827; text-align: right; border-top: 1px solid #e5e7eb; font-size: 13px;">${symptoms.slice(0, 100)}${symptoms.length > 100 ? '...' : ''}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Reminders -->
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>📋 Please remember to:</strong>
            </p>
            <ul style="color: #92400e; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Arrive 10 minutes before your appointment</li>
              <li>Bring a valid ID and insurance card</li>
              <li>List any medications you're currently taking</li>
            </ul>
          </div>
          
          <!-- Contact -->
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            If you need to reschedule or cancel, please contact us at least 24 hours before your appointment.
          </p>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              HealthLens Medical Center<br>
              This is an automated confirmation email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }
    const { data, error } = await resend.emails.send({
      from: 'HealthLens <onboarding@resend.dev>',
      to: patientEmail,
      subject: `✓ Appointment Confirmed - ${formatDate(appointmentDate)} at ${appointmentTime}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
