function StepFour({ values, onChange, onBack, onSubmit, error, errors = {}, isSubmitting, t }) {
  const needsRelativesDetails = values.financialSponsor === 'Relatives'
  const needsFundExplanation = values.fundsAvailabilityTimeline === 'No'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-5">
        <h3 className="text-lg font-semibold text-slate-800">{t.financialTitle}</h3>
        <p className="mt-1 text-sm text-slate-600">{t.financialSubtitle}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.sponsorLabel}</span>
            <select
              value={values.financialSponsor}
              onChange={(event) => onChange('financialSponsor', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.financialSponsor ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="Self">{t.sponsorSelf}</option>
              <option value="Parents">{t.sponsorParents}</option>
              <option value="Relatives">{t.sponsorRelatives}</option>
            </select>
            {errors.financialSponsor ? <p className="mt-2 text-sm text-rose-500">{errors.financialSponsor}</p> : null}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.annualIncomeLabel}</span>
            <input
              value={values.annualSponsorIncome}
              onChange={(event) => onChange('annualSponsorIncome', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.annualSponsorIncome ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.annualIncomePlaceholder}
            />
            {errors.annualSponsorIncome ? <p className="mt-2 text-sm text-rose-500">{errors.annualSponsorIncome}</p> : null}
          </label>
        </div>

        {needsRelativesDetails ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.relativesSponsorDetailsLabel}</span>
            <textarea
              value={values.relativesSponsorDetails}
              onChange={(event) => onChange('relativesSponsorDetails', event.target.value)}
              className={`min-h-24 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.relativesSponsorDetails ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.relativesSponsorDetailsPlaceholder}
            />
            {errors.relativesSponsorDetails ? <p className="mt-2 text-sm text-rose-500">{errors.relativesSponsorDetails}</p> : null}
          </label>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.employmentStatusLabel}</span>
            <select
              value={values.sponsorEmploymentStatus}
              onChange={(event) => onChange('sponsorEmploymentStatus', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.sponsorEmploymentStatus ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="Business owner">{t.employmentBusinessOwner}</option>
              <option value="Employee">{t.employmentEmployee}</option>
              <option value="Unemployed">{t.employmentUnemployed}</option>
              <option value="Retired">{t.employmentRetired}</option>
              <option value="Student">{t.employmentStudent}</option>
            </select>
            {errors.sponsorEmploymentStatus ? <p className="mt-2 text-sm text-rose-500">{errors.sponsorEmploymentStatus}</p> : null}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.tuitionBudgetRangeLabel}</span>
            <select
              value={values.tuitionBudgetRange}
              onChange={(event) => onChange('tuitionBudgetRange', event.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.tuitionBudgetRange ? 'border-rose-400' : 'border-sky-100'}`}
            >
              <option value="">{t.selectPlaceholder}</option>
              <option value="0-2000 USD/year">{t.tuitionRange0to2000}</option>
              <option value="2000-6000 USD/year">{t.tuitionRange2000to6000}</option>
              <option value="6000+ USD/year">{t.tuitionRange6000Plus}</option>
            </select>
            {errors.tuitionBudgetRange ? <p className="mt-2 text-sm text-rose-500">{errors.tuitionBudgetRange}</p> : null}
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.fundsAvailabilityLabel}</span>
          <select
            value={values.fundsAvailabilityTimeline}
            onChange={(event) => onChange('fundsAvailabilityTimeline', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.fundsAvailabilityTimeline ? 'border-rose-400' : 'border-sky-100'}`}
          >
            <option value="">{t.selectPlaceholder}</option>
            <option value="Have now">{t.fundsHaveNow}</option>
            <option value="Can provide in 3 months">{t.fundsIn3Months}</option>
            <option value="Can provide in 6 months">{t.fundsIn6Months}</option>
            <option value="No">{t.noOption}</option>
          </select>
          {errors.fundsAvailabilityTimeline ? <p className="mt-2 text-sm text-rose-500">{errors.fundsAvailabilityTimeline}</p> : null}
        </label>

        {needsFundExplanation ? (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            <span className="mb-2 block">{t.fundsExplanationLabel}</span>
            <textarea
              value={values.fundsExplanation}
              onChange={(event) => onChange('fundsExplanation', event.target.value)}
              className={`min-h-24 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.fundsExplanation ? 'border-rose-400' : 'border-sky-100'}`}
              placeholder={t.fundsExplanationPlaceholder}
            />
            {errors.fundsExplanation ? <p className="mt-2 text-sm text-rose-500">{errors.fundsExplanation}</p> : null}
          </label>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.additionalInfoLabel}</span>
          <textarea
            value={values.additionalInfo}
            onChange={(event) => onChange('additionalInfo', event.target.value)}
            className="min-h-28 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500"
            placeholder={t.additionalInfoPlaceholder}
          />
        </label>
      </div>

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

export default StepFour
