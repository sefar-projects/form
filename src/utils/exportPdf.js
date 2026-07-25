import { translations } from '../i18n/translations'

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

export async function exportClientPdf(submission, language = 'en') {
  const isArabic = language === 'ar'
  const title = isArabic ? 'تقرير العميل' : 'Client Report'
  const fullName = formatValue(submission.name || `${submission.first_name || ''} ${submission.last_name || ''}`.trim())
  const scoreText = Number.isFinite(Number(submission.study_path_score)) ? `${submission.study_path_score}/10` : 'N/A'
  const explanation = submission.study_path_explanation ? formatValue(submission.study_path_explanation) : (isArabic ? 'لا يوجد شرح متاح.' : 'No explanation provided.')
  const rows = buildSectionRows(submission, isArabic, parseObjectValue(submission.country_specific_data))
  const personalHtml = renderSectionTable(isArabic ? 'المعلومات الشخصية' : 'Personal information', rows.personalRows, isArabic)
  const academicHtml = renderSectionTable(isArabic ? 'المعلومات الأكاديمية' : 'Academic information', rows.academicRows, isArabic)
  const financialHtml = renderSectionTable(isArabic ? 'المعلومات المالية' : 'Financial information', rows.financialRows, isArabic)

  const html = `<!DOCTYPE html>
<html lang="${language}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
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
  </style>
</head>
<body>
  <div style="margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
    <h1 style="font-size: 20px; margin: 0;">${escapeHtml(title)}</h1>
  </div>
  ${personalHtml}
  ${academicHtml}
  ${financialHtml}
  <div class="ai-box" style="border:1px solid #e2e8f0;padding:12px;border-radius:8px;white-space:pre-wrap;unicode-bidi:plaintext;">
    <h2>${escapeHtml(isArabic ? 'تقييم الذكاء الصناعي' : 'AI Evaluation')}</h2>
    <p><strong>${escapeHtml(isArabic ? 'درجة مسار الدراسة' : 'Study path score')}:</strong> ${escapeHtml(scoreText)}</p>
    <p>${escapeHtml(explanation)}</p>
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
