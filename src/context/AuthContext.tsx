import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Permission } from '../types/database'

export interface Profile {
  id: string
  full_name: string
  role_id: string | null
  role_name: string | null        // shortcut: roles.name
  role_display: string | null     // shortcut: roles.display_name
  permissions: Set<string>        // 'resource:action' set — dùng hasPermission()
  phone: string | null
  avatar_url: string | null
  branch_id: string | null
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<string | null>
  logout: () => Promise<void>
  hasPermission: (resource: string, action: string) => boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null, user: null, profile: null, loading: true,
  login: async () => null,
  logout: async () => {},
  hasPermission: () => false,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, full_name, role_id, phone, avatar_url, branch_id,
        role:roles (
          name, display_name,
          role_permissions ( permission:permissions ( resource, action ) )
        )
      `)
      .eq('id', userId)
      .single()

    if (!data) { setProfile(null); return }

    const roleData = data.role as any
    const perms = new Set<string>(
      (roleData?.role_permissions ?? []).map(
        (rp: { permission: Permission }) => `${rp.permission.resource}:${rp.permission.action}`
      )
    )

    setProfile({
      id: data.id,
      full_name: data.full_name,
      role_id: data.role_id,
      role_name: roleData?.name ?? null,
      role_display: roleData?.display_name ?? null,
      permissions: perms,
      phone: data.phone,
      avatar_url: data.avatar_url,
      branch_id: data.branch_id,
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string, remember = true): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      if (remember) {
        localStorage.setItem('esl_saved_email', email)
      } else {
        localStorage.removeItem('esl_saved_email')
      }
    }
    return error ? error.message : null
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!profile) return false
    if (profile.role_name === 'admin') return true
    return profile.permissions.has(`${resource}:${action}`)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
