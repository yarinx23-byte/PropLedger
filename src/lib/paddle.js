import { initializePaddle } from '@paddle/paddle-js'

let paddleInstance = null

export async function getPaddle() {
  if (paddleInstance) return paddleInstance

  paddleInstance = await initializePaddle({
    environment: import.meta.env.VITE_PADDLE_ENV || 'sandbox',
    token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
  })

  return paddleInstance
}

export const PRICES = {
  earlyBird: import.meta.env.VITE_PADDLE_PRICE_EARLY_BIRD,
  monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY,
  annual: import.meta.env.VITE_PADDLE_PRICE_ANNUAL,
}