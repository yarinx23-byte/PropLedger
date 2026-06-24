// Supabase Edge Function: notify-signup
// Called by a Database Webhook on INSERT into public.users (a new signup).
// Posts a message to a Discord channel via an incoming webhook.
//
// Required Edge Function secrets:
//   DISCORD_WEBHOOK_URL - the Discord channel webhook URL
//   NOTIFY_SECRET       - a random string; the DB webhook must send it as the
//                         `x-notify-secret` header so the endpoint can't be abused
//
// Deploy this function with "Verify JWT" OFF (the DB webhook authenticates via
// the shared secret header instead).

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')
const NOTIFY_SECRET = Deno.env.get('NOTIFY_SECRET')

Deno.serve(async (req) => {
  try {
    if (NOTIFY_SECRET && req.headers.get('x-notify-secret') !== NOTIFY_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }
    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL not set')
      return new Response('Not configured', { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const record = body?.record ?? {}
    const email = record.email ?? 'unknown email'
    const when = record.created_at ?? new Date().toISOString()

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'PropLedger',
        content: `🎉 **New signup!**\n📧 ${email}\n🕒 ${when}`,
      }),
    })
    if (!res.ok) {
      console.error('Discord webhook failed', res.status, await res.text())
      return new Response('Discord error', { status: 502 })
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('notify-signup error:', e)
    return new Response('error', { status: 500 })
  }
})
