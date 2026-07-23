import { useEffect, useMemo, useState } from 'react'
import { createAccessCode, getAccessCodes } from '../../services/accessCodeService'
import { fetchUniversityCriteria } from '../../services/supabaseService'
import { supabase } from '../../lib/supabase'
import { translations } from '../../i18n/translations'
import { calculateChances, suggestBestUniversity } from '../../utils/chancesCalculator'
import { exportSubmissionPdf, exportClientPdf } from '../../utils/exportPdf'

function parseObjectValue(value) {
  if (!value) return {}
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function parseSelectedCountries(value) {
  if (Array.isArray(value)) return value

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

function buildLeadDataFromSubmission(row) {
  const countrySpecificData = parseObjectValue(row.country_specific_data)
  const academicMeta = countrySpecificData?._meta?.academic || {}

  return {
    gpa: row.gpa,
    english_level: row.english_level,
    selected_countries: parseSelectedCountries(row.selected_countries),
    degree_type: row.degree_type,
    budget_availability: row.budget_availability,
    date_of_birth: row.date_of_birth,
    last_degree_date: row.last_degree_date || academicMeta.lastDegreeDate,
    studied_in_english_before: row.studied_in_english_before ?? academicMeta.studiedInEnglishBefore,
    country_specific_data: countrySpecificData,
  }
}

function getRecommendationScoreOutOf10(recommendation) {
  const raw = Number(recommendation?.recommendation_score)
  if (!Number.isFinite(raw)) return null

  // Backward compatibility for older saved values that used a /100 scale.
  if (raw > 10) {
    return Number((raw / 10).toFixed(1))
  }

  return Number(raw.toFixed(1))
}

function DashboardPanel({ language = 'en', onBack, onLogout }) {
  const t = translations[language] || translations.en
  const [customerName, setCustomerName] = useState('')
  const [codes, setCodes] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isRecomputing, setIsRecomputing] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null)

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

  const getStudyPathBadgeClass = (score) => {
    const numericScore = Number(score)
    if (!Number.isFinite(numericScore)) return 'bg-slate-100 text-slate-700'
    if (numericScore >= 7) return 'bg-emerald-100 text-emerald-700'
    if (numericScore >= 5) return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-700'
  }

  const getRecommendationForRow = (row) => {
    const countrySpecificData = parseObjectValue(row.country_specific_data)
    return countrySpecificData?._meta?.recommendation || null
  }

  const recomputeLeadScores = async () => {
    if (usedSubmissions.length === 0) {
      setMessage('No submissions found to recompute.')
      return
    }

    setIsRecomputing(true)
    setMessage('Recomputing lead scores and recommendations...')

    try {
      const rules = await fetchUniversityCriteria()
      let updatedCount = 0

      for (const row of usedSubmissions) {
        const leadData = buildLeadDataFromSubmission(row)
        const aiScore = Number(row.study_path_score ?? 0)

        const refreshedScore = calculateChances(leadData, rules, aiScore)
        const recommendation = suggestBestUniversity(leadData, rules, refreshedScore)

        const countrySpecificData = parseObjectValue(row.country_specific_data)
        const updatedCountryData = {
          ...countrySpecificData,
          _meta: {
            ...(countrySpecificData._meta || {}),
            recommendation,
          },
        }

        const { error } = await supabase
          .from('leads')
          .update({
            agency_internal_score: refreshedScore,
            country_specific_data: updatedCountryData,
          })
          .eq('id', row.id)

        if (!error) {
          updatedCount += 1
        }
      }

      await loadData()
      setMessage(`Recomputed ${updatedCount} lead(s) with fresh scoring and recommendation.`)
    } catch (error) {
      setMessage(error.message || 'Unable to recompute lead scores right now.')
    } finally {
      setIsRecomputing(false)
    }
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
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-sm text-slate-500">{usedSubmissions.length} {t.submissionsLabel.toLowerCase()}</p>
            <button
              type="button"
              onClick={recomputeLeadScores}
              disabled={isRecomputing}
              className="rounded-full border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRecomputing ? 'Recomputing...' : 'Recompute old leads'}
            </button>
          </div>
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
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Study path score:</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStudyPathBadgeClass(row.study_path_score)}`}>
                          {row.study_path_score ?? 'N/A'}
                        </span>
                      </div>
                      {getRecommendationForRow(row) ? (
                        <p className="mt-2 text-xs text-slate-600">
                          Suggested: {getRecommendationForRow(row).country} - {getRecommendationForRow(row).university}
                          {getRecommendationScoreOutOf10(getRecommendationForRow(row)) !== null
                            ? ` (${getRecommendationScoreOutOf10(getRecommendationForRow(row))}/10)`
                            : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmissionId((current) => (current === row.id ? null : row.id))}
                        className="text-sm font-semibold text-slate-700"
                      >
                        {selectedSubmissionId === row.id ? 'Hide details' : 'View details'}
                      </button>
                      <button type="button" onClick={() => exportSubmissionPdf(row, language)} className="text-sm font-semibold text-sky-700">
                        {t.exportPdfButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => exportClientPdf(row, language)}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {t.sendClientProspectusButton}
                      </button>
                    </div>
                  </div>

                  {selectedSubmissionId === row.id ? (
                    <div className="mt-3 rounded-xl border border-sky-100 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">AI Study Path Evaluation</p>
                      <p className="mt-2 text-sm text-slate-700">{row.study_path_explanation || 'No AI explanation available.'}</p>
                      {getRecommendationForRow(row) ? (
                        <>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested Best Option</p>
                          <p className="mt-2 text-sm text-slate-700">
                            {getRecommendationForRow(row).country} - {getRecommendationForRow(row).university}
                            {' '}
                            ({getRecommendationScoreOutOf10(getRecommendationForRow(row)) ?? 'N/A'}/10)
                          </p>
                          <p className="mt-2 text-xs text-slate-600">
                            {(getRecommendationForRow(row).reasons || []).join(' | ')}
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : null}
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
