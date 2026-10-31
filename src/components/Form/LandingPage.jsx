import { useState } from 'react'
import logo from '../../assets/logo.png'
import { getAccessCodeByValue } from '../../services/accessCodeService'

const copy = {
  en: {
    agencyName: 'SEFAR TRAVEL SERVICES',
    welcome: 'Welcome / مرحباً بك',
    title: 'Start Your Study Abroad Journey',
    subtitle: 'Enter your access code below to evaluate your eligibility.',
    placeholder: 'Enter Access Code',
    button: 'Check Eligibility',
    back: '← Back',
    admin: 'Admin access',
    checking: 'Checking...',
    invalidCode: 'This access code is invalid or has already been used.',
    genericError: 'Unable to verify the access code right now. Please try again.',
  },
  ar: {
    agencyName: 'وكالة سيفار ترافل سرفيس',
    welcome: 'مرحباً بك',
    title: 'ابدأ رحلتك الدراسية بالخارج',
    subtitle: 'أدخل رمز الدخول الخاص بك أدناه لتقييم أهليتك.',
    placeholder: 'أدخل رمز الدخول',
    button: 'التحقق من الأهلية',
    back: '← رجوع',
    admin: 'دخول الإدارة',
    checking: 'جاري التحقق...',
    invalidCode: 'رمز الوصول غير صالح أو تم استخدامه من قبل.',
    genericError: 'تعذر التحقق من رمز الوصول حالياً. حاول مرة أخرى.',
  },
}

function normalizeCode(code = '') {
  return `${code}`.trim().toUpperCase().replaceAll(/\s+/g, '')
}

function LandingPage({ onLanguageChange, onAdminClick, onVerified }) {
  const [language, setLanguage] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isArabic = language === 'ar'
  const t = copy[isArabic ? 'ar' : 'en']

  const chooseLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage)
    onLanguageChange?.(selectedLanguage)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const normalizedCode = normalizeCode(codeInput)
    if (!normalizedCode) {
      setError(t.invalidCode)
      return
    }

    setLoading(true)
    try {
      const codeRow = await getAccessCodeByValue(normalizedCode)
      if (!codeRow || (codeRow.tier !== 'free' && (codeRow.used || codeRow.is_used))) {
        setError(t.invalidCode)
        return
      }

      const tier = codeRow.tier === 'free' ? 'free' : 'full'
      onVerified?.({ code: normalizedCode, tier, record: codeRow })
    } catch (verifyError) {
      setError(verifyError?.message || t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {language === null ? (
        <div className="space-y-6 text-center">
          <div className="space-y-3">
            <img src={logo} alt="" className="mx-auto h-16 w-16 object-contain" />
            <p className="text-sm font-bold uppercase tracking-wide text-slate-800">{copy.en.agencyName}</p>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{copy.en.welcome}</h1>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => chooseLanguage('en')}
              className="w-full rounded-lg bg-slate-900 px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => chooseLanguage('ar')}
              className="w-full rounded-lg bg-blue-700 px-4 py-4 text-base font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              العربية
            </button>
          </div>
          <button
            type="button"
            onClick={onAdminClick}
            className="text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-800"
          >
            {copy.en.admin}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setLanguage(null)
              setError('')
            }}
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            {t.back}
          </button>

          <div className="space-y-2 text-center">
            <img src={logo} alt="" className="mx-auto h-14 w-14 object-contain" />
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{t.agencyName}</p>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-600">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder={t.placeholder}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.checking : t.button}
            </button>
          </form>
          <div className="text-center">
            <button
              type="button"
              onClick={onAdminClick}
              className="text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-800"
            >
              {t.admin}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
