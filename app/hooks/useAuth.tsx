import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session, User, AuthChangeEvent, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  error: AuthError | null
  signInWithPassword: typeof supabase.auth.signInWithPassword
  signUp: typeof supabase.auth.signUp
  signOut: typeof supabase.auth.signOut
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    setIsLoading(true)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err)
        setIsLoading(false)
      })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)

        // Clear error on successful auth event
        if (session) {
          setError(null)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    isLoading,
    error,
    signInWithPassword: (credentials: Parameters<typeof supabase.auth.signInWithPassword>[0]) => {
      setError(null) // Clear previous errors
      return supabase.auth.signInWithPassword(credentials)
    },
    signUp: (credentials: Parameters<typeof supabase.auth.signUp>[0]) => {
      setError(null) // Clear previous errors
      return supabase.auth.signUp(credentials)
    },
    signOut: () => {
      setError(null) // Clear previous errors
      return supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
