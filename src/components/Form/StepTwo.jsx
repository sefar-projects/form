import { countriesConfig } from '../../config/countriesConfig'

function StepTwo({ values, onToggleCountry, onNext, onBack, error, errors = {}, t }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">
        {t.countrySelectionHint}
      </div>

      <div className="grid gap-3">
        {Object.entries(countriesConfig).map(([countryKey, country]) => {
          const isSelected = values.selectedCountries.includes(countryKey)
          const isDisabled = values.selectedCountries.length >= 3 && !isSelected

          return (
            <label
              key={countryKey}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                isSelected
                  ? 'border-sky-500/60 bg-sky-500/10'
                  : isDisabled
                    ? 'cursor-not-allowed border-sky-100 bg-slate-50 opacity-60'
                    : 'border-sky-100 bg-white hover:border-sky-200'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCountry(countryKey)}
                disabled={isDisabled}
                className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-sky-500"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{t.countryNames[countryKey] || country.name}</p>
              </div>
            </label>
          )
        })}
      </div>

      {errors.countrySelection ? <p className="text-sm text-rose-500">{errors.countrySelection}</p> : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-sky-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300"
        >
          {t.backButton}
        </button>
        <button type="submit" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500">
          {t.continueButton}
        </button>
      </div>
    </form>
  )
}

export default StepTwo
