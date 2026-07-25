/**
 * Normalizes lead data so the AI Engine and Math Calculator receive standardized values.
 */
function parseBudgetToNumber(value) {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value

  const normalized = `${value}`.replace(/,/g, '')
  const values = normalized.match(/\d+(?:\.\d+)?/g)
  if (!values || values.length === 0) return 0

  const maxValue = Math.max(...values.map((item) => Number(item)))
  return Number.isFinite(maxValue) ? maxValue : 0
}

function normalizeGpaTo20Scale(rawGpa) {
  const numericGpa = Number(rawGpa)
  if (!Number.isFinite(numericGpa) || numericGpa <= 0) return 0

  if (numericGpa <= 4) return Number((numericGpa * 5).toFixed(2))
  if (numericGpa <= 5) return Number((numericGpa * 4).toFixed(2))
  if (numericGpa <= 20) return Number(numericGpa.toFixed(2))
  if (numericGpa <= 100) return Number((numericGpa / 5).toFixed(2))

  return 20
}

function parseIeltsEquivalent(rawValue) {
  const normalized = `${rawValue || ''}`.trim().toLowerCase()
  if (!normalized) return 4.0

  const numericMatch = normalized.match(/(\d+(?:\.\d+)?)/)
  if (numericMatch) {
    const parsed = Number(numericMatch[1])
    if (normalized.includes('ielts')) {
      return Math.min(9, Math.max(0, parsed))
    }

    if (normalized.includes('toefl')) {
      if (parsed >= 120) return 9
      if (parsed >= 100) return 7
      if (parsed >= 90) return 6
      if (parsed >= 80) return 5.5
      return 4.5
    }

    if (normalized.includes('pte')) {
      if (parsed >= 80) return 7
      if (parsed >= 65) return 6
      if (parsed >= 50) return 5
      return 4.5
    }

    if (parsed <= 9) {
      return Math.min(9, Math.max(0, parsed))
    }
  }

  if (normalized.includes('advanced') || normalized.includes('c1') || normalized.includes('c2')) return 6.5
  if (normalized.includes('upper') || normalized.includes('b2')) return 5.5
  if (normalized.includes('intermediate') && !normalized.includes('upper')) return 4.5
  if (normalized.includes('beginner') || normalized.includes('a1') || normalized.includes('a2')) return 3.5

  return 4.0
}

function mapCertificateScoreToIelts(score) {
  if (!Number.isFinite(score)) return null
  if (score >= 75) return 6.5
  if (score >= 60) return 5.5
  return 4.5
}

export function normalizeLeadData(lead = {}) {
  const countrySpecificData = typeof lead.country_specific_data === 'object' && lead.country_specific_data
    ? lead.country_specific_data
    : {}

  const rawDegree = String(
    lead.degree_type || lead.degreeType || lead.academic_degree || countrySpecificData?._meta?.academic?.degreeType || ''
  ).toLowerCase().trim()

  let normalizedDegree = 'High School Degree (Baccalaureate)'
  if (rawDegree.includes('بكالوريا') || rawDegree.includes('bac') || rawDegree.includes('high school')) {
    normalizedDegree = 'High School Degree (Baccalaureate)'
  } else if (rawDegree.includes('ليسانس') || rawDegree.includes('bachelor') || rawDegree.includes('licence') || rawDegree.includes('license')) {
    normalizedDegree = 'Bachelor Degree'
  } else if (rawDegree.includes('ماستر') || rawDegree.includes('ماجستير') || rawDegree.includes('master') || rawDegree.includes('مهندس') || rawDegree.includes('engineering')) {
    normalizedDegree = 'Master / Engineering Degree'
  }

  const rawEnglish = lead.english_level || lead.englishLevel || countrySpecificData?._meta?.academic?.languageCertificateType || ''
  let normalizedIeltsScore = parseIeltsEquivalent(rawEnglish)

  const certificateScore = lead.language_certificate_score || lead.languageCertificateScore || countrySpecificData?._meta?.academic?.languageCertificateScore
  const parsedCertificateScore = Number(certificateScore)
  const explicitIeltsFromCertificate = mapCertificateScoreToIelts(parsedCertificateScore)
  if (explicitIeltsFromCertificate !== null && parsedCertificateScore > 10) {
    normalizedIeltsScore = explicitIeltsFromCertificate
  }

  let calculatedAge = 21
  const rawDob = lead.date_of_birth || lead.dob || lead.dateOfBirth
  if (rawDob) {
    const dob = new Date(rawDob)
    const today = new Date()
    if (!Number.isNaN(dob.getTime())) {
      calculatedAge = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        calculatedAge -= 1
      }
    }
  }

  const sponsorIncome = lead.financial_sponsor || lead.sponsor_annual_income || lead.annualSponsorIncome || countrySpecificData?._meta?.financial?.annualSponsorIncome || 'Unspecified'
  const tuitionRange = lead.budget_availability || lead.tuitionBudgetRange || lead.tuition_budget_range || countrySpecificData?._meta?.financial?.tuitionBudgetRange || '0-2000'
  const budgetAmount = parseBudgetToNumber(lead.budget_availability || lead.budget || lead.tuitionBudgetRange || lead.tuition_budget_range || '')
  const normalizedGpaOn20 = normalizeGpaTo20Scale(lead.gpa || lead.finalMark || lead.GPA || '')

  return {
    ...lead,
    normalized_degree: normalizedDegree,
    normalized_ielts_score: Number(normalizedIeltsScore.toFixed(1)),
    calculated_age: calculatedAge,
    normalized_sponsor_income: sponsorIncome,
    normalized_tuition_budget: tuitionRange,
    normalized_budget_amount: budgetAmount,
    normalized_gpa_on_20: normalizedGpaOn20,
    country_specific_data: countrySpecificData,
  }
}
