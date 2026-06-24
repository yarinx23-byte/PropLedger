import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  // Which user id the data in `subscription` belongs to. `undefined` means we
  // have not resolved anything yet. This lets us derive `loading` with zero
  // gaps: the instant `user` changes, the held data no longer matches, so we
  // report loading=true in the SAME render - before any effect runs. Without
  // this, there is a render where auth is done but the sub fetch has not
  // started yet, and ProtectedRoute briefly sees isActive=false -> /pricing
  // (the "reload bounces me to pricing" bug, most visible on mobile refresh).
  const [loadedUserId, setLoadedUserId] = useState(undefined)

  // Re-read the subscription on demand (used for polling on the Welcome page).
  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoadedUserId(null)
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
    setLoadedUserId(user.id)
  }, [user])

  useEffect(() => {
    refresh()
    if (!user) return

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

  // Still loading while a logged-in user's data hasn't been resolved for them.
  const loading = user ? loadedUserId !== user.id : false
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return { subscription, loading, isActive, refresh }
}
