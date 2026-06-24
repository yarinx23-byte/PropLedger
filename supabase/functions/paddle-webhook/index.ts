import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY')
const PADDLE_API_BASE = Deno.env.get('PADDLE_API_BASE') || 'https://api.paddle.com'
const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET')
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')

// Welcome-email config (Resend).
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const WELCOME_FROM = Deno.env.get('WELCOME_FROM') || 'PropLedger <welcome@propledgerhq.co>'
const APP_URL = Deno.env.get('APP_URL') || 'https://propledgerhq.co'
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'propledgerhq@gmail.com'

// Best-effort Discord ping (never blocks/breaks the webhook).
async function notifyDiscord(message: string) {
  if (!DISCORD_WEBHOOK_URL) return
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'PropLedger', content: message }),
    })
  } catch (e) {
    console.error('Discord notify failed', e)
  }
}

// Branded welcome email, sent once when a subscription is first created.
// Best-effort: a failure here never breaks the webhook.
async function sendWelcomeEmail(email: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - skipping welcome email')
    return
  }
  const html = welcomeHtml()
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: WELCOME_FROM,
        to: [email],
        subject: 'Welcome to PropLedger 🎉',
        html,
      }),
    })
    if (!res.ok) console.error('Resend welcome email failed', res.status, await res.text())
  } catch (e) {
    console.error('Welcome email error', e)
  }
}

function welcomeHtml(): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr><td style="background:linear-gradient(135deg,#ec4899,#7c3aed);padding:28px 32px;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PropLedger</div>
          </td></tr>
          <tr><td style="padding:36px 32px 8px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;letter-spacing:-0.5px;">You're in. Welcome aboard! 🎉</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">
              Thanks for subscribing. PropLedger gives you one clean ledger for every funded account &mdash; so you always know your <strong>real net profit</strong> after fees, resets, and payout splits.
            </p>
            <p style="margin:0 0 12px;font-size:16px;font-weight:700;">Get started in 3 steps:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr><td style="padding:6px 0;font-size:15px;line-height:1.5;color:#334155;"><strong style="color:#7c3aed;">1.</strong>&nbsp; Add your funded accounts (firm, size, challenge fee)</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;line-height:1.5;color:#334155;"><strong style="color:#7c3aed;">2.</strong>&nbsp; Log payouts, resets &amp; recurring business expenses</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;line-height:1.5;color:#334155;"><strong style="color:#7c3aed;">3.</strong>&nbsp; See your true P&amp;L for any month or all-time</td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr><td style="border-radius:10px;background:linear-gradient(135deg,#ec4899,#7c3aed);">
                <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">Go to your dashboard &rarr;</a>
              </td></tr>
            </table>
            <p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:#64748b;">
              Need a hand or have feedback? Just reply to this email, or reach us at
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#7c3aed;text-decoration:none;">${SUPPORT_EMAIL}</a>. We read everything.
            </p>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">PropLedger &middot; <a href="${APP_URL}" style="color:#94a3b8;text-decoration:none;">propledgerhq.co</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

// Verify the Paddle-Signature header (HMAC-SHA256 of `${ts}:${rawBody}`).
// Returns true if no secret is configured yet, so deploying this code does not
// break the live webhook before the secret is added.
async function verifyPaddleSignature(rawBody: string, header: string | null): Promise<boolean> {
  if (!PADDLE_WEBHOOK_SECRET) {
    console.warn('PADDLE_WEBHOOK_SECRET not set - skipping signature verification')
    return true
  }
  if (!header) return false

  const parts = Object.fromEntries(header.split(';').map((kv) => kv.split('=')))
  const ts = parts['ts']
  const h1 = parts['h1']
  if (!ts || !h1) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PADDLE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}:${rawBody}`))
  const computed = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return computed === h1
}

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
    // Read the raw body first - signature verification needs the exact bytes.
    const rawBody = await req.text()
    const valid = await verifyPaddleSignature(rawBody, req.headers.get('Paddle-Signature'))
    if (!valid) {
      console.warn('Invalid Paddle signature - rejecting request')
      return new Response('Invalid signature', { status: 401 })
    }

    const body = JSON.parse(rawBody)
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
    let email: string | null = null
    if (!userId && customerId) {
      email = await emailFromCustomer(customerId)
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

    // On a brand-new subscription: ping Discord + send the welcome email.
    if (eventType === 'subscription.created') {
      if (!email && customerId) email = await emailFromCustomer(customerId)
      await notifyDiscord(`💰 **New subscriber!**\n📧 ${email ?? 'unknown'}\n📋 ${plan} · ${status}`)
      if (email) await sendWelcomeEmail(email)
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
