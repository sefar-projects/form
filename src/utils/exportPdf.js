import { translations } from '../i18n/translations'
import logoPath from '../assets/logo.png'

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined).join(', ')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function parseObjectValue(value) {
  if (!value) return {}
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }
  return ''
}

function pushRowIfPresent(rows, label, value) {
  const formatted = formatValue(value)
  if (formatted && formatted !== '—') {
    rows.push([label, formatted])
  }
}

function buildSectionRows(submission, isArabic, countryData) {
  const personalRows = []
  const academicRows = []
  const financialRows = []

  const labels = {
    fullName: isArabic ? 'الاسم الكامل' : 'Full name',
    email: isArabic ? 'البريد الإلكتروني' : 'Email',
    phone: isArabic ? 'رقم الهاتف' : 'Phone',
    dob: isArabic ? 'تاريخ الميلاد' : 'Date of birth',
    nationality: isArabic ? 'الجنسية' : 'Nationality',
    accessCode: isArabic ? 'رمز الوصول' : 'Access code',
    degreeType: isArabic ? 'نوع الدرجة' : 'Degree type',
    finalMark: isArabic ? 'العلامة النهائية' : 'Final mark',
    englishLevel: isArabic ? 'مستوى اللغة الإنجليزية' : 'English level',
    languageCertificateType: isArabic ? 'شهادة اللغة' : 'Language certificate type',
    languageCertificateScore: isArabic ? 'درجة شهادة اللغة' : 'Language certificate score',
    selectedCountries: isArabic ? 'الدول المختارة' : 'Selected countries',
    lastDegreeDate: isArabic ? 'تاريخ الشهادة الأخيرة' : 'Last degree date',
    gapYears: isArabic ? 'سنوات الفاصل' : 'Gap years',
    studiedInEnglish: isArabic ? 'هل درست باللغة الإنجليزية سابقًا؟' : 'Studied in English before',
    sponsor: isArabic ? 'الراعي المالي' : 'Financial sponsor',
    sponsorIncome: isArabic ? 'الدخل السنوي للراعي' : 'Sponsor income',
    tuitionBudget: isArabic ? 'نطاق ميزانية الرسوم' : 'Tuition budget range',
    fundsAvailability: isArabic ? 'توفر الأموال' : 'Funds availability timeline',
    additionalInfo: isArabic ? 'معلومات إضافية' : 'Additional information',
  }

  pushRowIfPresent(personalRows, labels.fullName, pickFirstValue(submission.name, `${submission.first_name || ''} ${submission.last_name || ''}`.trim()))
  pushRowIfPresent(personalRows, labels.email, submission.email)
  pushRowIfPresent(personalRows, labels.phone, submission.phone_number || submission.phone)
  pushRowIfPresent(personalRows, labels.dob, submission.date_of_birth || submission.dob)
  pushRowIfPresent(personalRows, labels.nationality, submission.nationality)
  pushRowIfPresent(personalRows, labels.accessCode, submission.access_code)

  pushRowIfPresent(academicRows, labels.degreeType, submission.degree_type || submission.degreeType)
  pushRowIfPresent(academicRows, labels.finalMark, submission.gpa ?? submission.finalMark)
  pushRowIfPresent(academicRows, labels.englishLevel, submission.english_level || submission.englishLevel)
  pushRowIfPresent(academicRows, labels.languageCertificateType, submission.language_certificate_type || submission.languageCertificateType)
  pushRowIfPresent(academicRows, labels.languageCertificateScore, submission.language_certificate_score || submission.languageCertificateScore)
  pushRowIfPresent(academicRows, labels.selectedCountries, submission.selected_countries)
  pushRowIfPresent(academicRows, labels.lastDegreeDate, submission.last_degree_date || submission.lastDegreeDate)
  pushRowIfPresent(academicRows, labels.gapYears, submission.gap_years || submission.gapYears)
  pushRowIfPresent(academicRows, labels.studiedInEnglish, submission.studied_in_english_before || submission.studiedInEnglishBefore)

  pushRowIfPresent(financialRows, labels.sponsor, submission.financial_sponsor || submission.sponsor || submission.financialSponsor)
  pushRowIfPresent(financialRows, labels.sponsorIncome, submission.sponsor_annual_income || submission.annualSponsorIncome || countryData?._meta?.financial?.annualSponsorIncome)
  pushRowIfPresent(financialRows, labels.tuitionBudget, submission.budget_availability || submission.tuition_budget_range || submission.normalized_tuition_budget || submission.budget)
  pushRowIfPresent(financialRows, labels.fundsAvailability, submission.funds_availability_timeline || submission.fundsAvailabilityTimeline)
  pushRowIfPresent(financialRows, labels.additionalInfo, submission.additional_info || submission.additionalInfo)

  return { personalRows, academicRows, financialRows }
}

function renderSectionTable(title, rows, isArabic) {
  if (!rows || rows.length === 0) return ''

  const rowsHtml = rows.map(([label, value]) => `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td>${escapeHtml(value)}</td>
      </tr>`).join('')

  return `
    <h2>${escapeHtml(title)}</h2>
    <table>
      <tbody>${rowsHtml}</tbody>
    </table>`
}

function renderAiEvaluationSection(submission, isArabic) {
  const countryData = parseObjectValue(submission.country_specific_data)
  const studyPathMeta = parseObjectValue(countryData?._meta?.studyPath)

  const score = pickFirstValue(submission.study_path_score, submission.studyPathScore, studyPathMeta?.score)
  const explanation = pickFirstValue(
    submission.study_path_explanation,
    submission.studyPathExplanation,
    studyPathMeta?.reasoning,
  )
  const previousDegree = studyPathMeta?.previousDegree
  const targetDegree = studyPathMeta?.targetDegree

  const header = isArabic ? 'تقييم الذكاء الصناعي' : 'AI Evaluation'
  const scoreLabel = isArabic ? 'درجة مسار الدراسة' : 'Study path score'
  const previousLabel = isArabic ? 'الدرجة السابقة' : 'Previous degree'
  const targetLabel = isArabic ? 'الدرجة المستهدفة' : 'Target degree'
  const noData = isArabic ? 'لا يوجد تقييم متاح.' : 'No evaluation available.'

  const details = []
  if (score !== '') details.push(`${scoreLabel}: ${formatValue(score)}`)
  if (previousDegree) details.push(`${previousLabel}: ${formatValue(previousDegree)}`)
  if (targetDegree) details.push(`${targetLabel}: ${formatValue(targetDegree)}`)
  details.push('')
  details.push(formatValue(explanation) || noData)

  return `
    <h2>${escapeHtml(header)}</h2>
    <div class="ai-box">${escapeHtml(details.join('\n'))}</div>`
}

function renderRecommendationSection(countryData, isArabic) {
  if (!countryData || typeof countryData !== 'object') return ''

  const recommendation = parseObjectValue(countryData?._meta?.recommendation)
  if (!recommendation || Object.keys(recommendation).length === 0) {
    return ''
  }

  const reasonsList = Array.isArray(recommendation.reasons) && recommendation.reasons.length > 0
    ? recommendation.reasons.map((r) => `<li>${escapeHtml(String(r))}</li>`).join('')
    : `<li>${escapeHtml(isArabic ? 'لا توجد أسباب محددة مقدمة' : 'No specific reasons provided')}</li>`

  return `
    <h2>${escapeHtml(isArabic ? 'الجامعة والدولة الموصى بها' : 'Best University & Country Suggestion')}</h2>
    <table>
      <tbody>
        <tr>
          <td style="font-weight: 600; width: 35%;">${escapeHtml(isArabic ? 'الجامعة الموصى بها' : 'Suggested Option')}</td>
          <td><strong>${escapeHtml(pickFirstValue(recommendation.country, recommendation.countryName) || '')} - ${escapeHtml(pickFirstValue(recommendation.university, recommendation.universityName) || '')}</strong></td>
        </tr>
        <tr>
          <td style="font-weight: 600;">${escapeHtml(isArabic ? 'درجة التوصية' : 'Recommendation Score')}</td>
          <td><span class="badge">${escapeHtml(String(recommendation.recommendation_score ?? recommendation.recommendationScore ?? 0))} / 10</span></td>
        </tr>
        <tr>
          <td style="font-weight: 600;">${escapeHtml(isArabic ? 'سبب اختيار هذه الجامعة' : 'Why this score / reasons')}</td>
          <td><ul style="margin: 0; padding-inline-start: 18px;">${reasonsList}</ul></td>
        </tr>
      </tbody>
    </table>`
}

function humanizeLabel(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
}

function formatCountryValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map((item) => formatCountryValue(item)).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([subKey, subVal]) => `${humanizeLabel(subKey)}: ${formatCountryValue(subVal)}`)
      .join(' | ')
  }
  return String(value)
}

function renderCountryTableRows(countryData) {
  if (!countryData || typeof countryData !== 'object') {
    return '<tbody><tr><td colspan="2">—</td></tr></tbody>'
  }

  const entries = Object.entries(countryData).filter(([key]) => key !== '_meta')
  if (entries.length === 0) {
    return '<tbody><tr><td colspan="2">—</td></tr></tbody>'
  }

  const rows = []
  entries.forEach(([key, val]) => {
    const label = humanizeLabel(key)

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      rows.push(`
        <tr>
          <td colspan="2" style="font-weight: 700; background: #f8fafc; padding: 10px 8px;">${escapeHtml(label)}</td>
        </tr>`)

      Object.entries(val).forEach(([innerKey, innerVal]) => {
        rows.push(`
          <tr>
            <td style="font-weight: 600; width: 40%;">${escapeHtml(humanizeLabel(innerKey))}</td>
            <td>${escapeHtml(formatCountryValue(innerVal))}</td>
          </tr>`)
      })
    } else {
      rows.push(`
        <tr>
          <td style="font-weight: 600; width: 40%;">${escapeHtml(label)}</td>
          <td>${escapeHtml(formatCountryValue(val))}</td>
        </tr>`)
    }
  })

  return `<tbody>${rows.join('')}</tbody>`
}

function formatBreakdown(breakdown) {
  if (!breakdown) return ''
  if (Array.isArray(breakdown)) {
    return breakdown.map((item) => `- ${formatValue(item)}`).join('\n')
  }
  if (typeof breakdown === 'object') {
    return Object.entries(breakdown)
      .map(([key, value]) => `- ${key}: ${formatValue(value)}`)
      .join('\n')
  }
  return formatValue(breakdown)
}

function formatWeakPoints(weakPoints) {
  if (!weakPoints) return ''
  if (Array.isArray(weakPoints)) {
    return weakPoints.map((item) => `- ${formatValue(item)}`).join('\n')
  }
  return formatValue(weakPoints)
}

function renderChanceRows(scoreData, t, isArabic) {
  const entries = Object.entries(scoreData || {})
  if (entries.length === 0) {
    const emptyLabel = isArabic ? 'لا توجد بيانات متاحة.' : 'No data available.'
    return `<tbody><tr><td colspan="3">${escapeHtml(emptyLabel)}</td></tr></tbody>`
  }

  const rowsHtml = entries.map(([countryKey, result]) => {
    const percentage = result && typeof result === 'object' && result.percentage !== undefined
      ? String(result.percentage)
      : ''

    const explanationArray = Array.isArray(result?.explanation)
      ? result.explanation
      : result?.explanation ? [result.explanation] : []

    const weakPointsArray = Array.isArray(result?.weak_points)
      ? result.weak_points
      : result?.weak_points ? [result.weak_points] : []

    const combinedExplanation = [...explanationArray, ...weakPointsArray]
      .filter((item) => item !== null && item !== undefined && item !== '')
      .join(' | ') || '—'

    return `
      <tr>
        <td>${escapeHtml(countryKey)}</td>
        <td>${escapeHtml(percentage ? `${percentage}%` : '—')}</td>
        <td>${escapeHtml(combinedExplanation)}</td>
      </tr>`
  }).join('')

  return `<tbody>${rowsHtml}</tbody>`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function openPrintIframe(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.visibility = 'hidden'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)

    const printWindow = iframe.contentWindow
    if (!printWindow) {
      document.body.removeChild(iframe)
      reject(new Error('Unable to open print iframe.'))
      return
    }

    const printDocument = printWindow.document
    printDocument.open()
    printDocument.write(html)
    printDocument.close()

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
      resolve()
    }

    printWindow.onafterprint = cleanup
    printWindow.focus()

    try {
      printWindow.print()
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}

function getLeadSubjectScores(submission) {
  const countryData = parseObjectValue(submission?.country_specific_data)
  const rawScores = submission?.subject_scores || countryData?._meta?.academic?.subject_scores || {}

  const normalized = {
    m_t: rawScores.m_t ?? rawScores.math ?? rawScores['Math'] ?? rawScores['m math'] ?? null,
    phy: rawScores.phy ?? rawScores.physics ?? rawScores['Physics'] ?? null,
    se: rawScores.se ?? rawScores.science ?? rawScores['Science'] ?? null,
    lng: rawScores.lng ?? rawScores.languages ?? rawScores['Languages'] ?? null,
    eco: rawScores.eco ?? rawScores.economics ?? rawScores['Economics'] ?? null,
    geo_his: rawScores.geo_his ?? rawScores['geo-his'] ?? rawScores['History&Geography'] ?? rawScores.history_geo ?? null,
  }

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  )
}

function renderLeadSubjectSummary(submission, isArabic) {
  const subjectScores = getLeadSubjectScores(submission)
  if (Object.keys(subjectScores).length === 0) {
    return ''
  }

  const labelMap = {
    m_t: isArabic ? 'رياضيات' : 'Math',
    phy: isArabic ? 'فيزياء' : 'Physics',
    se: isArabic ? 'علوم' : 'Science',
    lng: isArabic ? 'لغات' : 'Languages',
    eco: isArabic ? 'اقتصاد' : 'Economics',
    geo_his: isArabic ? 'تاريخ وجغرافيا' : 'History & Geo',
  }

  const summary = Object.entries(subjectScores)
    .map(([key, value]) => `${labelMap[key] || key}: ${value}`)
    .join(' • ')

  return `
    <div style="margin: 8px 0 14px; border: 1px solid #dbeafe; background: #f8fbff; border-radius: 8px; padding: 10px; font-size: 11px;">
      <strong>${escapeHtml(isArabic ? 'درجات الطالب الأكاديمية' : 'Student Subject Scores')}:</strong> ${escapeHtml(summary)}
    </div>`
}

function renderUniversityMatchRows(results, isArabic, submission = {}) {
  if (!Array.isArray(results) || results.length === 0) {
    return `<tbody><tr><td colspan="7">${escapeHtml(isArabic ? 'لا توجد نتائج للمطابقة.' : 'No university match results available.')}</td></tr></tbody>`
  }

  const topResults = [...results]
    .filter((result) => result && typeof result === 'object')
    .sort((a, b) => {
      const aScore = Number(a.matchPercentage ?? a.recommendation_score ?? 0)
      const bScore = Number(b.matchPercentage ?? b.recommendation_score ?? 0)
      if (bScore !== aScore) return bScore - aScore
      return Number(b.isMatch ?? 0) - Number(a.isMatch ?? 0)
    })
    .slice(0, 5)

  const subjectScores = getLeadSubjectScores(submission)
  const subjectSummary = Object.keys(subjectScores).length > 0
    ? Object.entries(subjectScores)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join(' | ')
    : (isArabic ? 'لا توجد درجات' : 'No subject scores')

  const rowsHtml = topResults.map((result, index) => {
    const universityName = result.cleanUniversityName || result.university || 'Unknown university'
    const programName = result.programName || result.program || 'General'
    const matchLabel = result.isMatch ? (isArabic ? 'مؤهل' : 'Eligible') : (isArabic ? 'غير مؤهل' : 'Not Eligible')
    const missingText = result.missingRequirements && result.missingRequirements.length > 0
      ? result.missingRequirements.join(' • ')
      : (isArabic ? 'لا يوجد' : 'None')

    return `
      <tr>
        <td>${escapeHtml(String(index + 1))}</td>
        <td>${escapeHtml(universityName)}</td>
        <td>${escapeHtml(programName)}</td>
        <td>${escapeHtml(result.country || '—')}</td>
        <td>${escapeHtml(String(result.matchPercentage ?? 0))}%</td>
        <td>${escapeHtml(subjectSummary)}</td>
        <td>${escapeHtml(matchLabel)}</td>
        <td>${escapeHtml(missingText)}</td>
      </tr>`
  }).join('')

  return `<tbody>${rowsHtml}</tbody>`
}

function buildAiRecommendationSection(submission, matchResults, isArabic) {
  const countrySpecificData = parseObjectValue(submission.country_specific_data)
  const aiFields = countrySpecificData?._meta?.studyPath || {}

  const bestMatch = Array.isArray(matchResults) && matchResults.length > 0
    ? [...matchResults].sort((a, b) => Number(b.matchPercentage || 0) - Number(a.matchPercentage || 0))[0]
    : null

  const bestUniversity = bestMatch?.cleanUniversityName || bestMatch?.original_university_string || bestMatch?.university || aiFields.best_university_en || countrySpecificData?.best_university_en || 'N/A'
  const bestProgram = bestMatch?.programName || bestMatch?.program || aiFields.best_program_en || countrySpecificData?.best_program_en || 'General / N/A'

  const rationaleEn = submission?.ai_match_rationale_en
    || countrySpecificData?.ai_match_rationale_en
    || countrySpecificData?._meta?.ai_match_rationale_en
    || countrySpecificData?._meta?.studyPath?.ai_match_rationale_en
    || aiFields.why_best_university_en
    || countrySpecificData?.why_best_university_en
    || (Array.isArray(bestMatch?.missingRequirements) ? bestMatch.missingRequirements.join(', ') : '')
    || 'No rationale provided.'

  const rationaleAr = submission?.ai_match_rationale_ar
    || countrySpecificData?.ai_match_rationale_ar
    || countrySpecificData?._meta?.ai_match_rationale_ar
    || countrySpecificData?._meta?.studyPath?.ai_match_rationale_ar
    || 'لم يتم توفير شرح باللغة العربية.'

  if (!bestUniversity && !bestProgram && !rationaleEn) {
    return ''
  }

  return `
    <div style="margin-top: 18px; border: 1px solid #e9d5ff; background: #faf5ff; border-radius: 10px; padding: 12px;">
      <h2 style="margin: 0 0 8px; font-size: 14px; color: #6d28d9;">${escapeHtml(isArabic ? 'توصية الذكاء الاصطناعي' : 'AI Recommendation')}</h2>
      <p style="margin: 6px 0; font-size: 11px;"><strong>${escapeHtml(isArabic ? 'الجامعة' : 'University')}:</strong> ${escapeHtml(bestUniversity)}</p>
      <p style="margin: 6px 0; font-size: 11px;"><strong>${escapeHtml(isArabic ? 'البرنامج' : 'Program')}:</strong> ${escapeHtml(bestProgram)}</p>
      <p style="margin: 6px 0; font-size: 11px;"><strong>${escapeHtml(isArabic ? 'سبب التوصية' : 'Why this fit')}:</strong> ${escapeHtml(rationaleEn)}</p>
      <p style="margin: 6px 0; font-size: 11px;"><strong>${escapeHtml(isArabic ? 'السبب بالعربية' : 'Arabic rationale')}:</strong> ${escapeHtml(rationaleAr)}</p>
    </div>
  `
}

export async function exportUniversityMatchPdf(submission, matchResults, language = 'en') {
  const isArabic = language === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'
  const fullName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim() || submission.name || 'Client'
  const date = new Date().toLocaleDateString('en-GB')
  const html = `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(isArabic ? 'تصدير مطابقة الجامعات' : 'University Match Export')}</title>
  <style>
    @media print { @page { margin: 0; } body { padding: 20mm; } }
    body { font-family: Arial, sans-serif; color: #0f172a; direction: ${dir}; text-align: ${textAlign}; }
    h1 { font-size: 20px; margin-bottom: 6px; }
    h2 { font-size: 14px; margin-top: 18px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; }
    th { background: #f8fafc; }
    .header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 16px; }
    .meta { margin-top: 8px; font-size: 11px; }
    .note { margin-top: 10px; font-size: 10px; color: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(isArabic ? 'تقرير مطابقة الجامعات' : 'University Match Report')}</h1>
      <div class="meta">
        <div><strong>${escapeHtml(isArabic ? 'الاسم' : 'Name')}:</strong> ${escapeHtml(fullName)}</div>
        <div><strong>${escapeHtml(isArabic ? 'التاريخ' : 'Date')}:</strong> ${escapeHtml(date)}</div>
      </div>
    </div>
  </div>
  <h2>${escapeHtml(isArabic ? 'أفضل 5 نتائج مطابقة' : 'Top 5 Best Match Results')}</h2>
  ${buildAiRecommendationSection(submission, matchResults, isArabic)}
  ${renderLeadSubjectSummary(submission, isArabic)}
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(isArabic ? 'الرتبة' : 'Rank')}</th>
        <th>${escapeHtml(isArabic ? 'اسم الجامعة' : 'University Name')}</th>
        <th>${escapeHtml(isArabic ? 'اسم البرنامج' : 'Program Name')}</th>
        <th>${escapeHtml(isArabic ? 'الدولة' : 'Country')}</th>
        <th>${escapeHtml(isArabic ? 'نسبة المطابقة' : 'Match %')}</th>
        <th>${escapeHtml(isArabic ? 'درجات الطالب' : 'Student Scores')}</th>
        <th>${escapeHtml(isArabic ? 'الحالة' : 'Status')}</th>
        <th>${escapeHtml(isArabic ? 'المتطلبات المفقودة' : 'Missing Requirements')}</th>
      </tr>
    </thead>
    ${renderUniversityMatchRows(matchResults, isArabic, submission)}
  </table>
  <p class="note">${escapeHtml(isArabic ? 'هذه الوثيقة تصدر بناء على نتائج المطابقة المتاحة حالياً ولا تغني عن مراجعة المستشار.' : 'This document is generated from the current match results and is not a substitute for consultant review.')}</p>
</body>
</html>`

  return openPrintIframe(html)
}

export async function exportClientPdf(submission, language = 'en') {
  const isArabic = language === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'
  const countryData = parseObjectValue(submission.country_specific_data)
  const recommendation = parseObjectValue(countryData?._meta?.recommendation)
  const academicChanceData = parseObjectValue(submission.agency_internal_score)
  const firstChanceEntry = Object.values(academicChanceData).find((entry) => entry && typeof entry === 'object' && entry.percentage !== undefined)
  const academicChanceValue = firstChanceEntry?.percentage !== undefined
    ? Number(firstChanceEntry.percentage)
    : Number.isFinite(Number(submission.study_path_score))
      ? Number(Math.round(Number(submission.study_path_score) * 10))
      : NaN
  const academicChance = Number.isFinite(academicChanceValue) ? `${academicChanceValue}%` : 'N/A'
  const visaChanceValue = Number.isFinite(academicChanceValue) ? Math.min(75, academicChanceValue + 7) : null
  const visaChance = visaChanceValue !== null ? `${visaChanceValue}%` : 'N/A'
  const academicNum = parseInt(academicChance) || 0
  const visaNum = parseInt(visaChance) || 0

  const fullName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim() || submission.name || 'Client'
  const rawAiExplanation = submission.study_path_explanation ? String(submission.study_path_explanation) : (isArabic ? 'لا يوجد شرح متاح.' : 'No explanation provided.')
  const englishOnlyExplanation = rawAiExplanation.split(/---|التقييم باللغة العربية/)[0].trim()
  const academicExplanation = englishOnlyExplanation || (isArabic ? 'لا يوجد شرح متاح.' : 'No explanation provided.')
  const maskedUniversity = recommendation?.university
    ? `${recommendation.university.substring(0, 3)}*** University`
    : 'Top Ranked University'

  const universityTeaser = recommendation?.university
    ? (isArabic
      ? 'هذه فرصة مثيرة! تم تصنيف ملفك بشكل قوي لهذه الجامعة، ويمكننا مساعدتك على زيادة فرص قبولك بشكل أكبر من خلال خبرتنا.'
      : 'This is an exciting opportunity! Your profile is already a strong match for this university, and with our expert support you can optimize your chances even further.')
    : (isArabic
      ? 'هذه فرصة ممتازة لتطوير ملفك معنا والحصول على أعلى فرص القبول.'
      : 'This is a great opportunity to strengthen your file with us and maximize your admission chances.')

  const rawReasons = Array.isArray(recommendation?.reasons) ? recommendation.reasons : []
  const cleanReasons = rawReasons
    .slice(0, 3)
    .map((reason) => String(reason).replace(/\s*\(.*?\)/g, '').trim())
    .filter(Boolean)

  const reasonsList = cleanReasons.length > 0
    ? cleanReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')
    : `<li>${escapeHtml(isArabic ? 'مطابقة عامة لمتطلبات القبول' : 'General match to admission requirements')}</li>`

  const html = `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <title>Sefar Travel Services - Evaluation Report</title>
  <style>
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { padding: 10mm; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      direction: ${dir};
      text-align: ${textAlign};
      background-color: #ffffff;
      font-size: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-box { border-bottom: 3px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .agency-title { font-size: 15px; font-weight: bold; color: #0284c7; margin: 0; }
    .doc-title { font-size: 13px; font-weight: 600; color: #475569; margin: 4px 0 0 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
    .meta-table td { border: 1px solid #cbd5e1; padding: 7px 9px; }
    .meta-table td:nth-child(odd) { background: #f8fafc; font-weight: bold; width: 25%; }
    .badges-container { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px; margin: 10px 0; }
    .badge-label { font-size: 10px; color: #475569; text-align: center; margin-top: 6px; font-weight: bold; }
    .section-title { font-size: 12px; background: #0284c7; color: #ffffff; padding: 4px 8px; border-radius: 4px; margin: 10px 0 6px 0; font-weight: bold; }
    .no-break { page-break-inside: avoid; }
    .content-box { border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; background: #fafafa; font-size: 10px; line-height: 1.4; white-space: pre-wrap; unicode-bidi: plaintext; margin-bottom: 10px; }
    .exciting-box { border: 2px solid #eab308; padding: 12px; border-radius: 8px; background: #fefce8; font-size: 11px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(234, 179, 8, 0.2); }
    .highlight-text { font-size: 14px; font-weight: bold; color: #a16207; }
    .invoice-box { border: 2px dashed #059669; background: #ecfdf5; padding: 9px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; margin-bottom: 13px; gap: 10px; }
    .promo-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 10px; font-size: 11px; font-weight: bold; color: #0369a1; text-align: center; margin-bottom: 13px; }
    .disclaimer { font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 13px; line-height: 1.4; }
    .signature-area { margin-top: 22px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 10.5px; font-weight: bold; }
    .logo-img { max-height: 56px; width: auto; }
    .no-break { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div class="header-box no-break">
    <div>
      <p class="agency-title">${escapeHtml(isArabic ? 'وكالة سيفار ترافل سرفيس للاستشارات التعليمية' : 'Sefar Travel Services')}</p>
      <p class="doc-title">${escapeHtml(isArabic ? 'تقرير تقييم استشاري وفاتورة خدمات' : 'Consulting Evaluation Report & Invoice')}</p>
    </div>
    <div style="text-align: ${isArabic ? 'left' : 'right'}; font-size: 10px; color: #64748b;">
      <p style="margin: 0;"><strong>${escapeHtml(isArabic ? 'رقم المرجع' : 'Ref Code')}:</strong> ${escapeHtml(submission.access_code || '71998-STS')}</p>
      <p style="margin: 2px 0 0 0;"><strong>${escapeHtml(isArabic ? 'تاريخ التقييم' : 'Date')}:</strong> ${escapeHtml(new Date().toLocaleDateString('en-GB'))}</p>
    </div>
    <div>
      <img class="logo-img" src="${escapeHtml(logoPath)}" alt="Sefar Travel Services" />
    </div>
  </div>

  <table class="meta-table no-break">
    <tr>
      <td>${escapeHtml(isArabic ? 'اسم الزبون' : 'Client Name')}</td>
      <td>${escapeHtml(submission.first_name || submission.name || '')} ${escapeHtml(submission.last_name || '')}</td>
      <td>${escapeHtml(isArabic ? 'الضامن المالي' : 'Financial Sponsor')}</td>
      <td>${escapeHtml(submission.financial_sponsor || 'N/A')}</td>
    </tr>
    <tr>
      <td>${escapeHtml(isArabic ? 'رقم الهوية / الجواز' : 'Passport / ID')}</td>
      <td>${escapeHtml(submission.passport_number || submission.access_code || 'N/A')}</td>
      <td>${escapeHtml(isArabic ? 'الوجهة والدرجة' : 'Destination & Degree')}</td>
      <td>${escapeHtml(submission.selected_countries?.[0] || 'Poland')} | ${escapeHtml(submission.degree_type || 'Bachelor')}</td>
    </tr>
  </table>

  <div class="badges-container no-break">
    <div style="text-align: center;">
      <div style="width: 90px; height: 90px; border-radius: 50%; background: conic-gradient(#0284c7 ${academicNum}%, #e2e8f0 0); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
        <div style="width: 72px; height: 72px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #0f172a;">
          ${academicNum}%
        </div>
      </div>
      <div class="badge-label">${escapeHtml(isArabic ? 'نسبة القبول الأكاديمي' : 'Academic Acceptance Chance')}</div>
    </div>
    <div style="text-align: center;">
      <div style="width: 90px; height: 90px; border-radius: 50%; background: conic-gradient(#059669 ${visaNum}%, #e2e8f0 0); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
        <div style="width: 72px; height: 72px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #0f172a;">
          ${visaNum}%
        </div>
      </div>
      <div class="badge-label">${escapeHtml(isArabic ? 'نسبة نجاح الفيزا' : 'Visa Success Chance')}</div>
    </div>
  </div>

  <div class="section-title">${escapeHtml(isArabic ? 'الجامعة الموصى بها' : 'Suggested University Match')}</div>
  <div class="exciting-box">
    <p style="margin: 0 0 6px 0;"><strong>${escapeHtml(isArabic ? 'الجامعة المقترحة' : 'Suggested University')}:</strong> <span class="highlight-text">🎉 ${escapeHtml(maskedUniversity)}</span></p>
    <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(isArabic ? 'أسباب الترشيح' : 'Reasons for Match')}:</strong></p>
    <ul style="margin: 0; padding-inline-start: 18px;">${reasonsList}</ul>
    <p style="margin: 10px 0 0 0; font-weight: 700; color: #0f172a;">${escapeHtml(universityTeaser)}</p>
  </div>

  <div class="section-title">${escapeHtml(isArabic ? 'التقييم الأكاديمي' : 'Academic Evaluation')}</div>
  <div class="content-box">${escapeHtml(academicExplanation)}</div>

  <div class="promo-box">
    ${escapeHtml(isArabic ? 'مع وكالة سيفار، يمكنك تعزيز حظوظك بشكل كبير لضمان القبول الجامعي والتأشيرة!' : 'With Sefar Travel Services, you can significantly enhance your chances of securing your university admission and visa!')}
  </div>

  <div class="invoice-box">
      <div><strong>${escapeHtml(isArabic ? 'رسوم التقييم' : 'Evaluation Fee')}:</strong> 10,000 DZD - ${escapeHtml(isArabic ? 'غير قابلة للاسترداد' : 'Non-refundable')}</div>
      <div style="color: #059669; font-weight: bold; font-size: 13px; border: 1px solid #059669; padding: 4px 12px; border-radius: 4px;">${escapeHtml(isArabic ? 'تم الدفع / PAID' : 'PAID')}</div>
  </div>

  <div class="disclaimer">
    <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(isArabic ? 'تنويه هام للعميل' : 'Important Notice')}:</strong> ${escapeHtml(isArabic ? 'هذه الوثيقة والفاتورة تمثل تقييماً أولياً واستشارياً فقط لمدى قوة الملف، ولا تعني بأي حال من الأحوال أن إجراءات التسجيل الجامعي أو خطوات التأشيرة قد بدأت فعلياً. بدء الإجراءات يتطلب توقيع عقد منفصل بين العميل والوكالة.' : 'This document is a preliminary consultation and does not mean university or visa procedures have begun. Formal procedures require signing a separate contract.')}</p>
    <p style="margin: 0;"><strong>${escapeHtml(isArabic ? 'إخلاء مسؤولية سيادي' : 'Sovereign Disclaimer')}:</strong> ${escapeHtml(isArabic ? 'تلفت انتباهكم أن أقصى نسبة مئوية تمنحها وكالتنا لحظوظ الفيزا لا تتجاوز 80% مهما كانت قوة الملف. النسبة المتبقية تعود بشكل مطلق وحصري للقرار السيادي للقنصل وللتقييم الشخصي للعميل يوم المقابلة. الوكالة تضمن صحة الإجراءات ولكنها لا تتدخل في القرارات السيادية للدول.' : 'Our maximum estimated visa chance never exceeds 80%. The remaining percentage depends entirely on the sovereign decision of the consulate. We guarantee the accuracy of our procedures but do not interfere with sovereign state decisions.')}</p>
  </div>

  <div class="signature-area">
    <div>Sefar Travel Services</div>
    <div>${escapeHtml(isArabic ? 'المستشار: أسامة لؤي منصورية' : 'Consultant: Oussama Louai eddine Mansouria')}</div>
  </div>
</body>
</html>`

  return openPrintIframe(html)
}

export async function exportSubmissionPdf(submission, language = 'en') {
  const isArabic = language === 'ar'
  const countryData = parseObjectValue(submission.country_specific_data)
  const sectionRows = buildSectionRows(submission, isArabic, countryData)
  const sectionTablesHtml = [
    renderSectionTable(isArabic ? 'المعلومات الشخصية' : 'Personal information', sectionRows.personalRows, isArabic),
    renderSectionTable(isArabic ? 'المعلومات الأكاديمية' : 'Academic information', sectionRows.academicRows, isArabic),
    renderSectionTable(isArabic ? 'المعلومات المالية' : 'Financial information', sectionRows.financialRows, isArabic),
  ].join('')

  const aiEvaluationSectionHtml = renderAiEvaluationSection(submission, isArabic)
  const recommendationSectionHtml = renderRecommendationSection(countryData, isArabic)
  const countryRowsHtml = renderCountryTableRows(countryData)
  const chanceRowsHtml = renderChanceRows(parseObjectValue(submission.agency_internal_score), translations[language] || translations.en, isArabic)

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="${language}" dir="${isArabic ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(isArabic ? 'تفاصيل الطلب' : 'Submission Details')}</title>
    <style>
      @media print {
        @page { margin: 0; }
        body { padding: 2cm; }
      }
      body { font-family: Arial, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: ${isArabic ? 'right' : 'left'}; vertical-align: top; }
      th { background: #f8fafc; width: 35%; }
      h2 { font-size: 14px; background: #e2e8f0; padding: 8px; border-radius: 4px; margin-bottom: 10px; }
      .ai-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; white-space: pre-wrap; unicode-bidi: plaintext; }
    </style>
  </head>
  <body>
    <div style="margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
      <h1 style="font-size: 20px; margin: 0;">${escapeHtml(isArabic ? 'تفاصيل الطلب' : 'Submission details')}</h1>
    </div>
    ${sectionTablesHtml}
    ${aiEvaluationSectionHtml}
    ${recommendationSectionHtml}
    <h2>${escapeHtml(isArabic ? 'جدول بيانات الدول' : 'Country-specific details')}</h2>
    <table>${countryRowsHtml}</table>
    <h2>${escapeHtml(isArabic ? 'نتائج نسبة القبول مع التفاصيل' : 'Chance calculator results')}</h2>
    <table>${chanceRowsHtml}</table>
  </body>
  </html>
  `

  return openPrintIframe(htmlContent)
}
