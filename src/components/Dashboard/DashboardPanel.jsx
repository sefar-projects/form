import { useEffect, useMemo, useState } from 'react'
import { createAccessCode, getAccessCodes } from '../../services/accessCodeService'
import { evaluateStudyPath, fetchUniversityCriteria } from '../../services/supabaseService'
import { supabase } from '../../lib/supabase'
import { translations } from '../../i18n/translations'
import { calculateChances, compareWithAllUniversities, suggestBestUniversity } from '../../utils/chancesCalculator'
import { normalizeLeadData } from '../../utils/normalizeLead'
import { exportSubmissionPdf, exportClientPdf, exportUniversityMatchPdf } from '../../utils/exportPdf'

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
  const subjectScores = academicMeta.subject_scores || {}

  return {
    gpa: row.gpa,
    english_level: row.english_level,
    selected_countries: parseSelectedCountries(row.selected_countries),
    degree_type: row.degree_type,
    budget_availability: row.budget_availability,
    date_of_birth: row.date_of_birth,
    last_degree_date: row.last_degree_date || academicMeta.lastDegreeDate,
    studied_in_english_before: row.studied_in_english_before ?? academicMeta.studiedInEnglishBefore,
    subject_scores: {
      m_t: subjectScores.m_t,
      phy: subjectScores.phy,
      se: subjectScores.se,
      lng: subjectScores.lng,
      eco: subjectScores.eco,
      geo_his: subjectScores.geo_his,
    },
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

function getLeadDisplayName(lead) {
  const fullName = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
  return fullName || lead.email || lead.access_code || 'Unknown lead'
}

function DashboardPanel({ language = 'en', onBack, onLogout }) {
  const t = translations[language] || translations.en
  const [customerName, setCustomerName] = useState('')
  const [codes, setCodes] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [universityRules, setUniversityRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [isReevaluating, setIsReevaluating] = useState(false)
  const [reevaluationProgress, setReevaluationProgress] = useState('')
  const [message, setMessage] = useState('')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null)
  const [matchResults, setMatchResults] = useState({})
  const [matchingLeadId, setMatchingLeadId] = useState(null)

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
    const loadUniversityRules = async () => {
      try {
        const rules = await fetchUniversityCriteria()
        setUniversityRules(rules)
      } catch {
        setUniversityRules([])
      }
    }

    loadUniversityRules()
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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleReevaluateSingleLead = async (lead) => {
    if (!lead?.id) {
      setMessage('Invalid lead provided for re-evaluation.')
      return
    }

    setIsReevaluating(true)
    setMessage('Re-evaluating lead...')
    setReevaluationProgress(`Processing 1/1: ${getLeadDisplayName(lead)}`)

    try {
      const rawLeadData = buildLeadDataFromSubmission(lead)
      const normalizedLead = normalizeLeadData(rawLeadData)
      const { data, error: functionError } = await supabase.functions.invoke('evaluate-study-path', {
        body: normalizedLead,
      })

      if (functionError) {
        throw functionError
      }

      const updatePayload = {
        study_path_score: data?.relevance_score ?? null,
        study_path_explanation: data?.reasoning ?? null,
      }

      const { error: updateError } = await supabase.from('leads').update(updatePayload).eq('id', lead.id)
      if (updateError) {
        throw updateError
      }

      await loadData()
      setMessage('Lead re-evaluated successfully.')
    } catch (error) {
      setMessage(error.message || 'Unable to re-evaluate the selected lead.')
    } finally {
      setIsReevaluating(false)
      setReevaluationProgress('')
    }
  }

  const handleRecomputeOldLeads = async () => {
    const confirmed = window.confirm('Are you sure you want to re-evaluate all existing leads? This will sequentially process each lead.')
    if (!confirmed) {
      return
    }

    setIsReevaluating(true)
    setMessage('Starting re-evaluation for all leads...')
    setReevaluationProgress('Preparing leads...')

    try {
      const universityRules = await fetchUniversityCriteria()
      const { data: leads, error: fetchError } = await supabase.from('leads').select('*')
      if (fetchError) {
        throw fetchError
      }

      const allLeads = Array.isArray(leads) ? leads : []
      const total = allLeads.length

      if (total === 0) {
        setMessage('No leads found to re-evaluate.')
        setReevaluationProgress('')
        return
      }

      let updatedCount = 0

      for (let index = 0; index < total; index += 1) {
        const lead = allLeads[index]
        const leadName = getLeadDisplayName(lead)
        setReevaluationProgress(`Processing ${index + 1}/${total}: ${leadName}`)

        const existingCountryData = parseObjectValue(lead.country_specific_data)
        const previousStudyPath = existingCountryData?._meta?.studyPath || {}

        const rawLeadData = {
          gpa: lead.gpa,
          english_level: lead.english_level,
          selected_countries: parseSelectedCountries(lead.selected_countries),
          degree_type: lead.degree_type,
          budget_availability: lead.budget_availability,
          date_of_birth: lead.date_of_birth,
          last_degree_date: lead.last_degree_date,
          studied_in_english_before: lead.studied_in_english_before,
          country_specific_data: existingCountryData,
          previousDegree: previousStudyPath.previousDegree || '',
          targetDegree: previousStudyPath.targetDegree || '',
        }

        const normalizedLead = normalizeLeadData(rawLeadData)
        const aiResult = await evaluateStudyPath(normalizedLead)

        const scorePayload = calculateChances(
          normalizedLead,
          universityRules,
          aiResult.relevance_score,
        )

        const recommendation = suggestBestUniversity(
          normalizedLead,
          universityRules,
          scorePayload,
        )

        const updatedCountryData = {
          ...existingCountryData,
          _meta: {
            ...existingCountryData._meta,
            studyPath: {
              ...previousStudyPath,
              ...aiResult,
            },
            recommendation,
          },
        }

        const updatePayload = {
          study_path_score: aiResult.relevance_score ?? null,
          study_path_explanation: aiResult.reasoning ?? null,
          agency_internal_score: scorePayload,
          country_specific_data: updatedCountryData,
        }

        const { error: updateError } = await supabase.from('leads').update(updatePayload).eq('id', lead.id)
        if (!updateError) {
          updatedCount += 1
        } else {
          console.error('Supabase update error for lead:', lead.id, updateError)
        }

        await delay(300)
      }

      await loadData()
      setMessage(`Recomputed ${updatedCount} of ${total} lead(s).`)
      alert(`Recomputed ${updatedCount} of ${total} lead(s).`)
    } catch (error) {
      setMessage(error.message || 'Unable to re-evaluate old leads right now.')
    } finally {
      setIsReevaluating(false)
      setReevaluationProgress('')
    }
  }

  const runFullUniversityMatch = async (row) => {
    if (!row?.id) {
      setMessage('Invalid lead provided for university matching.')
      return
    }

    const rules = universityRules.length > 0 ? universityRules : await fetchUniversityCriteria()
    if (!Array.isArray(rules) || rules.length === 0) {
      setMessage('University criteria are unavailable. Please try again later.')
      return
    }

    setMatchingLeadId(row.id)
    setMessage(`Running full university match for ${getLeadDisplayName(row)}...`)

    try {
      const rawLeadData = buildLeadDataFromSubmission(row)
      const results = compareWithAllUniversities(rawLeadData, rules)
      setMatchResults((current) => ({ ...current, [row.id]: results }))
      setMessage(`University match complete for ${getLeadDisplayName(row)}.`)
    } catch (error) {
      setMessage(error?.message || 'Unable to run full university match.')
    } finally {
      setMatchingLeadId(null)
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
              onClick={handleRecomputeOldLeads}
              disabled={isReevaluating}
              className="rounded-full border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReevaluating ? (reevaluationProgress || 'Processing...') : 'Recompute all leads'}
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
                      <button
                        type="button"
                        onClick={() => handleReevaluateSingleLead(row)}
                        disabled={isReevaluating}
                        className="rounded-full border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isReevaluating && reevaluationProgress.includes(getLeadDisplayName(row)) ? 'Recomputing...' : 'Recompute profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => runFullUniversityMatch(row)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        {matchingLeadId === row.id ? t.runningFullUniversityMatchButton : t.runFullUniversityMatchButton}
                      </button>
                      {matchResults[row.id] && matchResults[row.id].length > 0 ? (
                        <button
                          type="button"
                          onClick={() => exportUniversityMatchPdf(row, matchResults[row.id], language)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          {t.exportUniversityMatchPdfButton}
                        </button>
                      ) : null}
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

                      {matchResults[row.id] ? (
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <h3 className="text-sm font-semibold text-slate-800">{t.universityMatchResultsTitle}</h3>
                          <div className="mt-3 min-w-[720px]">
                            <table className="w-full border-collapse text-left text-sm">
                              <thead>
                                <tr>
                                  <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{t.universityNameColumn}</th>
                                  <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{t.countryColumn}</th>
                                  <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{t.matchPercentageColumn}</th>
                                  <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{t.statusColumn}</th>
                                  <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">{t.missingRequirementsColumn}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {matchResults[row.id].map((result) => (
                                  <tr key={`${result.university}-${result.country}`} className="border-b border-slate-200 bg-white last:border-0">
                                    <td className="px-3 py-3 text-slate-700">{result.university}</td>
                                    <td className="px-3 py-3 text-slate-700">{result.country}</td>
                                    <td className="px-3 py-3 font-semibold text-slate-800">{result.matchPercentage}%</td>
                                    <td className="px-3 py-3">
                                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${result.isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {result.isMatch ? t.eligibleLabel : t.notEligibleLabel}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-slate-700">
                                      {result.missingRequirements.length > 0 ? result.missingRequirements.join(' • ') : 'None'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
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
