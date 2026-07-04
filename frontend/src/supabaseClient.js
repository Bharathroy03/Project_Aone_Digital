import { createClient } from '@supabase/supabase-js'

// Supabase credentials loaded from Vite environment variables with fallback values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zyqxiuoyrytsobuuqcwic.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cXhpdW95cnl0c2J1dXFjd2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDc5NDQsImV4cCI6MjA5ODYyMzk0NH0.RDPG3pkqOgic23t72ZfKl8VzSKWQ8Vx3n9M5bLknRV4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
