import Logo from './Logo.jsx'

export default function ConfigNotice() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-8">
          <h1 className="text-xl font-bold text-white">Supabase isn't configured yet</h1>
          <p className="mt-2 text-sm text-slate-400">
            Create a file named <code className="rounded bg-white/10 px-1 py-0.5 text-brand-200">.env</code> in
            the project root (next to <code className="rounded bg-white/10 px-1 py-0.5 text-brand-200">package.json</code>)
            with these two lines:
          </p>
          <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-200">
{`VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
          </pre>
          <p className="mt-4 text-sm text-slate-400">
            Then <span className="font-semibold text-slate-200">fully restart</span> the dev server
            (<code className="rounded bg-white/10 px-1 py-0.5 text-brand-200">npm run dev</code>) — Vite only
            reads <code className="rounded bg-white/10 px-1 py-0.5 text-brand-200">.env</code> at startup.
          </p>
        </div>
      </div>
    </div>
  )
}
