function StepOne({ values, onChange, onNext, error, errors = {}, t }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.firstNameLabel}</span>
          <input
            required
            value={values.firstName}
            onChange={(event) => onChange('firstName', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.firstName ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder="Oussama"
          />
          {errors.firstName ? <p className="mt-2 text-sm text-rose-500">{errors.firstName}</p> : null}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.lastNameLabel}</span>
          <input
            required
            value={values.lastName}
            onChange={(event) => onChange('lastName', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.lastName ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder="Mansouria"
          />
          {errors.lastName ? <p className="mt-2 text-sm text-rose-500">{errors.lastName}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.emailLabel}</span>
          <input
            required
            type="email"
            value={values.email}
            onChange={(event) => onChange('email', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.email ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder="name@email.com"
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-500">{errors.email}</p> : null}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.phoneLabel}</span>
          <input
            required
            value={values.phone}
            onChange={(event) => onChange('phone', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.phone ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder="+213 555 123 456"
          />
          <p className="mt-1 text-xs text-slate-500">{t.phoneWhatsappHint}</p>
          {errors.phone ? <p className="mt-2 text-sm text-rose-500">{errors.phone}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.dobLabel}</span>
          <input
            required
            type="date"
            value={values.dob}
            onChange={(event) => onChange('dob', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.dob ? 'border-rose-400' : 'border-sky-100'}`}
          />
          {errors.dob ? <p className="mt-2 text-sm text-rose-500">{errors.dob}</p> : null}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.nationalityLabel}</span>
          <input
            required
            value={values.nationality}
            onChange={(event) => onChange('nationality', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.nationality ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder={t.nationalityPlaceholder}
          />
          {errors.nationality ? <p className="mt-2 text-sm text-rose-500">{errors.nationality}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.otherNationalityQuestionLabel}</span>
          <select
            value={values.hasOtherNationalityOrResidency}
            onChange={(event) => onChange('hasOtherNationalityOrResidency', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.hasOtherNationalityOrResidency ? 'border-rose-400' : 'border-sky-100'}`}
          >
            <option value="">{t.selectPlaceholder}</option>
            <option value="No">{t.noOption}</option>
            <option value="Yes">{t.yesOption}</option>
          </select>
          {errors.hasOtherNationalityOrResidency ? <p className="mt-2 text-sm text-rose-500">{errors.hasOtherNationalityOrResidency}</p> : null}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.hasPassportLabel}</span>
          <select
            value={values.hasPassport}
            onChange={(event) => onChange('hasPassport', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.hasPassport ? 'border-rose-400' : 'border-sky-100'}`}
          >
            <option value="">{t.selectPlaceholder}</option>
            <option value="No">{t.noOption}</option>
            <option value="Yes">{t.yesOption}</option>
          </select>
          {errors.hasPassport ? <p className="mt-2 text-sm text-rose-500">{errors.hasPassport}</p> : null}
        </label>
      </div>

      {values.hasOtherNationalityOrResidency === 'Yes' ? (
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.otherNationalityDetailsLabel}</span>
          <input
            value={values.otherNationalityOrResidencyDetails}
            onChange={(event) => onChange('otherNationalityOrResidencyDetails', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.otherNationalityOrResidencyDetails ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder={t.otherNationalityDetailsPlaceholder}
          />
          {errors.otherNationalityOrResidencyDetails ? <p className="mt-2 text-sm text-rose-500">{errors.otherNationalityOrResidencyDetails}</p> : null}
        </label>
      ) : null}

      {values.hasPassport === 'Yes' ? (
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.passportExpiryLabel}</span>
          <input
            type="date"
            value={values.passportExpiryDate}
            onChange={(event) => onChange('passportExpiryDate', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.passportExpiryDate ? 'border-rose-400' : 'border-sky-100'}`}
          />
          {errors.passportExpiryDate ? <p className="mt-2 text-sm text-rose-500">{errors.passportExpiryDate}</p> : null}
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.parentNameLabel}</span>
          <input
            value={values.parentName}
            onChange={(event) => onChange('parentName', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.parentName ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder={t.parentNamePlaceholder}
          />
          {errors.parentName ? <p className="mt-2 text-sm text-rose-500">{errors.parentName}</p> : null}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">{t.parentPhoneLabel}</span>
          <input
            value={values.parentPhone}
            onChange={(event) => onChange('parentPhone', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.parentPhone ? 'border-rose-400' : 'border-sky-100'}`}
            placeholder={t.parentPhonePlaceholder}
          />
          {errors.parentPhone ? <p className="mt-2 text-sm text-rose-500">{errors.parentPhone}</p> : null}
        </label>
      </div>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="flex justify-end">
        <button type="submit" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500">
          {t.continueButton}
        </button>
      </div>
    </form>
  )
}

export default StepOne
