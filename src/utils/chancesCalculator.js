import { normalizeLeadData } from './normalizeLead'

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

function parseIeltsScoreToLanguageRatio(ieltsScore = 0) {
  const score = Number(ieltsScore)
  if (!Number.isFinite(score) || score <= 0) return 0.6
  if (score >= 7) return 1
  if (score >= 6) return 0.8
  return 0.6
}

function parseDegreeBonus(degreeType = '') {
  const normalized = `${degreeType}`.trim().toLowerCase()

  if (degreeBonusMap[normalized] !== undefined) {
    return degreeBonusMap[normalized]
  }

  // English variants
  if (normalized.includes('master')) return degreeBonusMap.master
  if (normalized.includes('bachelor')) return degreeBonusMap.bachelor
  if (normalized.includes('engineering') || normalized.includes('engineer')) return degreeBonusMap.engineering
  if (normalized.includes('baccalaureate') || normalized.includes('high school')) return degreeBonusMap.baccalaureate

  // Arabic variants
  if (normalized.includes('ماستر')) return degreeBonusMap.master
  if (normalized.includes('ليسانس') || normalized.includes('إجازة')) return degreeBonusMap.bachelor
  if (normalized.includes('هندسة') || normalized.includes('مهندس')) return degreeBonusMap.engineering
  if (normalized.includes('بكالوريا')) return degreeBonusMap.baccalaureate

  return 0
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

function parseMinimumGpaTo20Scale(minimumGpaRaw) {
  if (minimumGpaRaw === null || minimumGpaRaw === undefined || minimumGpaRaw === '') {
    return 10
  }

  if (typeof minimumGpaRaw === 'number') {
    return normalizeGpaTo20Scale(minimumGpaRaw)
  }

  const normalized = `${minimumGpaRaw}`.trim()

  // Supports formats such as "10/20", "2.5/4", "70/100"
  const ratioMatch = normalized.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
  if (ratioMatch) {
    const numerator = Number(ratioMatch[1])
    const denominator = Number(ratioMatch[2])

    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
      // If the GPA value is already expressed as X/20, use the numerator directly.
      if (denominator === 20) {
        return Number(numerator.toFixed(2))
      }
      return Number(((numerator / denominator) * 20).toFixed(2))
    }
  }

  const directValueMatch = normalized.match(/\d+(?:\.\d+)?/)
  if (directValueMatch) {
    return normalizeGpaTo20Scale(Number(directValueMatch[0]))
  }

  return 10
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

function normalizeYesNo(value) {
  if (typeof value === 'boolean') {
    return value
  }

  const normalized = `${value || ''}`.trim().toLowerCase()
  return normalized === 'yes' || normalized === 'true'
}

function isDegreeLevelSupported(rule, selectedTargetDegree) {
  const target = `${selectedTargetDegree || ''}`.trim().toLowerCase()
  if (!target) return true

  const levels = [rule?.level_1, rule?.level_2]
    .map((item) => `${item || ''}`.trim().toLowerCase())
    .filter((item) => item && item !== '-' && item !== 'null' && item !== 'undefined')

  if (levels.length === 0) return true

  if (target.includes('bachelor') && levels.some((level) => level.includes('bachelor'))) {
    return true
  }

  if (target.includes('master') && levels.some((level) => level.includes('master'))) {
    return true
  }

  return levels.some((level) => target.includes(level) || level.includes(target))
}

export function calculateChances(leadData, universityRules = [], aiStudyPathScore = 0) {
  const normalizedLead = normalizeLeadData(leadData || {})
  const normalizedMarkOn20 = normalizedLead.normalized_gpa_on_20
  const normalizedMarkRatio = normalizedMarkOn20 / 20
  const normalizedLanguage = parseIeltsScoreToLanguageRatio(normalizedLead.normalized_ielts_score)
  const degreeBonusRatio = parseDegreeBonus(normalizedLead.degree_type || normalizedLead.degreeType)
  const leadBudget = parseBudgetToNumber(normalizedLead.normalized_budget_amount ?? normalizedLead.budget_availability ?? normalizedLead.budget)
  const selectedCountries = Array.isArray(normalizedLead.selected_countries) ? normalizedLead.selected_countries : []
  const countrySpecificData = typeof normalizedLead.country_specific_data === 'object' && normalizedLead.country_specific_data
    ? normalizedLead.country_specific_data
    : {}

  const numericalAiScore = Number(aiStudyPathScore)
  const normalizedAiScore = Number.isFinite(numericalAiScore)
    ? Math.max(0, Math.min(10, numericalAiScore))
    : 0
  const aiScoreRatio = normalizedAiScore / 10

  return selectedCountries.reduce((accumulator, countryName) => {
    const dynamicAnswers = countrySpecificData[countryName] || {}
    const preferredUniversity = dynamicAnswers.preferredUniversity || ''
    const selectedTargetDegree = dynamicAnswers.desiredLevel || normalizedLead.degree_type || normalizedLead.degreeType || ''
    const rule = pickRuleForCountry(universityRules, countryName, preferredUniversity)

    const minimumGpa = parseMinimumGpaTo20Scale(rule?.minimum_gpa)
    const minimumFee = Number(rule?.minimum_fee ?? 0)
    const maxGapYears = Number(rule?.max_gap_years ?? 99)
    const minimumIelts = Number(rule?.minimum_ielts ?? 0)
    const acceptsEnglishMoi = Boolean(rule?.accepts_english_moi)
    const maxAgeBachelor = Number(rule?.max_age_bachelor ?? 99)
    const maxAgeMaster = Number(rule?.max_age_master ?? 99)

    const derivedGapYears = calculateGapYears(normalizedLead.date_of_birth || normalizedLead.dob || normalizedLead.dateOfBirth, normalizedLead.last_degree_date || normalizedLead.lastDegreeDate)
    const ageFromDob = calculateAgeFromDob(normalizedLead.date_of_birth || normalizedLead.dob || normalizedLead.dateOfBirth)
    const studiedInEnglishBefore = normalizeYesNo(normalizedLead.studied_in_english_before || normalizedLead.studiedInEnglishBefore)
    const shouldBypassLanguagePenalty = acceptsEnglishMoi && studiedInEnglishBefore

    const baseScore = 20
    let gpaContribution = normalizedMarkRatio * 32
    let languageContribution = normalizedLanguage * 16
    const degreeContribution = degreeBonusRatio * 8
    let budgetContribution = minimumFee > 0 ? Math.min(1, leadBudget / minimumFee) * 14 : 14
    const aiContribution = aiScoreRatio * 20

    let penalties = 0
    let failedCriticalRequirement = false
    const weakPoints = []
    const explanation = []

    if (rule && normalizedMarkOn20 < minimumGpa) {
      gpaContribution = Math.min(gpaContribution, 5)
      penalties += 20
      failedCriticalRequirement = true
      weakPoints.push(`GPA below university minimum (${normalizedMarkOn20.toFixed(1)}/20 vs ${minimumGpa}/20).`)
    }

    if (rule && minimumFee > 0 && leadBudget < minimumFee) {
      budgetContribution = 0
      penalties += 15
      failedCriticalRequirement = true
      weakPoints.push(`Budget appears below minimum fee requirement (${leadBudget} vs ${minimumFee}).`)
    }

    if (rule && minimumIelts > 0 && normalizedLead.normalized_ielts_score < minimumIelts) {
      languageContribution = 0
      penalties += 15
      failedCriticalRequirement = true
      weakPoints.push(`Language score below university IELTS requirement (${normalizedLead.normalized_ielts_score.toFixed(1)} vs ${minimumIelts}).`)
    }

    if (rule && derivedGapYears > maxGapYears) {
      penalties += 8
      weakPoints.push(`Academic gap exceeds the allowed threshold (${derivedGapYears} years vs max ${maxGapYears}).`)
    }

    const lowerTarget = `${selectedTargetDegree}`.toLowerCase()
    const maxAge = lowerTarget.includes('master') ? maxAgeMaster : maxAgeBachelor
    if (rule && ageFromDob > maxAge) {
      penalties += 15
      failedCriticalRequirement = true
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
    const finalRecommendationCap = failedCriticalRequirement ? 4.5 : null

    explanation.unshift(
      `Base score: ${baseScore.toFixed(1)}`,
      `GPA contribution: ${gpaContribution.toFixed(1)} (${normalizedMarkOn20.toFixed(1)}/20)`,
      `Language contribution: ${languageContribution.toFixed(1)} (IELTS ${normalizedLead.normalized_ielts_score.toFixed(1)})`,
      `Degree contribution: ${degreeContribution.toFixed(1)} (${normalizedLead.degree_type || normalizedLead.degreeType || 'not specified'})`,
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
      recommendationCap: finalRecommendationCap,
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
        normalizedIeltsScore: Number(normalizedLead.normalized_ielts_score.toFixed(1)),
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

export function compareWithAllUniversities(normalizedLead, universityRules = []) {
  const lead = normalizeLeadData(normalizedLead || {})
  const leadAge = Number(lead.calculated_age || 0)
  const leadGpa = Number(lead.normalized_gpa_on_20 || 0)
  const leadIelts = Number(lead.normalized_ielts_score || 0)

  const subjectScoresRaw = typeof lead.subject_scores === 'object' && lead.subject_scores
    ? lead.subject_scores
    : typeof lead.country_specific_data === 'object' && lead.country_specific_data
      ? lead.country_specific_data?._meta?.academic?.subject_scores || {}
      : {}

  const parseRequirementValue = (value) => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') return Number(value)
    const match = `${value}`.trim().match(/(\d+(?:\.\d+)?)/)
    return match ? Number(match[1]) : null
  }

  const parseScoreValue = (value) => {
    if (value === null || value === undefined || value === '') return null
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : null
  }

  const leadSubjects = {
    m_t: parseScoreValue(subjectScoresRaw.m_t),
    phy: parseScoreValue(subjectScoresRaw.phy),
    se: parseScoreValue(subjectScoresRaw.se),
    lng: parseScoreValue(subjectScoresRaw.lng),
    eco: parseScoreValue(subjectScoresRaw.eco),
    geo_his: parseScoreValue(subjectScoresRaw.geo_his),
  }

  return (Array.isArray(universityRules) ? universityRules : []).map((rule) => {
    const missingRequirements = []
    let matchedCount = 0
    let totalCount = 0

    const rulesToEvaluate = [
      { key: 'minimum_gpa', label: 'GPA', leadValue: leadGpa, requirementValue: parseMinimumGpaTo20Scale(rule?.minimum_gpa), compare: (leadValue, reqValue) => leadValue >= reqValue },
      { key: 'minimum_fee', label: 'Tuition fee', leadValue: Number(lead.normalized_budget_amount || lead.budget_availability || 0), requirementValue: parseRequirementValue(rule?.minimum_fee), compare: (leadValue, reqValue) => reqValue === null || leadValue >= reqValue },
      { key: 'minimum_ielts', label: 'IELTS', leadValue: leadIelts, requirementValue: parseRequirementValue(rule?.minimum_ielts), compare: (leadValue, reqValue) => reqValue === null || leadValue >= reqValue },
      { key: 'max_age_bachelor', label: 'Maximum age', leadValue: leadAge, requirementValue: parseRequirementValue(rule?.max_age_bachelor), compare: (leadValue, reqValue) => reqValue === null || leadValue <= reqValue },
    ]

    rulesToEvaluate.forEach(({ label, leadValue, requirementValue, compare, key }) => {
      if (requirementValue !== null && requirementValue !== undefined) {
        totalCount += 1
        if (compare(leadValue, requirementValue)) {
          matchedCount += 1
        } else {
          missingRequirements.push(`${label} requirement not met: ${leadValue} ${key === 'max_age_bachelor' ? '>' : '<'} ${requirementValue}`)
        }
      }
    })

    const subjectRuleMap = [
      { key: 'm_t', label: 'Math score', leadValue: leadSubjects.m_t },
      { key: 'phy', label: 'Physics score', leadValue: leadSubjects.phy },
      { key: 'se', label: 'Science score', leadValue: leadSubjects.se },
      { key: 'lng', label: 'Languages score', leadValue: leadSubjects.lng },
      { key: 'eco', label: 'Economics score', leadValue: leadSubjects.eco },
      { key: 'geo_his', label: 'Geo-History score', leadValue: leadSubjects.geo_his },
    ]

    subjectRuleMap.forEach(({ key, label, leadValue }) => {
      const requirementValue = parseRequirementValue(rule?.[key])
      if (requirementValue !== null && requirementValue !== undefined) {
        totalCount += 1
        if (leadValue !== null && leadValue !== undefined && leadValue !== '' && leadValue >= requirementValue) {
          matchedCount += 1
        } else {
          const actualValue = leadValue === null || leadValue === undefined || leadValue === '' ? 'Not provided' : leadValue
          missingRequirements.push(`${label} too low: ${actualValue} < ${requirementValue}`)
        }
      }
    })

    const isMatch = missingRequirements.length === 0 && totalCount > 0
    const matchPercentage = totalCount === 0 ? 0 : Math.round((matchedCount / totalCount) * 100)

    return {
      university: rule?.university || rule?.name || 'Unknown university',
      country: rule?.country || 'Unknown country',
      isMatch,
      matchPercentage,
      missingRequirements,
      totalRequirements: totalCount,
      rule,
    }
  }).sort((a, b) => {
    if (a.matchPercentage !== b.matchPercentage) {
      return b.matchPercentage - a.matchPercentage
    }
    if (a.isMatch === b.isMatch) {
      return a.university.localeCompare(b.university)
    }
    return a.isMatch ? -1 : 1
  })
}

export function suggestBestUniversity(leadData, universityRules = [], chancesByCountry = {}) {
  if (!Array.isArray(universityRules) || universityRules.length === 0) {
    return null
  }

  const originalSelectedCountries = Array.isArray(leadData?.selected_countries)
    ? leadData.selected_countries
    : []
  const firstCountry = originalSelectedCountries.length > 0 ? originalSelectedCountries[0] : null
  const selectedCountries = originalSelectedCountries
    .map((country) => `${country || ''}`.trim().toLowerCase())
    .filter(Boolean)
  const countrySpecificData = typeof leadData?.country_specific_data === 'object' && leadData.country_specific_data
    ? leadData.country_specific_data
    : {}

  const normalizedLead = normalizeLeadData(leadData || {})
  const normalizedMarkOn20 = normalizedLead.normalized_gpa_on_20
  const leadBudget = parseBudgetToNumber(normalizedLead.normalized_budget_amount ?? normalizedLead.budget_availability ?? normalizedLead.budget)
  const normalizedLanguage = parseIeltsScoreToLanguageRatio(normalizedLead.normalized_ielts_score)
  const derivedGapYears = calculateGapYears(normalizedLead.date_of_birth || normalizedLead.dob || normalizedLead.dateOfBirth, normalizedLead.last_degree_date || normalizedLead.lastDegreeDate)
  const ageFromDob = calculateAgeFromDob(normalizedLead.date_of_birth || normalizedLead.dob || normalizedLead.dateOfBirth)
  const studiedInEnglishBefore = normalizeYesNo(normalizedLead.studied_in_english_before || normalizedLead.studiedInEnglishBefore)

  const candidateRules = universityRules.filter((rule) => {
    if (selectedCountries.length === 0) return true
    return selectedCountries.includes(`${rule.country || ''}`.trim().toLowerCase())
  })

  if (candidateRules.length === 0) {
    return null
  }

  let bestOption = null

  candidateRules.forEach((rule) => {
    const countryKey = `${rule.country || ''}`.trim()
    const dynamicAnswers = countrySpecificData[countryKey] || {}
    const selectedTargetDegree = dynamicAnswers.desiredLevel || normalizedLead.degree_type || normalizedLead.degreeType || ''
    const chancePercentage = Number(chancesByCountry?.[countryKey]?.percentage ?? 0)

    const minimumGpa = parseMinimumGpaTo20Scale(rule?.minimum_gpa)
    const minimumFee = Number(rule?.minimum_fee ?? 0)
    const maxGapYears = Number(rule?.max_gap_years ?? 99)
    const minimumIelts = Number(rule?.minimum_ielts ?? 0)
    const maxAgeBachelor = Number(rule?.max_age_bachelor ?? 99)
    const maxAgeMaster = Number(rule?.max_age_master ?? 99)
    const acceptsEnglishMoi = Boolean(rule?.accepts_english_moi)

    let score = 60
    const reasons = []

    if (normalizedMarkOn20 >= minimumGpa) {
      score += 12
      reasons.push(`GPA eligible (${normalizedMarkOn20.toFixed(1)}/20 >= ${minimumGpa}/20).`)
    } else {
      score -= 18
      reasons.push(`GPA may be below minimum (${normalizedMarkOn20.toFixed(1)}/20 < ${minimumGpa}/20).`)
    }

    if (minimumFee > 0 && leadBudget >= minimumFee) {
      score += 10
      reasons.push(`Budget fits tuition threshold (${leadBudget} >= ${minimumFee}).`)
    } else if (minimumFee > 0) {
      score -= 15
      reasons.push(`Budget may be below tuition threshold (${leadBudget} < ${minimumFee}).`)
    }

    if (derivedGapYears <= maxGapYears) {
      score += 8
      reasons.push(`Academic gap is within limit (${derivedGapYears} <= ${maxGapYears}).`)
    } else {
      score -= 12
      reasons.push(`Academic gap is above limit (${derivedGapYears} > ${maxGapYears}).`)
    }

    const maxAge = `${selectedTargetDegree}`.toLowerCase().includes('master') ? maxAgeMaster : maxAgeBachelor
    if (ageFromDob <= maxAge) {
      score += 8
      reasons.push(`Age profile fits typical limit (${ageFromDob} <= ${maxAge}).`)
    } else {
      score -= 10
      reasons.push(`Age profile may exceed typical limit (${ageFromDob} > ${maxAge}).`)
    }

    if (acceptsEnglishMoi && studiedInEnglishBefore) {
      score += 6
      reasons.push('English MOI accepted and applicant studied in English.')
    } else if (minimumIelts > 0) {
      const inferredIelts = normalizedLanguage * 9
      if (inferredIelts >= minimumIelts) {
        score += 6
        reasons.push(`Language profile likely meets IELTS threshold (${inferredIelts.toFixed(1)} >= ${minimumIelts}).`)
      } else {
        score -= 8
        reasons.push(`Language profile may be below IELTS threshold (${inferredIelts.toFixed(1)} < ${minimumIelts}).`)
      }
    }

    if (isDegreeLevelSupported(rule, selectedTargetDegree)) {
      score += 5
      reasons.push(`Program level appears supported (${selectedTargetDegree || 'selected degree'}).`)
    } else {
      score -= 12
      reasons.push(`Program level may not match available levels (${rule.level_1 || '-'} / ${rule.level_2 || '-' }).`)
    }

    // Reuse calculated country chance to bias recommendation toward stronger overall outcomes.
    score += Math.max(0, Math.min(20, chancePercentage / 5))

    const boundedScore100 = Math.max(0, Math.min(100, Math.round(score)))
    let boundedScore10 = Math.max(0, Math.min(10, Number((boundedScore100 / 10).toFixed(1))))
    const countryCap = Number(chancesByCountry?.[countryKey]?.recommendationCap)
    if (Number.isFinite(countryCap) && countryCap > 0 && boundedScore10 > countryCap) {
      boundedScore10 = countryCap
      reasons.push(`Recommendation capped at ${countryCap}/10 due to a critical requirement failure.`)
    }

    const option = {
      country: rule.country,
      university: rule.university,
      recommendation_score: boundedScore10,
      recommendation_score_100: Math.round(boundedScore10 * 10),
      reasons,
    }

    if (!bestOption || option.recommendation_score > bestOption.recommendation_score) {
      bestOption = option
    }
  })

  if (bestOption && firstCountry && chancesByCountry[firstCountry]?.recommendationCap) {
    const cap = Number(chancesByCountry[firstCountry].recommendationCap)
    if (Number.isFinite(cap)) {
      bestOption.recommendation_score = Math.min(bestOption.recommendation_score, cap)
      bestOption.recommendation_score_100 = Math.round(bestOption.recommendation_score * 10)
      bestOption.reasons.push(`Final recommendation capped at ${cap}/10 for ${firstCountry}.`)
    }
  }

  return bestOption
}
