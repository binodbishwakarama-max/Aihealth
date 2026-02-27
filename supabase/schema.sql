-- HealthLens Database Schema for Supabase
-- Run this SQL in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Symptom Checks Table
CREATE TABLE IF NOT EXISTS symptom_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT, -- Clerk user ID (nullable for anonymous users)
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  gender TEXT,
  symptoms TEXT NOT NULL,
  duration TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  ai_response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT, -- Clerk user ID (nullable for anonymous bookings)
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('general', 'followup', 'specialist', 'urgent')),
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  symptoms TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
  calendar_event_id TEXT, -- Google Calendar event ID
  calendar_link TEXT, -- Link to view event in Google Calendar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Settings Table (single row for app configuration)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_name TEXT NOT NULL DEFAULT 'HealthLens',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0d9488',
  booking_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_symptom_checks_user_id ON symptom_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_created_at ON symptom_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_risk_level ON symptom_checks(risk_level);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE symptom_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =====================
-- Symptom Checks Policies
-- =====================

-- Allow insert for all (including anonymous)
CREATE POLICY "symptom_checks_insert" ON symptom_checks
  FOR INSERT WITH CHECK (true);

-- Users can only read their own checks
CREATE POLICY "symptom_checks_select_own" ON symptom_checks
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only delete their own checks
CREATE POLICY "symptom_checks_delete_own" ON symptom_checks
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================
-- Appointments Policies
-- =====================

-- Allow insert for all (booking is open)
CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT WITH CHECK (true);

-- Users can only read their own appointments
CREATE POLICY "appointments_select_own" ON appointments
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only update their own appointments
CREATE POLICY "appointments_update_own" ON appointments
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================
-- Settings Policies
-- =====================

-- Anyone can read settings (public config)
CREATE POLICY "settings_select_all" ON settings
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE via anon/authenticated roles
-- Admin operations use the service role key which bypasses RLS

-- Insert default settings if not exists
INSERT INTO settings (app_name, primary_color)
SELECT 'HealthLens', '#0d9488'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Helpful Views

-- Daily stats view
CREATE OR REPLACE VIEW daily_symptom_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE risk_level = 'High') as high_risk,
  COUNT(*) FILTER (WHERE risk_level = 'Medium') as medium_risk,
  COUNT(*) FILTER (WHERE risk_level = 'Low') as low_risk
FROM symptom_checks
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Comments for documentation
COMMENT ON TABLE symptom_checks IS 'Stores all symptom check submissions from users';
COMMENT ON TABLE appointments IS 'Stores appointment bookings from users';
COMMENT ON TABLE settings IS 'White label configuration settings for the application';
COMMENT ON COLUMN symptom_checks.user_id IS 'Clerk user ID - null for anonymous submissions';
COMMENT ON COLUMN symptom_checks.ai_response IS 'JSON object containing AI analysis results';

