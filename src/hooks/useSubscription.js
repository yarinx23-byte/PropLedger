import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  // Re-read the subscription on demand (used for polling on the Welcome page).
  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }
    // A user can have more than one row over time (e.g. an old canceled sub
    // plus a new one). Take the most recently updated active/trialing row.
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
    setSubscription(error || !data?.length ? null : data[0])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    // Reset to loading whenever the user changes, so ProtectedRoute waits for
    // the fresh result instead of acting on a stale `loading = false`.
    setLoading(true)
    refresh()

    // Real-time updates (best-effort; polling on /welcome is the safety net).
    const channel = supabase
      .channel('subscription-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, () => refresh())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, refresh])

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return { subscription, loading, isActive, refresh }
}