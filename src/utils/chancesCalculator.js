const languageScoreMap = {
  beginner: 0.6,
  intermediate: 0.8,
  advanced: 1,
}

const degreeBonusMap = {
  baccalaureate: 0,
  bachelor: 0.45,
  master: 0.8,
  engineering: 0.65,
}

function parseLanguageLevel(languageLevel = '') {
  const normalized = `${languageLevel}`.toLowerCase()

  if (normalized.includes('ielts') || normalized.includes('toefl')) {
    const match = normalized.match(/(\d+(?:\.\d+)?)/)
    if (!match) return 0.9

    const score = Number(match[1])

    if (score >= 7) return 1
    if (score >= 6) return 0.8
    return 0.6
  }

  if (normalized.includes('hsk')) {
    const match = normalized.match(/(\d+)/)
    const score = match ? Number(match[1]) : 0

    if (score >= 5) return 1
    if (score >= 3) return 0.8
    return 0.6
  }

  if (languageScoreMap[normalized]) {
    return languageScoreMap[normalized]
  }

  return 0.75
}

function parseDegreeBonus(degreeType = '') {
  const normalized = `${degreeType}`.trim().toLowerCase()
  return degreeBonusMap[normalized] || 0
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

function parseBudgetToNumber(value) {
  if (!value) return 0

  if (typeof value === 'number') {
    return value
  }

  const normalized = `${value}`.replace(/,/g, '')
  const values = normalized.match(/\d+(?:\.\d+)?/g)
  if (!values || values.length === 0) return 0

  const maxValue = Math.max(...values.map((item) => Number(item)))
  return Number.isFinite(maxValue) ? maxValue : 0
}

function calculateGapYears(dateOfBirth, lastDegreeDate) {
  if (!dateOfBirth || !lastDegreeDate) return 0

  const dob = new Date(dateOfBirth)
  const degreeDate = new Date(lastDegreeDate)
  const today = new Date()

  if (Number.isNaN(dob.getTime()) || Number.isNaN(degreeDate.getTime())) {
    return 0
  }

  const yearsBetween = (startDate, endDate) => {
    const years = endDate.getFullYear() - startDate.getFullYear()
    const hadBirthday =
      endDate.getMonth() > startDate.getMonth()
      || (endDate.getMonth() === startDate.getMonth() && endDate.getDate() >= startDate.getDate())

    return years - (hadBirthday ? 0 : 1)
  }

  const currentAge = yearsBetween(dob, today)
  const ageAtGraduation = yearsBetween(dob, degreeDate)

  return Math.max(0, currentAge - ageAtGraduation)
}

function calculateAgeFromDob(dateOfBirth) {
  if (!dateOfBirth) return 0

  const dob = new Date(dateOfBirth)
  const today = new Date()

  if (Number.isNaN(dob.getTime())) {
    return 0
  }

  const years = today.getFullYear() - dob.getFullYear()
  const hadBirthday =
    today.getMonth() > dob.getMonth()
    || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())

  return years - (hadBirthday ? 0 : 1)
}

function pickRuleForCountry(universityRules = [], countryName = '', preferredUniversity = '') {
  const normalizedCountry = `${countryName}`.trim().toLowerCase()
  const normalizedPreferredUniversity = `${preferredUniversity}`.trim().toLowerCase()

  const countryRules = universityRules.filter((rule) => `${rule.country || ''}`.trim().toLowerCase() === normalizedCountry)

  if (countryRules.length === 0) return null

  if (normalizedPreferredUniversity) {
    const exactRule = countryRules.find(
      (rule) => `${rule.university || ''}`.trim().toLowerCase() === normalizedPreferredUniversity,
    )

    if (exactRule) {
      return exactRule
    }
  }

  return countryRules[0]
}

export function calculateChances(leadData, universityRules = [], aiStudyPathScore = 0) {
  const normalizedMarkOn20 = normalizeGpaTo20Scale(leadData?.gpa)
  const normalizedMarkRatio = normalizedMarkOn20 / 20
  const normalizedLanguage = parseLanguageLevel(leadData?.english_level)
  const degreeBonusRatio = parseDegreeBonus(leadData?.degree_type)
  const leadBudget = parseBudgetToNumber(leadData?.budget_availability)
  const selectedCountries = Array.isArray(leadData?.selected_countries) ? leadData.selected_countries : []
  const countrySpecificData = typeof leadData?.country_specific_data === 'object' && leadData.country_specific_data
    ? leadData.country_specific_data
    : {}

  const numericalAiScore = Number(aiStudyPathScore)
  const normalizedAiScore = Number.isFinite(numericalAiScore)
    ? Math.max(0, Math.min(10, numericalAiScore))
    : 0
  const aiScoreRatio = normalizedAiScore / 10

  return selectedCountries.reduce((accumulator, countryName) => {
    const dynamicAnswers = countrySpecificData[countryName] || {}
    const preferredUniversity = dynamicAnswers.preferredUniversity || ''
    const selectedTargetDegree = dynamicAnswers.desiredLevel || leadData?.degree_type || ''
    const rule = pickRuleForCountry(universityRules, countryName, preferredUniversity)

    const minimumGpa = Number(rule?.minimum_gpa ?? 10)
    const minimumFee = Number(rule?.minimum_fee ?? 0)
    const maxGapYears = Number(rule?.max_gap_years ?? 99)
    const minimumIelts = Number(rule?.minimum_ielts ?? 0)
    const acceptsEnglishMoi = Boolean(rule?.accepts_english_moi)
    const maxAgeBachelor = Number(rule?.max_age_bachelor ?? 99)
    const maxAgeMaster = Number(rule?.max_age_master ?? 99)

    const derivedGapYears = calculateGapYears(leadData?.date_of_birth, leadData?.last_degree_date)
    const ageFromDob = calculateAgeFromDob(leadData?.date_of_birth)
    const studiedInEnglishBefore = `${leadData?.studied_in_english_before || ''}`.toLowerCase() === 'yes'
    const shouldBypassLanguagePenalty = acceptsEnglishMoi && studiedInEnglishBefore

    const baseScore = 20
    const gpaContribution = normalizedMarkRatio * 32
    const languageContribution = normalizedLanguage * 16
    const degreeContribution = degreeBonusRatio * 8
    const budgetContribution = minimumFee > 0 ? Math.min(1, leadBudget / minimumFee) * 14 : 14
    const aiContribution = aiScoreRatio * 20

    let penalties = 0
    const weakPoints = []
    const explanation = []

    if (rule && normalizedMarkOn20 < minimumGpa) {
      penalties += 8
      weakPoints.push(`GPA below university minimum (${normalizedMarkOn20.toFixed(1)}/20 vs ${minimumGpa}/20).`)
    }

    if (rule && minimumFee > 0 && leadBudget < minimumFee) {
      penalties += 8
      weakPoints.push(`Budget appears below minimum fee requirement (${leadBudget} vs ${minimumFee}).`)
    }

    if (rule && derivedGapYears > maxGapYears) {
      penalties += 8
      weakPoints.push(`Academic gap exceeds the allowed threshold (${derivedGapYears} years vs max ${maxGapYears}).`)
    }

    const lowerTarget = `${selectedTargetDegree}`.toLowerCase()
    const maxAge = lowerTarget.includes('master') ? maxAgeMaster : maxAgeBachelor
    if (rule && ageFromDob > maxAge) {
      penalties += 6
      weakPoints.push(`Applicant age may exceed common threshold for ${selectedTargetDegree || 'selected degree'} (${ageFromDob} vs max ${maxAge}).`)
    }

    if (!shouldBypassLanguagePenalty && minimumIelts > 0) {
      const inferredIelts = normalizedLanguage * 9
      if (inferredIelts < minimumIelts) {
        penalties += 6
        weakPoints.push(`Language profile may be below the minimum IELTS target (${inferredIelts.toFixed(1)} vs ${minimumIelts}).`)
      }
    }

    if (shouldBypassLanguagePenalty) {
      explanation.push('Language penalty bypassed because MOI in English is accepted and applicant studied in English.')
    }

    if (normalizedAiScore < 5) {
      const warning = 'High visa rejection risk: poor study path alignment detected by AI evaluation.'
      weakPoints.push(warning)
      explanation.push(warning)
      penalties += 8
    }

    const rawScore = baseScore
      + gpaContribution
      + languageContribution
      + degreeContribution
      + budgetContribution
      + aiContribution
      - penalties
    const acceptancePercentage = Math.max(10, Math.min(96, Math.round(rawScore)))

    explanation.unshift(
      `Base score: ${baseScore.toFixed(1)}`,
      `GPA contribution: ${gpaContribution.toFixed(1)} (${normalizedMarkOn20.toFixed(1)}/20)`,
      `Language contribution: ${languageContribution.toFixed(1)} (${leadData?.english_level || 'not specified'})`,
      `Degree contribution: ${degreeContribution.toFixed(1)} (${leadData?.degree_type || 'not specified'})`,
      `Budget contribution: ${budgetContribution.toFixed(1)} (available ${leadBudget})`,
      `AI study path contribution: ${aiContribution.toFixed(1)} (${normalizedAiScore}/10)`,
    )

    if (penalties > 0) {
      explanation.push(`Total penalties: -${penalties.toFixed(1)}`)
    } else {
      explanation.push('No penalties applied.')
    }

    if (weakPoints.length === 0) {
      weakPoints.push('No major risk factors detected against current university criteria.')
    }

    accumulator[countryName] = {
      percentage: acceptancePercentage,
      rawScore: Number(rawScore.toFixed(2)),
      breakdown: {
        baseScore: Number(baseScore.toFixed(2)),
        gpaContribution: Number(gpaContribution.toFixed(2)),
        languageContribution: Number(languageContribution.toFixed(2)),
        degreeContribution: Number(degreeContribution.toFixed(2)),
        budgetContribution: Number(budgetContribution.toFixed(2)),
        aiContribution: Number(aiContribution.toFixed(2)),
        totalPenalty: Number(penalties.toFixed(2)),
        normalizedGpaOn20: Number(normalizedMarkOn20.toFixed(2)),
        minimumRequiredGpa: minimumGpa,
        minimumRequiredFee: minimumFee,
        calculatedGapYears: derivedGapYears,
        maxGapYears,
      },
      explanation,
      weak_points: weakPoints,
      matched_university: rule?.university || null,
    }

    return accumulator
  }, {})
}
