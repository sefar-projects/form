import { useEffect, useMemo, useState } from 'react'
import { createAccessCode, getAccessCodes } from '../../services/accessCodeService'
import { supabase } from '../../lib/supabase'
import { translations } from '../../i18n/translations'
import { exportSubmissionPdf } from '../../utils/exportPdf'

function DashboardPanel({ language = 'en', onBack, onLogout }) {
  const t = translations[language] || translations.en
  const [customerName, setCustomerName] = useState('')
  const [codes, setCodes] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    const rows = await getAccessCodes()
    setCodes(rows)

    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (!error) {
      setSubmissions(data || [])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!customerName.trim()) return

    setLoading(true)
    try {
      const created = await createAccessCode(customerName.trim())
      setMessage(`${t.generatedCodeLabel}: ${created.code}`)
      setCustomerName('')
      await loadData()
    } catch (error) {
      setMessage(error.message || 'Unable to create code')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code)
    setMessage(`${t.copyCodeButton}: ${code}`)
  }

  const exportPdf = () => {
    window.print()
  }

  const usedSubmissions = useMemo(() => submissions.filter((row) => row.access_code), [submissions])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-slate-800">{t.dashboardTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.dashboardSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportPdf} className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700">
              {t.exportPdfButton}
            </button>
            <button type="button" onClick={onBack} className="rounded-full border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
              {t.backToFormButton}
            </button>
            <button type="button" onClick={onLogout} className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
              {t.adminLogoutButton}
            </button>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="flex-1 rounded-full border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700"
            placeholder={t.customerNamePlaceholder}
          />
          <button type="submit" disabled={loading} className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
            {loading ? t.generating : t.generateCodeButton}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-sky-700">{message}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-800">{t.accessCodeTitle}</h4>
          <div className="mt-4 space-y-3">
            {codes.map((row) => (
              <div key={row.id} className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{row.customer_name || '—'}</p>
                    <p className="text-xs text-slate-500">{row.code}</p>
                  </div>
                  <button type="button" onClick={() => copyCode(row.code)} className="text-sm font-semibold text-sky-700">
                    {t.copyCodeButton}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{row.used ? t.usedLabel : t.activeLabel}</span>
                  <span>•</span>
                  <span>{new Date(row.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-800">{t.submissionsLabel}</h4>
          <p className="mt-2 text-sm text-slate-500">{usedSubmissions.length} {t.submissionsLabel.toLowerCase()}</p>
          <div className="mt-4 space-y-3">
            {usedSubmissions.length === 0 ? (
              <p className="text-sm text-slate-500">{t.noSubmissions}</p>
            ) : (
              usedSubmissions.map((row) => (
                <div key={row.id} className="rounded-2xl border border-sky-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—'}</p>
                      <p className="text-xs text-slate-500">{row.email || '—'} • {row.access_code || '—'}</p>
                      <p className="mt-2 text-xs text-slate-500">{row.selected_countries?.join(', ') || '—'}</p>
                    </div>
                    <button type="button" onClick={() => exportSubmissionPdf(row, language)} className="text-sm font-semibold text-sky-700">
                      {t.exportPdfButton}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPanel
