import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    // Reset to loading whenever the user changes, so ProtectedRoute waits for
    // the fresh result instead of acting on a stale `loading = false`.
    setLoading(true)

    async function fetchSubscription() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()

      if (error) {
        setSubscription(null)
      } else {
        setSubscription(data)
      }
      setLoading(false)
    }

    fetchSubscription()

    // עדכון real-time
    const channel = supabase
      .channel('subscription-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchSubscription()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return { subscription, loading, isActive }
}