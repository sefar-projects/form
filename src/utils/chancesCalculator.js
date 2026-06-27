import { countriesConfig } from '../config/countriesConfig'

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

export function calculateChances(finalMark, languageLevel, selectedCountries = [], degreeType = '') {
  const numericMark = Number(finalMark) || 0
  const normalizedMark = Math.min(20, Math.max(0, numericMark)) / 20
  const normalizedLanguage = parseLanguageLevel(languageLevel)
  const degreeBonusRatio = parseDegreeBonus(degreeType)

  return selectedCountries.reduce((accumulator, countryName) => {
    const countryConfig = countriesConfig[countryName]

    if (!countryConfig) {
      return accumulator
    }

    const baseScore = countryConfig.weighting?.base || 26
    const markBonus = countryConfig.weighting?.markBonus || 35
    const languageBonus = countryConfig.weighting?.languageBonus || 18
    const degreeBonus = countryConfig.weighting?.degreeBonus || 8
    const gpaPenalty = countryConfig.weighting?.gpaPenalty || 10
    const minimumMark = countryConfig.requiredMinimumGpa || 10

    const markContribution = normalizedMark * markBonus
    const languageContribution = normalizedLanguage * languageBonus
    const degreeContribution = degreeBonusRatio * degreeBonus
    const penalty = numericMark < minimumMark ? gpaPenalty : 0

    const rawScore = baseScore + markContribution + languageContribution + degreeContribution - penalty
    const acceptancePercentage = Math.max(12, Math.min(95, Math.round(rawScore)))

    const explanation = [
      `Base score: ${baseScore.toFixed(1)}`,
      `Final mark contribution: ${markContribution.toFixed(1)} (mark ${numericMark}/20)`,
      `Language contribution: ${languageContribution.toFixed(1)} (${languageLevel || 'not specified'})`,
      `Degree contribution: ${degreeContribution.toFixed(1)} (${degreeType || 'not specified'})`,
    ]

    if (penalty > 0) {
      explanation.push(`Minimum mark penalty: -${penalty.toFixed(1)} (required ${minimumMark}/20)`)
    } else {
      explanation.push(`No minimum mark penalty (required ${minimumMark}/20)`)
    }

    accumulator[countryName] = {
      percentage: acceptancePercentage,
      rawScore: Number(rawScore.toFixed(2)),
      breakdown: {
        baseScore: Number(baseScore.toFixed(2)),
        finalMarkContribution: Number(markContribution.toFixed(2)),
        languageContribution: Number(languageContribution.toFixed(2)),
        degreeContribution: Number(degreeContribution.toFixed(2)),
        minimumMarkPenalty: Number(penalty.toFixed(2)),
        minimumRequiredMark: minimumMark,
      },
      explanation,
    }

    return accumulator
  }, {})
}
