import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Tenant } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  tenant: Tenant | null
  session: Session | null
  loading: boolean
  isSuperAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshTenant: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null)
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [tenant, setTenant]         = useState<Tenant | null>(null)
  const [session, setSession]       = useState<Session | null>(null)
  const [loading, setLoading]       = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const loadProfile = async (userId: string) => {
    // Check superadmin first
    const { data: sa } = await supabase
      .from('superadmins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    setIsSuperAdmin(!!sa)

    const { data, error } = await supabase
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .eq('active', true)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
      setTenant(data.tenant as Tenant)
    }
  }

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id)
  }

  const refreshTenant = async () => {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*, tenant:tenants(*)').eq('id', user.id).single()
    if (data) setTenant(data.tenant as Tenant)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setTenant(null)
        setIsSuperAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setTenant(null)
    setIsSuperAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, tenant, session, loading, isSuperAdmin, signIn, signOut, refreshProfile, refreshTenant }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
