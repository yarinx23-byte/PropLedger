import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY')
const PADDLE_API_BASE = Deno.env.get('PADDLE_API_BASE') || 'https://api.paddle.com'

// Known price IDs -> plan name (env vars first, hardcoded fallback).
const priceToPlan: Record<string, string> = {
  [Deno.env.get('PRICE_EARLY_BIRD') || 'pri_01ktgzpjqt9g43z4d7hjgjex1m']: 'early_bird',
  [Deno.env.get('PRICE_MONTHLY') || 'pri_01ktgzqt4tcmj466dgensn4p1a']: 'monthly',
  [Deno.env.get('PRICE_ANNUAL') || 'pri_01ktgzs2bf6kf2h054cdbk16s0']: 'annual',
}

// Ask Paddle for the customer's email (subscription events don't include it).
async function emailFromCustomer(customerId: string): Promise<string | null> {
  if (!PADDLE_API_KEY) {
    console.warn('PADDLE_API_KEY not set - cannot look up customer email')
    return null
  }
  const res = await fetch(`${PADDLE_API_BASE}/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${PADDLE_API_KEY}` },
  })
  if (!res.ok) {
    console.error('Paddle customer fetch failed', res.status, await res.text())
    return null
  }
  const json = await res.json()
  return json?.data?.email ?? null
}

// Find a Supabase user id by email (no getUserByEmail in v2).
async function userIdFromEmail(email: string): Promise<string | null> {
  const { data: pu } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (pu?.id) return pu.id
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const match = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return match?.id ?? null
}

serve(async (req) => {
  try {
    const body = await req.json()
    const eventType = body.event_type
    const data = body.data

    if (!data) return new Response('No data', { status: 200 })

    const customerId = data.customer_id
    const subscriptionId = data.id
    const status = data.status
    const priceId = data.items?.[0]?.price?.id
    const currentPeriodEnd = data.current_billing_period?.ends_at
    const plan = priceToPlan[priceId] || 'monthly'

    // Resolve the user: custom_data.user_id first, then email via Paddle API.
    let userId: string | null = data.custom_data?.user_id ?? null
    if (!userId && customerId) {
      const email = await emailFromCustomer(customerId)
      if (email) userId = await userIdFromEmail(email)
    }

    if (!userId) {
      // Ack so Paddle stops retrying; log for investigation.
      console.warn('Could not map subscription to a user', subscriptionId, customerId)
      return new Response('No user mapping', { status: 200 })
    }

    if (
      eventType === 'subscription.created' ||
      eventType === 'subscription.updated' ||
      eventType === 'subscription.activated'
    ) {
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        paddle_subscription_id: subscriptionId,
        paddle_customer_id: customerId,
        plan,
        status: status === 'trialing' ? 'trialing' : 'active',
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'paddle_subscription_id' })
      if (error) throw error
    }

    if (eventType === 'subscription.canceled') {
      const { error } = await supabase.from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('paddle_subscription_id', subscriptionId)
      if (error) throw error
    }

    console.log(`Synced ${subscriptionId} (${status}) for user ${userId}`)
    return new Response('OK', { status: 200 })
  } catch (e) {
    console.error('Webhook error:', e)
    return new Response('error', { status: 500 })
  }
})
