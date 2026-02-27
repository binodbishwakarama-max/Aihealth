-- ============================================
-- HealthLens: Fix RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- =====================
-- 1. SYMPTOM_CHECKS
-- =====================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow insert for all" ON symptom_checks;
DROP POLICY IF EXISTS "Users can read own checks" ON symptom_checks;
DROP POLICY IF EXISTS "Allow all for symptom_checks" ON symptom_checks;

-- Ensure RLS is enabled
ALTER TABLE symptom_checks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (anonymous symptom checks are allowed)
CREATE POLICY "symptom_checks_insert"
  ON symptom_checks FOR INSERT
  WITH CHECK (true);

-- Users can only SELECT their own checks (matched by user_id)
CREATE POLICY "symptom_checks_select_own"
  ON symptom_checks FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only DELETE their own checks
CREATE POLICY "symptom_checks_delete_own"
  ON symptom_checks FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================
-- 2. APPOINTMENTS
-- =====================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all for appointments" ON appointments;

-- Enable RLS (was missing!)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (booking is open)
CREATE POLICY "appointments_insert"
  ON appointments FOR INSERT
  WITH CHECK (true);

-- Users can only SELECT their own appointments
CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only UPDATE their own appointments (e.g., cancel)
CREATE POLICY "appointments_update_own"
  ON appointments FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =====================
-- 3. SETTINGS
-- =====================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow read settings for all" ON settings;
DROP POLICY IF EXISTS "Allow update settings" ON settings;
DROP POLICY IF EXISTS "Allow insert settings" ON settings;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anyone can READ settings (public config)
CREATE POLICY "settings_select_all"
  ON settings FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE via anon or authenticated roles
-- Admin operations go through the service role key (bypasses RLS)

-- Done! All 3 RLS issues are now fixed.
