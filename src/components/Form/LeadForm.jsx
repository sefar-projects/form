import { useEffect, useMemo, useState } from 'react'
import { countriesConfig } from '../../config/countriesConfig'
import { consumeAccessCode } from '../../services/accessCodeService'
import { evaluateStudyPath, fetchUniversityCriteria, submitLead } from '../../services/supabaseService'
import { calculateChances, compareWithAllUniversities, suggestBestUniversity } from '../../utils/chancesCalculator'
import { normalizeLeadData } from '../../utils/normalizeLead'
import { translations } from '../../i18n/translations'
import logo from '../../assets/logo.png'
import { exportClientPdf } from '../../utils/exportPdf'
import LandingPage from './LandingPage'
import StepOne from './StepOne'
import StepTwo from './StepTwo'
import StepThree from './StepThree'
import StepFour from './StepFour.jsx'
import AdminLogin from '../Admin/AdminLogin'
import DashboardPanel from '../Dashboard/DashboardPanel'

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  nationality: '',
  hasOtherNationalityOrResidency: '',
  otherNationalityOrResidencyDetails: '',
  hasPassport: '',
  passportExpiryDate: '',
  parentName: '',
  parentPhone: '',

  degreeType: '',
  studyField: '',
  finalMark: '',
  lastDegreeDate: '',
  gapYears: '',
  gapYearsExplanation: '',
  englishLevel: '',
  languageCertificateType: '',
  languageCertificateName: '',
  languageCertificateScore: '',
  languageCertificateDate: '',
  studiedInEnglishBefore: '',

  selectedCountries: [],
  dynamicAnswers: {},

  financialSponsor: '',
  relativesSponsorDetails: '',
  annualSponsorIncome: '',
  sponsorEmploymentStatus: '',
  sponsorWorkplace: '',
  sponsorOccupation: '',
  tuitionBudgetRange: '',
  fundsAvailabilityTimeline: '',
  fundsExplanation: '',
  additionalInfo: '',
}

function LeadForm() {
  const [language, setLanguage] = useState('en')
  const [subjects, setSubjects] = useState([{ name: '', customName: '', score: '' }])
  const [additionalSponsors, setAdditionalSponsors] = useState([])
  const [showIntro, setShowIntro] = useState(true)
  const [showAccessCode, setShowAccessCode] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeTier, setAccessCodeTier] = useState('full')
  const [step, setStep] = useState(1)
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState('')
  const [stepErrors, setStepErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [universityRules, setUniversityRules] = useState([])
  const [submittedLeadData, setSubmittedLeadData] = useState(null)
  const [fullMatchList, setFullMatchList] = useState([])
  const [bestMatch, setBestMatch] = useState(null)

  const t = translations[language] || translations.en
  const normalizedAccessCode = `${accessCode}`.trim().toUpperCase().replaceAll(/\s+/g, '')
  const showLandingPage = !isCompleted && (showIntro || showAccessCode) && !showAdmin && !showDashboard

  const englishLevelForScoring = useMemo(() => {
    if (
      (values.languageCertificateType === 'IELTS' || values.languageCertificateType === 'TOEFL')
      && values.languageCertificateScore
    ) {
      return `${values.languageCertificateType} ${values.languageCertificateScore}`
    }

    return values.englishLevel
  }, [values.languageCertificateType, values.languageCertificateScore, values.englishLevel])

  useEffect(() => {
    document.title = t.siteTitle
  }, [t.siteTitle])

  useEffect(() => {
    const loadUniversityRules = async () => {
      try {
        const rows = await fetchUniversityCriteria()
        setUniversityRules(rows)
      } catch {
        setUniversityRules([])
      }
    }

    loadUniversityRules()
  }, [])

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setError('')
    setStepErrors((current) => ({ ...current, [field]: '' }))
  }

  const updateDynamicAnswer = (countryName, fieldId, value) => {
    setValues((current) => ({
      ...current,
      dynamicAnswers: {
        ...current.dynamicAnswers,
        [countryName]: {
          ...(current.dynamicAnswers[countryName] || {}),
          [fieldId]: value,
        },
      },
    }))
    setStepErrors((current) => ({ ...current, [`${countryName}.${fieldId}`]: '' }))
  }

  const toggleCountry = (countryName) => {
    setValues((current) => {
      const hasCountry = current.selectedCountries.includes(countryName)
      const selectedCountries = hasCountry
        ? current.selectedCountries.filter((country) => country !== countryName)
        : [...current.selectedCountries, countryName]

      return {
        ...current,
        selectedCountries: selectedCountries.slice(0, 3),
      }
    })
    setError('')
    setStepErrors((current) => ({ ...current, countrySelection: '' }))
  }

  const handleAccessVerified = ({ code, tier }) => {
    setAccessCode(code)
    setAccessCodeTier(tier)
    setShowAccessCode(false)
    setShowIntro(false)
    setStep(1)
    setError('')
    setStepErrors({})
  }

  const handleStepOneNext = () => {
    const errors = {}

    if (!values.firstName.trim()) errors.firstName = t.validation.firstName
    if (!values.lastName.trim()) errors.lastName = t.validation.lastName

    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = t.validation.email
    }

    if (!values.phone.trim()) errors.phone = t.validation.phone
    if (!values.dob) errors.dob = t.validation.dob
    if (!values.nationality.trim()) errors.nationality = t.validation.nationality
    if (!values.hasOtherNationalityOrResidency) errors.hasOtherNationalityOrResidency = t.validation.hasOtherNationalityOrResidency

    if (values.hasOtherNationalityOrResidency === 'Yes' && !values.otherNationalityOrResidencyDetails.trim()) {
      errors.otherNationalityOrResidencyDetails = t.validation.otherNationalityOrResidencyDetails
    }

    if (!values.hasPassport) errors.hasPassport = t.validation.hasPassport

    if (values.hasPassport === 'Yes' && !values.passportExpiryDate) {
      errors.passportExpiryDate = t.validation.passportExpiryDate
    }

    if (!values.parentName.trim()) errors.parentName = t.validation.parentName
    if (!values.parentPhone.trim()) errors.parentPhone = t.validation.parentPhone

    setStepErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError(t.validation.generic)
      return
    }

    setStep(2)
    setError('')
  }

  const handleStepTwoNext = () => {
    if (values.selectedCountries.length === 0) {
      setStepErrors({ countrySelection: t.validation.countrySelection })
      setError(t.validation.countrySelection)
      return
    }

    setStep(3)
    setError('')
    setStepErrors({})
  }

  const handleStepThreeNext = () => {
    const errors = {}

    if (!values.degreeType.trim()) errors.degreeType = t.validation.degreeType
    if (!values.studyField.trim()) errors.studyField = t.validation.studyField
    if (!values.finalMark) errors.finalMark = t.validation.finalMark
    if (!values.lastDegreeDate) errors.lastDegreeDate = t.validation.lastDegreeDate
    if (!values.gapYears) errors.gapYears = t.validation.gapYears

    if (values.gapYears === 'Two years or more' && !values.gapYearsExplanation.trim()) {
      errors.gapYearsExplanation = t.validation.gapYearsExplanation
    }

    if (!values.englishLevel) errors.englishLevel = t.validation.english
    if (!values.languageCertificateType) errors.languageCertificateType = t.validation.languageCertificateType

    if (values.languageCertificateType !== 'None') {
      if (!values.languageCertificateScore.trim()) errors.languageCertificateScore = t.validation.languageCertificateScore
      if (!values.languageCertificateDate) errors.languageCertificateDate = t.validation.languageCertificateDate
    }

    if (values.languageCertificateType === 'Other' && !values.languageCertificateName.trim()) {
      errors.languageCertificateName = t.validation.languageCertificateName
    }

    if (!values.studiedInEnglishBefore) errors.studiedInEnglishBefore = t.validation.studiedInEnglishBefore

    values.selectedCountries.forEach((countryName) => {
      const countryConfig = values.dynamicAnswers[countryName] || {}

      const requiredCountryFields = [
        'desiredLevel',
        'specialization1',
        'universityType',
        'housingPreference',
        'studyStartYear',
        'rankingInterest',
        'scholarshipInterest',
      ]

      requiredCountryFields.forEach((fieldKey) => {
        if (!countryConfig[fieldKey]?.trim()) {
          errors[`${countryName}.${fieldKey}`] = t.validation.dynamic
        }
      })

      ;(countriesConfig[countryName]?.dynamicFields || []).forEach((field) => {
        const fieldValue = countryConfig[field.id]
        if (!fieldValue) {
          errors[`${countryName}.${field.id}`] = t.validation.dynamic
        }
      })
    })

    setStepErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError(t.validation.dynamic)
      return
    }

    setStep(4)
    setError('')
  }

  const handleSubmit = async () => {
    const errors = {}

    if (!values.financialSponsor) errors.financialSponsor = t.validation.financialSponsor
    if (values.financialSponsor === 'Relatives' && !values.relativesSponsorDetails.trim()) {
      errors.relativesSponsorDetails = t.validation.relativesSponsorDetails
    }

    if (!values.annualSponsorIncome.trim()) errors.annualSponsorIncome = t.validation.annualSponsorIncome
    if (!values.sponsorEmploymentStatus) errors.sponsorEmploymentStatus = t.validation.sponsorEmploymentStatus
    if (['Business owner', 'Employee'].includes(values.sponsorEmploymentStatus)) {
      if (!values.sponsorWorkplace.trim()) errors.sponsorWorkplace = t.validation.sponsorWorkplace
      if (!values.sponsorOccupation.trim()) errors.sponsorOccupation = t.validation.sponsorOccupation
    }
    additionalSponsors.forEach((sponsor, index) => {
      if (!sponsor.name.trim()) errors[`additionalSponsor.${index}.name`] = t.validation.additionalSponsorName
      if (!sponsor.relationship) errors[`additionalSponsor.${index}.relationship`] = t.validation.financialSponsor
      if (!sponsor.annualIncome.trim()) errors[`additionalSponsor.${index}.annualIncome`] = t.validation.annualSponsorIncome
      if (!sponsor.employmentStatus) errors[`additionalSponsor.${index}.employmentStatus`] = t.validation.sponsorEmploymentStatus
      if (['Business owner', 'Employee'].includes(sponsor.employmentStatus)) {
        if (!sponsor.workplace.trim()) errors[`additionalSponsor.${index}.workplace`] = t.validation.sponsorWorkplace
        if (!sponsor.occupation.trim()) errors[`additionalSponsor.${index}.occupation`] = t.validation.sponsorOccupation
      }
    })
    if (!values.tuitionBudgetRange) errors.tuitionBudgetRange = t.validation.tuitionBudgetRange
    if (!values.fundsAvailabilityTimeline) errors.fundsAvailabilityTimeline = t.validation.fundsAvailabilityTimeline

    if (values.fundsAvailabilityTimeline === 'No' && !values.fundsExplanation.trim()) {
      errors.fundsExplanation = t.validation.fundsExplanation
    }

    setStepErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError(t.validation.dynamic)
      return
    }

    setError('')
    setSuccessMessage('')
    setSubmissionStatus('Analyzing profile and evaluating study path logic...')
    setIsSubmitting(true)

    try {
      const countrySpecificData = {
        ...values.dynamicAnswers,
        _meta: {
          personal: {
            nationality: values.nationality,
            hasOtherNationalityOrResidency: values.hasOtherNationalityOrResidency,
            otherNationalityOrResidencyDetails: values.otherNationalityOrResidencyDetails,
            hasPassport: values.hasPassport,
            passportExpiryDate: values.passportExpiryDate,
            parentName: values.parentName,
            parentPhone: values.parentPhone,
          },
          academic: {
            studyField: values.studyField,
            lastDegreeDate: values.lastDegreeDate,
            gapYears: values.gapYears,
            gapYearsExplanation: values.gapYearsExplanation,
            subject_scores: {},
            languageCertificateType: values.languageCertificateType,
            languageCertificateName: values.languageCertificateName,
            languageCertificateScore: values.languageCertificateScore,
            languageCertificateDate: values.languageCertificateDate,
            studiedInEnglishBefore: values.studiedInEnglishBefore,
          },
          financial: {
            sponsor: values.financialSponsor,
            relativesSponsorDetails: values.relativesSponsorDetails,
            annualSponsorIncome: values.annualSponsorIncome,
            sponsorEmploymentStatus: values.sponsorEmploymentStatus,
            sponsorWorkplace: values.sponsorWorkplace,
            sponsorOccupation: values.sponsorOccupation,
            additionalSponsors,
            tuitionBudgetRange: values.tuitionBudgetRange,
            fundsAvailabilityTimeline: values.fundsAvailabilityTimeline,
            fundsExplanation: values.fundsExplanation,
            additionalInfo: values.additionalInfo,
          },
        },
      }

      const firstCountry = values.selectedCountries[0]
      const firstCountryAnswers = values.dynamicAnswers[firstCountry] || {}
      const targetDegree = `${firstCountryAnswers.desiredLevel || values.degreeType || ''} ${firstCountryAnswers.specialization1 || values.studyField || ''}`.trim()
      const previousDegree = `${values.degreeType || 'Previous degree'} in ${values.studyField || 'Unknown field'}`

      const subjectScores = subjects.reduce((scores, subject) => {
        const key = subject.name === 'Other' ? (subject.customName || '').trim() : subject.name
        if (key && subject.score !== '') {
          scores[key] = Number.parseFloat(subject.score)
        }
        return scores
      }, {})
      countrySpecificData._meta.academic.subject_scores = subjectScores

      const rawLeadData = {
        gpa: values.finalMark,
        english_level: englishLevelForScoring,
        selected_countries: values.selectedCountries,
        degree_type: values.degreeType,
        budget_availability: values.tuitionBudgetRange,
        date_of_birth: values.dob,
        last_degree_date: values.lastDegreeDate,
        studied_in_english_before: values.studiedInEnglishBefore,
        subject_scores: subjectScores,
        country_specific_data: countrySpecificData,
        previousDegree,
        targetDegree,
      }

      const normalizedLeadInput = normalizeLeadData(rawLeadData)
      const fullMatchList = compareWithAllUniversities(normalizedLeadInput, universityRules)
      const preliminaryBestMatch = suggestBestUniversity(fullMatchList, normalizedLeadInput)
      setFullMatchList(fullMatchList)
      setBestMatch(preliminaryBestMatch)

      const aiEvaluationData = accessCodeTier === 'free'
        ? {
            relevance_score: null,
            reasoning: '🔒 AI Evaluation is locked on the Free Tier.',
            reasoning_ar: '🔒 التقييم الذكي مغلق في النسخة المجانية.',
            actionable_advice_en: ['Upgrade to the full consultation to unlock AI insights.'],
            actionable_advice_ar: ['قم بالترقية إلى الاستشارة الكاملة لفتح الرؤى الذكية.'],
            recommended_major_en: null,
          }
        : await evaluateStudyPath(normalizedLeadInput)

      countrySpecificData._meta.studyPath = {
        previousDegree,
        targetDegree,
        ...aiEvaluationData,
        score: aiEvaluationData.relevance_score,
      }

      const scorePayload = calculateChances(
        normalizedLeadInput,
        universityRules,
        aiEvaluationData.relevance_score,
      )

      const recommendation = preliminaryBestMatch

      countrySpecificData._meta.recommendation = recommendation
      const reportLeadData = {
        ...rawLeadData,
        first_name: values.firstName,
        last_name: values.lastName,
        name: `${values.firstName} ${values.lastName}`.trim(),
        tier: accessCodeTier,
        country_specific_data: countrySpecificData,
        access_code: normalizedAccessCode,
        subject_scores: rawLeadData.subject_scores,
      }

      await submitLead({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        sponsor: values.financialSponsor,
        budget: values.tuitionBudgetRange,
        degreeType: values.degreeType,
        studyField: values.studyField,
        finalMark: values.finalMark,
        englishLevel: englishLevelForScoring,
        selectedCountries: values.selectedCountries,
        agencyInternalScore: scorePayload,
        studyPathScore: aiEvaluationData.relevance_score,
        studyPathExplanation: aiEvaluationData.reasoning,
        countrySpecificData,
        accessCode: normalizedAccessCode,
        tier: accessCodeTier,
      })

      if (accessCodeTier !== 'free') {
        const consumed = await consumeAccessCode(normalizedAccessCode)
        if (!consumed) {
          throw new Error(t.accessCodeError)
        }
      }

      setSuccessMessage(t.submissionSuccess)
      setSubmissionStatus('')
      setSubmittedLeadData(reportLeadData)
      setValues(initialValues)
      setIsCompleted(true)
      setStepErrors({})
    } catch (submissionError) {
      setError(submissionError.message || 'Unable to submit the lead right now.')
      setSubmissionStatus('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className={
          showLandingPage || isCompleted
            ? 'w-full'
            : 'w-full rounded-[2rem] border border-sky-100 bg-white/95 p-6 shadow-[0_20px_80px_-20px_rgba(14,165,233,0.35)] backdrop-blur sm:p-8'
        }
      >
        {!showLandingPage ? (
          <div className="mb-8 flex flex-col gap-4 border-b border-sky-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt={t.agencyName} className="h-14 w-14 rounded-2xl object-contain ring-1 ring-sky-100" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600">{t.agencyName}</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-800">{showIntro ? t.welcomeTitle : t.formTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{showIntro ? t.welcomeSubtitle : t.formHint}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!showDashboard && !showAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowAdmin(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition hover:border-sky-300"
                  title={t.adminLoginTitle}
                  aria-label={t.adminLoginTitle}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}

              {!showIntro && !showAccessCode && !showDashboard ? (
                <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                  {t.stepLabel} {step} / 4
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {successMessage && !isCompleted ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {isSubmitting && submissionStatus ? (
          <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
            {submissionStatus}
          </div>
        ) : null}

        {isCompleted ? (
          <div className="rounded-[1.5rem] border border-sky-200 bg-white p-6 sm:p-8">
            <h3 className="text-2xl font-semibold text-slate-900">
              {language === 'ar' ? 'نتائجك الأولية' : 'Your Preliminary Results'}
            </h3>
            {accessCodeTier === 'free' ? (
              <div className="my-6 rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-white">
                <h4 className="mb-2 text-xl font-bold">🔒 Unlock Your Full AI Study Path &amp; Expert Consultation</h4>
                <p className="mb-4 text-sm text-slate-300">
                  You are viewing preliminary eligibility results. To unlock your full AI academic profile, tailored roadmap, and complete university application review, start your procedure today for 10,000 DZD.
                </p>
                <div className="inline-block rounded bg-slate-800 px-4 py-3 text-sm font-medium text-white">
                  📞 Contact Sefar Travel Agency: +213 562-884-864
                </div>
              </div>
            ) : null}

            {submittedLeadData && accessCodeTier === 'free' ? (
              <button
                type="button"
                onClick={() => exportClientPdf({
                  ...submittedLeadData,
                  tier: accessCodeTier,
                  best_match: bestMatch,
                  full_match_list: fullMatchList,
                }, language)}
                className="w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 sm:w-auto"
              >
                {language === 'ar' ? 'تنزيل تقرير PDF' : 'Download PDF'}
              </button>
            ) : null}
            {accessCodeTier !== 'free' ? (
              <p className="mt-4 text-sm text-slate-600">
                {language === 'ar'
                  ? 'سترسل الوكالة تقريرك الكامل إليك.'
                  : 'The agency will send your full report.'}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsCompleted(false)
                setShowIntro(true)
                setShowAccessCode(true)
                setStep(1)
                setSuccessMessage('')
                setSubmittedLeadData(null)
                setFullMatchList([])
                setBestMatch(null)
                setSubjects([{ name: '', customName: '', score: '' }])
                setAdditionalSponsors([])
              }}
              className="mt-6 block rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.startButton}
            </button>
          </div>
        ) : null}

        {!isCompleted && showAdmin ? (
          <AdminLogin
            language={language}
            onLogin={() => {
              setShowAdmin(false)
              setShowDashboard(true)
            }}
          />
        ) : null}

        {!isCompleted && showDashboard ? (
          <DashboardPanel
            language={language}
            onBack={() => setShowDashboard(false)}
            onLogout={() => {
              setShowDashboard(false)
              setShowAdmin(false)
            }}
          />
        ) : null}

        {showLandingPage ? (
          <LandingPage
            onLanguageChange={setLanguage}
            onAdminClick={() => setShowAdmin(true)}
            onVerified={handleAccessVerified}
          />
        ) : null}

        {!isCompleted && !showIntro && !showAccessCode && step === 1 ? (
          <StepOne values={values} onChange={updateField} onNext={handleStepOneNext} error={error} errors={stepErrors} t={t} />
        ) : null}

        {!isCompleted && !showIntro && !showAccessCode && step === 2 ? (
          <StepTwo
            values={values}
            onToggleCountry={toggleCountry}
            onNext={handleStepTwoNext}
            onBack={() => setStep(1)}
            error={error}
            errors={stepErrors}
            t={t}
          />
        ) : null}

        {!isCompleted && !showIntro && !showAccessCode && step === 3 ? (
          <StepThree
            values={values}
            onChange={updateField}
            subjects={subjects}
            onSubjectsChange={setSubjects}
            onDynamicChange={updateDynamicAnswer}
            onBack={() => setStep(2)}
            onNext={handleStepThreeNext}
            error={error}
            errors={stepErrors}
            t={t}
          />
        ) : null}

        {!isCompleted && !showIntro && !showAccessCode && step === 4 ? (
          <StepFour
            values={values}
            onChange={updateField}
            additionalSponsors={additionalSponsors}
            onAdditionalSponsorsChange={setAdditionalSponsors}
            onBack={() => setStep(3)}
            onSubmit={handleSubmit}
            error={error}
            errors={stepErrors}
            isSubmitting={isSubmitting}
            t={t}
          />
        ) : null}
      </div>
    </section>
  )
}

export default LeadForm
