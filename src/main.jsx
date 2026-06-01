import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ConfigNotice from './components/ConfigNotice.jsx'
import App from './App.jsx'
import './index.css'

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
  </StrictMode>,
)
