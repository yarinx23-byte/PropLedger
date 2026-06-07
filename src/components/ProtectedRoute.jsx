import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { isActive, loading: subLoading } = useSubscription()

  if (authLoading || subLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isActive) {
    return <Navigate to="/pricing" replace />
  }

  return children
}