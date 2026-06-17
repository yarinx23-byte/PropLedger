import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPaddle, PRICES } from '../lib/paddle'
import { useAuth } from '../context/AuthContext'
import LegalLinks from '../components/LegalLinks.jsx'

const EARLY_BIRD_LIMIT = 100

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [earlyBirdCount, setEarlyBirdCount] = useState(0)
  const [loading, setLoading] = useState(null)

  useEffect(() => {
    // TODO: שליפת מספר מנויי Early Bird מ-Supabase
    setEarlyBirdCount(12) // זמני
  }, [])

  const earlyBirdAvailable = earlyBirdCount < EARLY_BIRD_LIMIT
  const earlyBirdLeft = EARLY_BIRD_LIMIT - earlyBirdCount

  async function handleCheckout(priceId, planName) {
    if (!user) {
      navigate('/signup')
      return
    }

    setLoading(planName)
    try {
      const paddle = await getPaddle()
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id },
        settings: {
          successUrl: `${window.location.origin}/welcome`,
        },
      })
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-400 text-lg">Start free for 7 days. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Early Bird */}
          {earlyBirdAvailable && (
            <div className="relative border border-yellow-500 rounded-2xl p-8 bg-gray-900">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                🔥 EARLY BIRD — {earlyBirdLeft} left
              </div>
              <h2 className="text-xl font-bold mb-2">Early Bird</h2>
              <div className="text-4xl font-bold mb-1">$12<span className="text-lg text-gray-400">/mo</span></div>
              <p className="text-gray-400 text-sm mb-6">Locked in forever</p>
              <ul className="space-y-2 text-sm text-gray-300 mb-8">
                <li>✓ Unlimited trades</li>
                <li>✓ All analytics</li>
                <li>✓ Priority support</li>
                <li>✓ 7-day free trial</li>
              </ul>
              <button
                onClick={() => handleCheckout(PRICES.earlyBird, 'earlyBird')}
                disabled={loading === 'earlyBird'}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition"
              >
                {loading === 'earlyBird' ? 'Loading...' : 'Start Free Trial'}
              </button>
            </div>
          )}

          {/* Monthly */}
          <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900">
            <h2 className="text-xl font-bold mb-2">Monthly</h2>
            <div className="text-4xl font-bold mb-1">$19<span className="text-lg text-gray-400">/mo</span></div>
            <p className="text-gray-400 text-sm mb-6">Billed monthly</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-8">
              <li>✓ Unlimited trades</li>
              <li>✓ All analytics</li>
              <li>✓ Email support</li>
              <li>✓ 7-day free trial</li>
            </ul>
            <button
              onClick={() => handleCheckout(PRICES.monthly, 'monthly')}
              disabled={loading === 'monthly'}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-xl transition"
            >
              {loading === 'monthly' ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>

          {/* Annual */}
          <div className="relative border border-blue-500 rounded-2xl p-8 bg-gray-900">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <h2 className="text-xl font-bold mb-2">Annual</h2>
            <div className="text-4xl font-bold mb-1">$149<span className="text-lg text-gray-400">/yr</span></div>
            <p className="text-gray-400 text-sm mb-6">Save $79 vs monthly</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-8">
              <li>✓ Unlimited trades</li>
              <li>✓ All analytics</li>
              <li>✓ Priority support</li>
              <li>✓ 7-day free trial</li>
            </ul>
            <button
              onClick={() => handleCheckout(PRICES.annual, 'annual')}
              disabled={loading === 'annual'}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition"
            >
              {loading === 'annual' ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <footer className="mt-16 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <LegalLinks className="mb-4" />
          © {new Date().getFullYear()} PropLedger. All rights reserved.
        </footer>
      </div>
    </div>
  )
}