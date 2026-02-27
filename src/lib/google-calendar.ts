import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// Generate auth URL for user consent
export function getAuthUrl(state?: string) {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state, // Pass appointment ID or other data
    prompt: 'consent',
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Create calendar event
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string | null,
  eventDetails: {
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM AM/PM
    duration?: number; // minutes, default 30
    location?: string;
  }
) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Parse time from "09:00 AM" format to 24h
  const timeParts = eventDetails.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) throw new Error('Invalid time format');

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const meridiem = timeParts[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  // Create start datetime
  const startDate = new Date(`${eventDetails.date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  const endDate = new Date(startDate.getTime() + (eventDetails.duration || 30) * 60000);

  const event = {
    summary: eventDetails.title,
    description: eventDetails.description,
    location: eventDetails.location || 'HealthLens Medical Center',
    start: {
      dateTime: startDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}
