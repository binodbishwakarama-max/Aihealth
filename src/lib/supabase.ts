import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if URL is configured
let supabase: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured. Please set environment variables.');
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

// Admin client with service role (server-side only)
export const supabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase admin not configured. Please set environment variables.');
    return null;
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Types
export interface SymptomCheck {
  id: string;
  user_id: string;
  age: number;
  gender: string | null;
  symptoms: string;
  duration: string;
  severity: number;
  risk_level: 'Low' | 'Medium' | 'High';
  ai_response: AIResponse;
  created_at: string;
}

export interface AIResponse {
  possible_conditions: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  self_care: string[];
  see_doctor_if: string[];
  emergency_signs: string[];
}

export interface AppSettings {
  id?: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  booking_url: string | null;
  updated_at?: string;
}
