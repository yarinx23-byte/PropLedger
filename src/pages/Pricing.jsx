import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import { getPaddle, PRICES } from '../lib/paddle'
import { useAuth } from '../context/AuthContext'
import LegalLinks from '../components/LegalLinks.jsx'

const features = [
  'Unlimited funded accounts',
  'Payouts, fees, resets & splits',
  'Business expenses & real net',
  'Any month or all-time view',
  '7-day free trial',
]

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)

  async function handleCheckout(priceId, planName) {
    track('checkout_start', { plan: planName, loggedIn: Boolean(user) })
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
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-lg">Start free for 7 days. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly */}
          <div className="flex flex-col border border-gray-700 rounded-2xl p-8 bg-gray-900">
            <h2 className="text-xl font-bold mb-2">Monthly</h2>
            <div className="text-4xl font-bold mb-1">$12<span className="text-lg text-gray-400">/mo</span></div>
            <p className="text-gray-400 text-sm mb-6">Billed monthly</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-8">
              {features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <button
              onClick={() => handleCheckout(PRICES.monthly, 'monthly')}
              disabled={loading === 'monthly'}
              className="w-full mt-auto bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-xl transition"
            >
              {loading === 'monthly' ? 'Loading...' : 'Start free trial'}
            </button>
          </div>

          {/* Annual */}
          <div className="relative flex flex-col border border-brand-500 rounded-2xl p-8 bg-gray-900">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <h2 className="text-xl font-bold mb-2">Annual</h2>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold">$99<span className="text-lg text-gray-400">/yr</span></span>
              <span className="text-lg text-gray-500 line-through">$144</span>
            </div>
            <p className="text-emerald-400 text-sm font-medium mb-6">Save 31%</p>
            <ul className="space-y-2 text-sm text-gray-300 mb-8">
              {features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <button
              onClick={() => handleCheckout(PRICES.annual, 'annual')}
              disabled={loading === 'annual'}
              className="w-full mt-auto bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition"
            >
              {loading === 'annual' ? 'Loading...' : 'Start free trial'}
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
