import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, Profile } from '../lib/supabase'

type SessionData = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']
type Session = SessionData['session']
type User = NonNullable<Session>['user']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    console.log("🔍 [AuthContext] Mencoba fetch profile untuk user ID:", userId)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error("❌ [AuthContext] GAGAL fetch profile. Error Supabase:", error)
        setProfile(null)
      } else {
        console.log("✅ [AuthContext] BERHASIL fetch profile:", data)
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error("❌ [AuthContext] Exception saat fetch profile:", err)
      setProfile(null)
    }
  }

  useEffect(() => {
    console.log("🚀 [AuthContext] Inisialisasi Auth...")
    
    // 🔥 PERBAIKAN: Bungkus dengan async function agar bisa await
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log("📦 [AuthContext] Session awal:", session ? "ADA" : "TIDAK ADA")
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id) // 🔥 TUNGGU sampai profile selesai di-fetch
      } else {
        setProfile(null)
      }
      
      setLoading(false) // 🔥 BARU SETELAH INI loading diubah jadi false
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 [AuthContext] Auth State Change. Event:", event)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          console.log("⚠️ [AuthContext] Session hilang, profile di-reset.")
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = { user, session, profile, loading, signIn, signOut }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}