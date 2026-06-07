import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const body = await req.json()
  const eventType = body.event_type
  const data = body.data

  if (!data) {
    return new Response('No data', { status: 400 })
  }

  const customerId = data.customer_id
  const subscriptionId = data.id
  const status = data.status
  const priceId = data.items?.[0]?.price?.id
  const currentPeriodEnd = data.current_billing_period?.ends_at

  // מיפוי price ID לשם תוכנית
  const priceToplan: Record<string, string> = {
    [Deno.env.get('PRICE_EARLY_BIRD') || '']: 'early_bird',
    [Deno.env.get('PRICE_MONTHLY') || '']: 'monthly',
    [Deno.env.get('PRICE_ANNUAL') || '']: 'annual',
  }
  const plan = priceToplan[priceId] || 'monthly'

  // מציאת המשתמש לפי אימייל
  const customerEmail = data.customer?.email || body.data?.customer?.email
  
  if (!customerEmail) {
    return new Response('No email', { status: 400 })
  }

  const { data: userData } = await supabase.auth.admin.getUserByEmail(customerEmail)
  const userId = userData?.user?.id

  if (!userId) {
    return new Response('User not found', { status: 404 })
  }

  if (
    eventType === 'subscription.created' ||
    eventType === 'subscription.updated' ||
    eventType === 'subscription.activated'
  ) {
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      paddle_subscription_id: subscriptionId,
      paddle_customer_id: customerId,
      plan,
      status: status === 'trialing' ? 'trialing' : 'active',
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'paddle_subscription_id' })
  }

  if (eventType === 'subscription.canceled') {
    await supabase.from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('paddle_subscription_id', subscriptionId)
  }

  return new Response('OK', { status: 200 })
})