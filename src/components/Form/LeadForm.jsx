import { useEffect, useMemo, useState } from 'react'
import { countriesConfig } from '../../config/countriesConfig'
import { getAccessCodeByValue, consumeAccessCode } from '../../services/accessCodeService'
import { submitLead } from '../../services/supabaseService'
import { calculateChances } from '../../utils/chancesCalculator'
import { translations } from '../../i18n/translations'
import logo from '../../assets/logo.png'
import StepOne from './StepOne'
import StepTwo from './StepTwo'
import StepThree from './StepThree'
import AdminLogin from '../Admin/AdminLogin'
import DashboardPanel from '../Dashboard/DashboardPanel'

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  sponsor: '',
  degreeType: '',
  studyField: '',
  finalMark: '',
  englishLevel: '',
  englishExamScore: '',
  selectedCountries: [],
  dynamicAnswers: {},
}

function LeadForm() {
  const [language, setLanguage] = useState('en')
  const [showIntro, setShowIntro] = useState(true)
  const [showAccessCode, setShowAccessCode] = useState(true)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState('')
  const [step, setStep] = useState(1)
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState('')
  const [stepErrors, setStepErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)

  const t = translations[language] || translations.en
  const englishLevelForScoring = values.englishLevel === 'IELTS/TOEFL holder' && values.englishExamScore
    ? `IELTS ${values.englishExamScore}`
    : values.englishLevel

  useEffect(() => {
    document.title = t.siteTitle
  }, [t.siteTitle])

  useMemo(() => {
    calculateChances(values.finalMark, englishLevelForScoring, values.selectedCountries, values.degreeType)
  }, [values.finalMark, englishLevelForScoring, values.selectedCountries, values.degreeType])

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

  const handleLanguageSelect = (nextLanguage) => {
    setLanguage(nextLanguage)
    setShowIntro(false)
    setShowAccessCode(true)
    setStep(1)
    setError('')
    setStepErrors({})
  }

  const handleAccessCodeSubmit = async (event) => {
    event.preventDefault()
    setAccessCodeError('')

    try {
      const codeRow = await getAccessCodeByValue(accessCode.trim())
      if (!codeRow || codeRow.used) {
        setAccessCodeError(t.accessCodeError)
        return
      }

      await consumeAccessCode(accessCode.trim(), null)
      setShowAccessCode(false)
      setShowIntro(false)
      setStep(1)
      setError('')
      setStepErrors({})
    } catch (error) {
      setAccessCodeError(error.message || t.accessCodeError)
    }
  }

  const handleStepOneNext = () => {
    const errors = {}

    if (!values.firstName.trim()) {
      errors.firstName = t.validation.firstName
    }

    if (!values.lastName.trim()) {
      errors.lastName = t.validation.lastName
    }

    if (!values.email.trim()) {
      errors.email = t.validation.email
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = t.validation.email
    }

    if (!values.phone.trim()) {
      errors.phone = t.validation.phone
    }

    if (!values.dob) {
      errors.dob = t.validation.dob
    }

    if (!values.sponsor) {
      errors.sponsor = t.validation.sponsor
    }

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

  const handleSubmit = async () => {
    const errors = {}

    if (!values.degreeType.trim()) {
      errors.degreeType = t.validation.degreeType
    }

    if (!values.studyField.trim()) {
      errors.studyField = t.validation.studyField
    }

    if (!values.finalMark) {
      errors.finalMark = t.validation.finalMark
    }

    if (!values.englishLevel) {
      errors.englishLevel = t.validation.english
    }

    if (values.englishLevel === 'IELTS/TOEFL holder' && !values.englishExamScore.trim()) {
      errors.englishExamScore = t.validation.englishExamScore
    }

    values.selectedCountries.forEach((countryName) => {
      const countryConfig = values.dynamicAnswers[countryName] || {}
      ;(countriesConfig[countryName]?.dynamicFields || []).forEach((field) => {
        const value = countryConfig[field.id]
        if (!value) {
          errors[`${countryName}.${field.id}`] = t.validation.dynamic
        }
      })

      if (!countryConfig.intendedStudyField?.trim()) {
        errors[`${countryName}.intendedStudyField`] = t.validation.dynamic
      }
    })

    setStepErrors(errors)

    if (Object.keys(errors).length > 0) {
      setError(t.validation.dynamic)
      return
    }

    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const countrySpecificData = {
        ...values.dynamicAnswers,
        _meta: {
          studyField: values.studyField,
        },
      }

      await submitLead({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        sponsor: values.sponsor,
        degreeType: values.degreeType,
        studyField: values.studyField,
        finalMark: values.finalMark,
        englishLevel: englishLevelForScoring,
        selectedCountries: values.selectedCountries,
        agencyInternalScore: calculateChances(values.finalMark, englishLevelForScoring, values.selectedCountries, values.degreeType),
        countrySpecificData,
        accessCode,
      })

      setSuccessMessage(t.submissionSuccess)
      setValues(initialValues)
      setIsCompleted(true)
      setStepErrors({})
    } catch (submissionError) {
      setError(submissionError.message || 'Unable to submit the lead right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="w-full rounded-[2rem] border border-sky-100 bg-white/95 p-6 shadow-[0_20px_80px_-20px_rgba(14,165,233,0.35)] backdrop-blur sm:p-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-sky-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt={t.agencyName} className="h-14 w-14 rounded-2xl object-contain ring-1 ring-sky-100" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600">{t.agencyName}</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-800">{showIntro ? t.welcomeTitle : t.formTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{showIntro ? t.welcomeSubtitle : t.formHint}</p>
            </div>
          </div>

          {!showIntro && !showAccessCode && !showDashboard ? (
            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
              {t.stepLabel} {step} / 3
            </div>
          ) : null}
        </div>

        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {isCompleted ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-8 text-center">
            <h3 className="text-2xl font-semibold text-emerald-800">{t.completionTitle}</h3>
            <p className="mt-3 text-base text-emerald-700">{t.completionMessage}</p>
            <button
              type="button"
              onClick={() => {
                setIsCompleted(false)
                setShowIntro(true)
                setShowAccessCode(true)
                setStep(1)
                setSuccessMessage('')
              }}
              className="mt-6 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
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

        {!isCompleted && showIntro ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">{t.chooseLanguage}</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-800">{t.welcomeTitle}</h3>
              <p className="mt-3 text-base text-slate-600">{t.welcomeSubtitle}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('en')}
                  className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  {t.english}
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('ar')}
                  className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300"
                >
                  {t.arabic}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdmin(true)}
                  className="rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300"
                >
                  {t.adminLoginTitle}
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-sky-100 bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{t.agencyName}</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {t.introBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {!isCompleted && !showIntro && showAccessCode && !showAdmin && !showDashboard ? (
          <form onSubmit={handleAccessCodeSubmit} className="rounded-[1.5rem] border border-sky-100 bg-white p-6">
            <h3 className="text-2xl font-semibold text-slate-800">{t.accessCodeTitle}</h3>
            <p className="mt-2 text-sm text-slate-500">{t.accessCodeHint}</p>
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              className="mt-4 w-full rounded-full border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700"
              placeholder={t.accessCodePlaceholder}
            />
            {accessCodeError ? <p className="mt-3 text-sm text-rose-500">{accessCodeError}</p> : null}
            <button type="submit" className="mt-4 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white">
              {t.unlockFormButton}
            </button>
          </form>
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
            onDynamicChange={updateDynamicAnswer}
            onBack={() => setStep(2)}
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
