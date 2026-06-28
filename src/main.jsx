import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './context/AuthContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ConfigNotice from './components/ConfigNotice.jsx'
import App from './App.jsx'
import './index.css'

// Register the service worker so the app is installable ("Add to Home Screen").
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isSupabaseConfigured ? (
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      ) : (
        <ConfigNotice />
      )}
    </ErrorBoundary>
    <Analytics />
  </StrictMode>,
)
