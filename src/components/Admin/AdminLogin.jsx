import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { translations } from '../../i18n/translations'

function AdminLogin({ language = 'en', onLogin }) {
  const t = translations[language] || translations.en
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      if (data?.user) onLogin(data.user)
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-sky-100 bg-white p-8 shadow-[0_20px_80px_-20px_rgba(14,165,233,0.35)]">
        <h3 className="text-2xl font-semibold text-slate-800">{t.adminLoginTitle}</h3>
        <p className="mt-2 text-sm text-slate-500">{t.dashboardSubtitle}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.adminEmailLabel}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-full border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.adminPasswordLabel}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-full border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700" />
          </label>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
            {loading ? t.generating : t.adminLoginButton}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
