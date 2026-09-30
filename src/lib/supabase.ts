import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ SUPABASE CREDENTIALS NOT CONFIGURED\n' +
    'Please create a .env file with:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// ==========================================
// TAMBAHKAN INI DI BAWAH (WAJIB!)
// ==========================================

export type Role = 'super_admin' | 'admin' | 'tatib' | 'viewer'

export interface Profile {
  id: string
  tenant_id: string | null
  email: string
  nama_lengkap: string
  role: Role
  wilayah: string | null
  no_hp: string | null
  created_at: string
}