import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured. Please set RESEND_API_KEY.' }, { status: 503 });
    }
    const formData = await request.formData();
    const email = formData.get('email');
    const pdfFile = formData.get('pdf');

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!pdfFile || !(pdfFile instanceof File)) {
      return NextResponse.json({ error: 'PDF file is required.' }, { status: 400 });
    }

    // Read PDF as base64
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send email with PDF attachment
    const { error } = await resend.emails.send({
      from: 'HealthLens <onboarding@resend.dev>',
      to: email,
      subject: 'Your HealthLens AI Health Report',
      html: `<p>Dear user,<br>Your AI-generated health report is attached as a PDF.<br><br>Stay healthy!<br>HealthLens Team</p>`,
      attachments: [
        {
          filename: 'HealthLens-Health-Report.pdf',
          content: buffer,
        },
      ],
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
