import { countriesConfig } from '../../config/countriesConfig'

const countryLevelOptions = ['Bachelor', 'Master', 'PhD']
const universityTypeOptions = ['Public', 'Private', 'No preference']
const housingOptions = ['University housing', 'Private housing', 'No preference']
const countryCardClasses = {
  italy: 'border-amber-200 bg-amber-50/60',
  poland: 'border-rose-200 bg-rose-50/60',
  hungary: 'border-violet-200 bg-violet-50/60',
  china: 'border-red-200 bg-red-50/60',
  romania: 'border-emerald-200 bg-emerald-50/60',
  uk: 'border-blue-200 bg-blue-50/60',
}

function StepThree({ values, onChange, onDynamicChange, onBack, onNext, error, errors = {}, t }) {
  const selectedCountries = values.selectedCountries || []
  const needsGapExplanation = values.gapYears === 'Two years or more'
  const needsCertificateDetails = values.languageCertificateType && values.languageCertificateType !== 'None'
  const needsOtherCertificateName = values.languageCertificateType === 'Other'

  const yearOptions = Array.from({ length: 10 }).map((_, index) => String(new Date().getFullYear() + index))

  const renderCountryFieldError = (countryKey, fieldId) => errors[`${countryKey}.${fieldId}`]

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

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.lastDegreeDateLabel}</span>
            <input
              type="date"
              value={values.lastDegreeDate}
              onChange={(event) => onChange('lastDegreeDate', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.lastDegreeDate ? 'border-rose-400' : 'border-sky-100'}`}
            />
            {errors.lastDegreeDate ? <p className="mt-2 text-sm text-rose-500">{errors.lastDegreeDate}</p> : null}
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.gapYearsLabel}</span>
            <select
              value={values.gapYears}
              onChange={(event) => onChange('gapYears', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.gapYears ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="No gaps">{t.noGapOption}</option>
              <option value="Two years or more">{t.twoYearsOrMoreOption}</option>
            </select>
            {errors.gapYears ? <p className="mt-2 text-sm text-rose-500">{errors.gapYears}</p> : null}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.studiedInEnglishBeforeLabel}</span>
            <select
              value={values.studiedInEnglishBefore}
              onChange={(event) => onChange('studiedInEnglishBefore', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.studiedInEnglishBefore ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="No">{t.noOption}</option>
              <option value="Yes">{t.yesOption}</option>
            </select>
            {errors.studiedInEnglishBefore ? <p className="mt-2 text-sm text-rose-500">{errors.studiedInEnglishBefore}</p> : null}
          </label>
        </div>

        {needsGapExplanation ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.gapYearsExplanationLabel}</span>
            <textarea
              value={values.gapYearsExplanation}
              onChange={(event) => onChange('gapYearsExplanation', event.target.value)}
              className={`min-h-24 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.gapYearsExplanation ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.gapYearsExplanationPlaceholder}
            />
            {errors.gapYearsExplanation ? <p className="mt-2 text-sm text-rose-500">{errors.gapYearsExplanation}</p> : null}
          </label>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.englishLabel}</span>
            <select
              value={values.englishLevel}
              onChange={(event) => onChange('englishLevel', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.englishLevel ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            {errors.englishLevel ? <p className="mt-2 text-sm text-rose-500">{errors.englishLevel}</p> : null}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.languageCertificateTypeLabel}</span>
            <select
              value={values.languageCertificateType}
              onChange={(event) => onChange('languageCertificateType', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.languageCertificateType ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="None">{t.noCertificateOption}</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEFL">TOEFL</option>
              <option value="Other">{t.otherCertificateOption}</option>
            </select>
            {errors.languageCertificateType ? <p className="mt-2 text-sm text-rose-500">{errors.languageCertificateType}</p> : null}
          </label>
        </div>

        {needsCertificateDetails ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block">{t.certificateScoreLabel}</span>
              <input
                value={values.languageCertificateScore}
                onChange={(event) => onChange('languageCertificateScore', event.target.value)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.languageCertificateScore ? 'border-rose-400' : 'border-sky-100'}`}
                placeholder={t.certificateScorePlaceholder}
              />
              {errors.languageCertificateScore ? <p className="mt-2 text-sm text-rose-500">{errors.languageCertificateScore}</p> : null}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-2 block">{t.certificateDateLabel}</span>
              <input
                type="date"
                value={values.languageCertificateDate}
                onChange={(event) => onChange('languageCertificateDate', event.target.value)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.languageCertificateDate ? 'border-rose-400' : 'border-sky-100'}`}
              />
              {errors.languageCertificateDate ? <p className="mt-2 text-sm text-rose-500">{errors.languageCertificateDate}</p> : null}
            </label>
          </div>
        ) : null}

        {needsOtherCertificateName ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.certificateNameLabel}</span>
            <input
              value={values.languageCertificateName}
              onChange={(event) => onChange('languageCertificateName', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.languageCertificateName ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.certificateNamePlaceholder}
            />
            {errors.languageCertificateName ? <p className="mt-2 text-sm text-rose-500">{errors.languageCertificateName}</p> : null}
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
          <section key={countryKey} className={`rounded-2xl border p-5 ${countryCardClasses[countryKey] || 'border-sky-100 bg-white'}`}>
            <h3 className="text-lg font-semibold text-slate-800">{t.countryNames[countryKey] || countryConfig.name}</h3>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">{t.countryDesiredLevelLabel}</span>
                <select
                  value={fieldAnswers.desiredLevel || ''}
                  onChange={(event) => onDynamicChange(countryKey, 'desiredLevel', event.target.value)}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, 'desiredLevel') ? 'border-rose-400' : 'border-sky-100'}`}
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {countryLevelOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {renderCountryFieldError(countryKey, 'desiredLevel') ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, 'desiredLevel')}</p> : null}
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                {['specialization1', 'specialization2', 'specialization3'].map((specializationKey, index) => (
                  <label key={`${countryKey}-${specializationKey}`} className="block text-sm font-medium text-slate-700">
                    <span className="mb-2 block">{t[`specialization${index + 1}Label`]}</span>
                    <input
                      value={fieldAnswers[specializationKey] || ''}
                      onChange={(event) => onDynamicChange(countryKey, specializationKey, event.target.value)}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, specializationKey) ? 'border-rose-400' : 'border-sky-100'}`}
                      placeholder={t.specializationPlaceholder}
                    />
                    {renderCountryFieldError(countryKey, specializationKey) ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, specializationKey)}</p> : null}
                  </label>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.universityTypeLabel}</span>
                  <select
                    value={fieldAnswers.universityType || ''}
                    onChange={(event) => onDynamicChange(countryKey, 'universityType', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, 'universityType') ? 'border-rose-400' : 'border-sky-100'}`}
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    {universityTypeOptions.map((option) => (
                      <option key={option} value={option}>{t[`universityType${option.replace(/\s+/g, '')}`] || option}</option>
                    ))}
                  </select>
                  {renderCountryFieldError(countryKey, 'universityType') ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, 'universityType')}</p> : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.housingPreferenceLabel}</span>
                  <select
                    value={fieldAnswers.housingPreference || ''}
                    onChange={(event) => onDynamicChange(countryKey, 'housingPreference', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, 'housingPreference') ? 'border-rose-400' : 'border-sky-100'}`}
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    {housingOptions.map((option) => (
                      <option key={option} value={option}>{t[`housing${option.replace(/\s+/g, '')}`] || option}</option>
                    ))}
                  </select>
                  {renderCountryFieldError(countryKey, 'housingPreference') ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, 'housingPreference')}</p> : null}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.studyStartYearLabel}</span>
                  <select
                    value={fieldAnswers.studyStartYear || ''}
                    onChange={(event) => onDynamicChange(countryKey, 'studyStartYear', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, 'studyStartYear') ? 'border-rose-400' : 'border-sky-100'}`}
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    {yearOptions.map((year) => (
                      <option key={`${countryKey}-start-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                  {renderCountryFieldError(countryKey, 'studyStartYear') ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, 'studyStartYear')}</p> : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.preferredCityLabel}</span>
                  <input
                    value={fieldAnswers.preferredCity || ''}
                    onChange={(event) => onDynamicChange(countryKey, 'preferredCity', event.target.value)}
                    className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500"
                    placeholder={t.preferredCityPlaceholder}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">{t.preferredUniversityLabel}</span>
                <input
                  value={fieldAnswers.preferredUniversity || ''}
                  onChange={(event) => onDynamicChange(countryKey, 'preferredUniversity', event.target.value)}
                  className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500"
                  placeholder={t.preferredUniversityPlaceholder}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.rankingInterestLabel}</span>
                  <select
                    value={fieldAnswers.rankingInterest || ''}
                    onChange={(event) => onDynamicChange(countryKey, 'rankingInterest', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, 'rankingInterest') ? 'border-rose-400' : 'border-sky-100'}`}
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    <option value="No">{t.noOption}</option>
                    <option value="Yes">{t.yesOption}</option>
                  </select>
                  {renderCountryFieldError(countryKey, 'rankingInterest') ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, 'rankingInterest')}</p> : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{t.scholarshipInterestLabel}</span>
                  <select
                    value={fieldAnswers.scholarshipInterest || ''}
                    onChange={(event) => onDynamicChange(countryKey, 'scholarshipInterest', event.target.value)}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${renderCountryFieldError(countryKey, 'scholarshipInterest') ? 'border-rose-400' : 'border-sky-100'}`}
                  >
                    <option value="">{t.selectPlaceholder}</option>
                    <option value="No">{t.noOption}</option>
                    <option value="Yes">{t.yesOption}</option>
                  </select>
                  {renderCountryFieldError(countryKey, 'scholarshipInterest') ? <p className="mt-2 text-sm text-rose-500">{renderCountryFieldError(countryKey, 'scholarshipInterest')}</p> : null}
                </label>
              </div>

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
          onClick={onNext}
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          {t.continueButton}
        </button>
      </div>
    </div>
  )
}

export default StepThree
