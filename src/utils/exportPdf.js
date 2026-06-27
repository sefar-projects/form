import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { calculateChances } from './chancesCalculator'
import { translations } from '../i18n/translations'

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
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

function pushRowIfPresent(rows, labelAr, labelEn, value, isArabic) {
  if (value === null || value === undefined || value === '') return
  rows.push([isArabic ? labelAr : labelEn, formatValue(value)])
}

function buildSectionRows(submission, isArabic, countryData) {
  const meta = countryData._meta || {}
  const personalMeta = meta.personal || {}
  const academicMeta = meta.academic || {}
  const financialMeta = meta.financial || {}

  const fullName = pickFirstValue(
    submission.name,
    `${submission.first_name || ''} ${submission.last_name || ''}`.trim(),
  )

  const personalRows = []
  const academicRows = []
  const financialRows = []

  pushRowIfPresent(personalRows, 'الاسم', 'Name', fullName, isArabic)
  pushRowIfPresent(personalRows, 'البريد الإلكتروني', 'Email', submission.email, isArabic)
  pushRowIfPresent(personalRows, 'رقم الهاتف', 'Phone', submission.phone_number, isArabic)
  pushRowIfPresent(personalRows, 'تاريخ الميلاد', 'Date of birth', submission.date_of_birth, isArabic)
  pushRowIfPresent(personalRows, 'الجنسية', 'Nationality', pickFirstValue(personalMeta.nationality, submission.nationality), isArabic)
  pushRowIfPresent(personalRows, 'لديه جنسية/إقامة أخرى', 'Has other nationality/residency', personalMeta.hasOtherNationalityOrResidency, isArabic)
  pushRowIfPresent(personalRows, 'تفاصيل الجنسية/الإقامة الأخرى', 'Other nationality/residency details', personalMeta.otherNationalityOrResidencyDetails, isArabic)
  pushRowIfPresent(personalRows, 'يملك جواز سفر', 'Has passport', personalMeta.hasPassport, isArabic)
  pushRowIfPresent(personalRows, 'تاريخ انتهاء الجواز', 'Passport expiry date', personalMeta.passportExpiryDate, isArabic)
  pushRowIfPresent(personalRows, 'اسم الأب/الأم', 'Parent name', personalMeta.parentName, isArabic)
  pushRowIfPresent(personalRows, 'هاتف الأب/الأم', 'Parent phone', personalMeta.parentPhone, isArabic)
  pushRowIfPresent(personalRows, 'رمز الوصول', 'Access code', submission.access_code, isArabic)

  pushRowIfPresent(academicRows, 'نوع الشهادة', 'Degree type', submission.degree_type, isArabic)
  pushRowIfPresent(academicRows, 'التخصص العام', 'General study field', pickFirstValue(academicMeta.studyField, countryData._meta?.studyField), isArabic)
  pushRowIfPresent(academicRows, 'المعدل النهائي', 'Final mark', submission.gpa, isArabic)
  pushRowIfPresent(academicRows, 'مستوى الإنجليزية', 'English level', submission.english_level, isArabic)
  pushRowIfPresent(academicRows, 'تاريخ آخر شهادة', 'Last degree date', academicMeta.lastDegreeDate, isArabic)
  pushRowIfPresent(academicRows, 'سنوات الفراغ', 'Gap years', academicMeta.gapYears, isArabic)
  pushRowIfPresent(academicRows, 'شرح سنوات الفراغ', 'Gap years explanation', academicMeta.gapYearsExplanation, isArabic)
  pushRowIfPresent(academicRows, 'نوع شهادة اللغة', 'Language certificate type', academicMeta.languageCertificateType, isArabic)
  pushRowIfPresent(academicRows, 'اسم شهادة اللغة', 'Language certificate name', academicMeta.languageCertificateName, isArabic)
  pushRowIfPresent(academicRows, 'علامة شهادة اللغة', 'Language certificate score', academicMeta.languageCertificateScore, isArabic)
  pushRowIfPresent(academicRows, 'تاريخ شهادة اللغة', 'Language certificate date', academicMeta.languageCertificateDate, isArabic)
  pushRowIfPresent(academicRows, 'درس بالإنجليزية سابقًا', 'Studied in English before', academicMeta.studiedInEnglishBefore, isArabic)
  pushRowIfPresent(academicRows, 'البلدان المختارة', 'Selected countries', submission.selected_countries, isArabic)

  pushRowIfPresent(financialRows, 'الجهة الممولة', 'Financial sponsor', submission.financial_sponsor, isArabic)
  pushRowIfPresent(financialRows, 'تفاصيل كفالة الأقارب', 'Relatives sponsorship details', financialMeta.relativesSponsorDetails, isArabic)
  pushRowIfPresent(financialRows, 'الدخل السنوي للممول', 'Sponsor annual income', financialMeta.annualSponsorIncome, isArabic)
  pushRowIfPresent(financialRows, 'الحالة المهنية للممول', 'Sponsor employment status', financialMeta.sponsorEmploymentStatus, isArabic)
  pushRowIfPresent(financialRows, 'نطاق ميزانية الرسوم', 'Tuition budget range', financialMeta.tuitionBudgetRange, isArabic)
  pushRowIfPresent(financialRows, 'توفر الأموال', 'Funds availability timeline', financialMeta.fundsAvailabilityTimeline, isArabic)
  pushRowIfPresent(financialRows, 'شرح وضع الأموال', 'Funds explanation', financialMeta.fundsExplanation, isArabic)
  pushRowIfPresent(financialRows, 'معلومات إضافية', 'Additional information', financialMeta.additionalInfo, isArabic)

  return {
    personalRows,
    academicRows,
    financialRows,
  }
}

function renderSectionTable(title, rows, isArabic) {
  const renderedRows = rows.length > 0
    ? rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')
    : `<tr><td colspan="2">${escapeHtml(isArabic ? 'لا توجد بيانات' : 'No data')}</td></tr>`

  return `
    <section style="margin-bottom:14px;">
      <h2 style="margin:0 0 8px 0;font-size:14px;color:#0f172a;background:#e2e8f0;padding:8px 10px;border-radius:8px;">${escapeHtml(title)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:11px;background:#ffffff;">
        <tbody>
          ${renderedRows}
        </tbody>
      </table>
    </section>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getChanceDetails(submission) {
  const stored = parseObjectValue(submission.agency_internal_score)
  const hasDetails = Object.values(stored).some((item) => item && typeof item === 'object' && 'percentage' in item)

  if (hasDetails) {
    return stored
  }

  return calculateChances(
    submission.gpa,
    submission.english_level,
    submission.selected_countries || [],
    submission.degree_type,
  )
}

function renderBasicRows(submission, isArabic, countryData) {
  return buildSectionRows(submission, isArabic, countryData)
}

function renderCountryTableRows(countryData, t) {
  const rows = []

  Object.entries(countryData).forEach(([countryKey, answers]) => {
    if (countryKey === '_meta') return

    Object.entries(answers || {}).forEach(([fieldId, answer]) => {
      rows.push([
        t.countryNames?.[countryKey] || countryKey,
        t.countryFieldLabels?.[fieldId] || (fieldId === 'intendedStudyField' ? t.intendedStudyFieldLabel : fieldId),
        formatValue(answer),
      ])
    })
  })

  return rows
}

function renderChanceRows(scoreData, t, isArabic) {
  const rows = []

  Object.entries(scoreData).forEach(([countryKey, result]) => {
    const countryName = t.countryNames?.[countryKey] || countryKey
    const percentage = typeof result === 'object' ? result.percentage : result

    let explanation = 'Legacy score record'
    if (typeof result === 'object' && result.breakdown) {
      const b = result.breakdown
      explanation = [
        `Base ${b.baseScore}`,
        `Mark +${b.finalMarkContribution}`,
        `Language +${b.languageContribution}`,
        `Degree +${b.degreeContribution}`,
        `Penalty -${b.minimumMarkPenalty}`,
        `Minimum ${b.minimumRequiredMark}/20`,
      ].join(' | ')

      if (isArabic) {
        explanation = [
          `الأساس ${b.baseScore}`,
          `المعدل +${b.finalMarkContribution}`,
          `اللغة +${b.languageContribution}`,
          `الشهادة +${b.degreeContribution}`,
          `الخصم -${b.minimumMarkPenalty}`,
          `الحد الأدنى ${b.minimumRequiredMark}/20`,
        ].join(' | ')
      }
    }

    rows.push([countryName, `${percentage}%`, explanation])
  })

  return rows
}

export async function exportSubmissionPdf(submission, language = 'en') {
  const isArabic = language === 'ar'
  const t = translations[language] || translations.en
  const title = isArabic ? 'تفاصيل الطلب' : 'Submission details'
  const subtitle = isArabic ? 'نموذج دراسة سيفار' : 'Sefar study form'

  const countryData = parseObjectValue(submission.country_specific_data)
  const scoreData = getChanceDetails(submission)

  const sectionRows = renderBasicRows(submission, isArabic, countryData)
  const sectionTablesHtml = [
    renderSectionTable(isArabic ? 'البيانات الشخصية' : 'Personal details', sectionRows.personalRows, isArabic),
    renderSectionTable(isArabic ? 'البيانات الأكاديمية' : 'Academic details', sectionRows.academicRows, isArabic),
    renderSectionTable(isArabic ? 'البيانات المالية' : 'Financial details', sectionRows.financialRows, isArabic),
  ].join('')

  const countryRows = renderCountryTableRows(countryData, t)
  const countryRowsHtml = countryRows
    .map(([country, field, value]) => `<tr><td>${escapeHtml(country)}</td><td>${escapeHtml(field)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join('')

  const chanceRows = renderChanceRows(scoreData, t, isArabic)
  const chanceRowsHtml = chanceRows
    .map(([country, chance, details]) => `<tr><td>${escapeHtml(country)}</td><td>${escapeHtml(chance)}</td><td>${escapeHtml(details)}</td></tr>`)
    .join('')

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '0'
  wrapper.style.top = '0'
  wrapper.style.width = '900px'
  wrapper.style.background = '#ffffff'
  wrapper.style.padding = '24px'
  wrapper.style.color = '#0f172a'
  wrapper.style.fontFamily = 'Arial, Tahoma, sans-serif'
  wrapper.style.zIndex = '-1'
  wrapper.style.pointerEvents = 'none'
  wrapper.dir = isArabic ? 'rtl' : 'ltr'

  wrapper.innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:20px;background:#f8fafc;">
      <h1 style="margin:0 0 4px 0;font-size:24px;color:#0f172a;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 16px 0;font-size:13px;color:#475569;">${escapeHtml(subtitle)}</p>

      ${sectionTablesHtml}

      <h2 style="font-size:16px;margin:16px 0 8px 0;">${escapeHtml(isArabic ? 'جدول بيانات الدول' : 'Country-specific details')}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:11px;background:#ffffff;">
        <thead>
          <tr>
            <th style="text-align:left;">${escapeHtml(isArabic ? 'الدولة' : 'Country')}</th>
            <th style="text-align:left;">${escapeHtml(isArabic ? 'الحقل' : 'Field')}</th>
            <th style="text-align:left;">${escapeHtml(isArabic ? 'القيمة' : 'Value')}</th>
          </tr>
        </thead>
        <tbody>
          ${countryRowsHtml || `<tr><td colspan="3">${escapeHtml(isArabic ? 'لا توجد بيانات' : 'No data')}</td></tr>`}
        </tbody>
      </table>

      <h2 style="font-size:16px;margin:16px 0 8px 0;">${escapeHtml(isArabic ? 'نتائج نسبة القبول مع التفاصيل' : 'Chance calculator results with details')}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:11px;background:#ffffff;">
        <thead>
          <tr>
            <th style="text-align:left;">${escapeHtml(isArabic ? 'الدولة' : 'Country')}</th>
            <th style="text-align:left;">${escapeHtml(isArabic ? 'النسبة' : 'Chance')}</th>
            <th style="text-align:left;">${escapeHtml(isArabic ? 'سبب النتيجة' : 'Why this score')}</th>
          </tr>
        </thead>
        <tbody>
          ${chanceRowsHtml || `<tr><td colspan="3">${escapeHtml(isArabic ? 'لا توجد بيانات' : 'No data')}</td></tr>`}
        </tbody>
      </table>
    </div>
  `

  wrapper.querySelectorAll('th, td').forEach((cell) => {
    cell.style.border = '1px solid #e2e8f0'
    cell.style.padding = '6px'
    cell.style.verticalAlign = 'top'
  })

  document.body.appendChild(wrapper)

  try {
    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })

    const imageData = canvas.toDataURL('image/png')
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 16
    const printableWidth = pageWidth - margin * 2
    const printableHeight = pageHeight - margin * 2
    const imageHeight = (canvas.height * printableWidth) / canvas.width

    let renderedHeight = imageHeight
    let positionY = margin

    doc.addImage(imageData, 'PNG', margin, positionY, printableWidth, imageHeight)
    renderedHeight -= printableHeight

    while (renderedHeight > 0) {
      positionY -= printableHeight
      doc.addPage()
      doc.addImage(imageData, 'PNG', margin, positionY, printableWidth, imageHeight)
      renderedHeight -= printableHeight
    }

    doc.save(`submission-${submission.id || 'download'}.pdf`)
  } finally {
    document.body.removeChild(wrapper)
  }
}
