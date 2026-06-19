// Supabase Edge Function: paddle-portal
// Creates a Paddle customer portal session for the logged-in user so they can
// manage their subscription (cancel, update payment method, view invoices).
//
// Reuses the PADDLE_API_KEY secret already configured for paddle-webhook.
// Keep "Verify JWT" ON for this function (default) - the caller must be a
// logged-in user; the frontend sends their access token automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY')
const PADDLE_API_BASE = Deno.env.get('PADDLE_API_BASE') || 'https://api.paddle.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization') || ''

    // Identify the caller from their access token.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

    // Look up the Paddle customer id (service role bypasses RLS).
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
    const { data: sub } = await admin
      .from('subscriptions')
      .select('paddle_customer_id')
      .eq('user_id', user.id)
      .not('paddle_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!sub?.paddle_customer_id) return json({ error: 'No billing account found' }, 404)

    // Create a customer portal session.
    const res = await fetch(`${PADDLE_API_BASE}/customers/${sub.paddle_customer_id}/portal-sessions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!res.ok) {
      console.error('Paddle portal session failed', res.status, await res.text())
      return json({ error: 'Could not create portal session' }, 502)
    }

    const data = await res.json()
    const url = data?.data?.urls?.general?.overview
    if (!url) return json({ error: 'No portal URL returned' }, 502)

    return json({ url })
  } catch (e) {
    console.error('portal error', e)
    return json({ error: 'error' }, 500)
  }
})
