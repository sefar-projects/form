import { countriesConfig } from '../../config/countriesConfig'

function StepThree({ values, onChange, onDynamicChange, onBack, onSubmit, error, errors = {}, isSubmitting, t }) {
  const selectedCountries = values.selectedCountries || []
  const needsEnglishExamScore = values.englishLevel === 'IELTS/TOEFL holder'

  const handleEnglishLevelChange = (event) => {
    const nextLevel = event.target.value
    onChange('englishLevel', nextLevel)

    if (nextLevel !== 'IELTS/TOEFL holder') {
      onChange('englishExamScore', '')
    }
  }

  const renderField = (countryKey, field, fieldValue) => {
    const hasError = Boolean(errors[`${countryKey}.${field.id}`])

    if (field.type === 'select') {
      return (
        <div>
          <select
            value={fieldValue || ''}
            onChange={(event) => onDynamicChange(countryKey, field.id, event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${hasError ? 'border-rose-400' : 'border-sky-100'}`}
          >
            <option value="">{t.selectPlaceholder}</option>
            {(t.countryFieldOptions[field.id] || field.options).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[`${countryKey}.${field.id}`]}</p> : null}
        </div>
      )
    }

    return (
      <div>
        <input
          type="text"
          value={fieldValue || ''}
          onChange={(event) => onDynamicChange(countryKey, field.id, event.target.value)}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${hasError ? 'border-rose-400' : 'border-sky-100'}`}
          placeholder={t.countryFieldLabels[field.id] || field.label}
        />
        {hasError ? <p className="mt-2 text-sm text-rose-500">{errors[`${countryKey}.${field.id}`]}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-5">
        <h3 className="text-lg font-semibold text-slate-800">{t.academicTitle}</h3>
        <p className="mt-1 text-sm text-slate-600">{t.academicSubtitle}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.degreeTypeLabel}</span>
            <select
              value={values.degreeType}
              onChange={(event) => onChange('degreeType', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.degreeType ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              {t.degreeTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.degreeType ? <p className="mt-2 text-sm text-rose-500">{errors.degreeType}</p> : null}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.studyFieldLabel}</span>
            <input
              value={values.studyField}
              onChange={(event) => onChange('studyField', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.studyField ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.studyFieldPlaceholder}
            />
            {errors.studyField ? <p className="mt-2 text-sm text-rose-500">{errors.studyField}</p> : null}
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.finalMarkLabel}</span>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={values.finalMark}
              onChange={(event) => onChange('finalMark', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.finalMark ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder="14.5"
            />
            {errors.finalMark ? <p className="mt-2 text-sm text-rose-500">{errors.finalMark}</p> : null}
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.englishLabel}</span>
          <select
            value={values.englishLevel}
            onChange={handleEnglishLevelChange}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.englishLevel ? 'border-rose-400' : 'border-sky-100'}`}
          >
            <option value="">{t.selectPlaceholder}</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="IELTS/TOEFL holder">IELTS/TOEFL holder</option>
          </select>
          {errors.englishLevel ? <p className="mt-2 text-sm text-rose-500">{errors.englishLevel}</p> : null}
        </label>

        {needsEnglishExamScore ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.englishExamScoreLabel}</span>
            <input
              value={values.englishExamScore || ''}
              onChange={(event) => onChange('englishExamScore', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.englishExamScore ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.englishExamScorePlaceholder}
            />
            {errors.englishExamScore ? <p className="mt-2 text-sm text-rose-500">{errors.englishExamScore}</p> : null}
          </label>
        ) : null}
      </div>

      {selectedCountries.length === 0 ? (
        <p className="rounded-2xl border border-sky-100 bg-white p-4 text-sm text-slate-600">{t.countrySelectionEmpty}</p>
      ) : null}

      {selectedCountries.map((countryKey) => {
        const countryConfig = countriesConfig[countryKey]
        const fieldAnswers = values.dynamicAnswers[countryKey] || {}

        return (
          <section key={countryKey} className="rounded-2xl border border-sky-100 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-800">{t.countryNames[countryKey] || countryConfig.name}</h3>
            <div className="mt-4 grid gap-4">
              <label key={`${countryKey}-intended-study-field`} className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">{t.intendedStudyFieldLabel}</span>
                <input
                  type="text"
                  value={fieldAnswers.intendedStudyField || ''}
                  onChange={(event) => onDynamicChange(countryKey, 'intendedStudyField', event.target.value)}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors[`${countryKey}.intendedStudyField`] ? 'border-rose-400' : 'border-sky-100'}`}
                  placeholder={t.intendedStudyFieldPlaceholder}
                />
                {errors[`${countryKey}.intendedStudyField`] ? (
                  <p className="mt-2 text-sm text-rose-500">{errors[`${countryKey}.intendedStudyField`]}</p>
                ) : null}
              </label>

              {countryConfig.dynamicFields.map((field) => (
                <label key={`${countryKey}-${field.id}`} className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.countryFieldLabels[field.id] || field.label}</span>
                  {renderField(countryKey, field, fieldAnswers[field.id])}
                </label>
              ))}
            </div>
          </section>
        )
      })}

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-sky-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300"
        >
          {t.backButton}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t.submittingButton : t.submitButton}
        </button>
      </div>
    </div>
  )
}

export default StepThree
