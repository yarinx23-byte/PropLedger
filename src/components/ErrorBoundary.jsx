import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center px-6 py-12">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-8 text-center">
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-400">
              The app hit an unexpected error and stopped rendering.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-left text-xs text-rose-300">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => location.reload()}
              className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
