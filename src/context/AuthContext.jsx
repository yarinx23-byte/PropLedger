import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      // Not configured yet — don't hang on a loading screen.
      setLoading(false)
      return
    }

    // Load any existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Keep state in sync with sign-in / sign-out / token refresh
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase is not configured. Add your .env keys and restart the dev server.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password) {
    if (!supabase) throw new Error('Supabase is not configured. Add your .env keys and restart the dev server.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // When email confirmation is enabled, there is no active session yet.
    return { needsConfirmation: !data.session }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }

  // Send a password-reset email. The link points back to /reset-password.
  async function resetPassword(email) {
    if (!supabase) throw new Error('Supabase is not configured. Add your .env keys and restart the dev server.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  // Set a new password (used after following the recovery link, or while logged in).
  async function updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase is not configured. Add your .env keys and restart the dev server.')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
