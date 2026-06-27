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
          <span className="mb-2 block">{t.sponsorLabel}</span>
          <select
            required
            value={values.sponsor}
            onChange={(event) => onChange('sponsor', event.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 ${errors.sponsor ? 'border-rose-400' : 'border-sky-100'}`}
          >
            <option value="">{t.selectPlaceholder}</option>
            <option value="Self">{t.sponsorSelf}</option>
            <option value="Parents">{t.sponsorParents}</option>
            <option value="Relatives">{t.sponsorRelatives}</option>
          </select>
          {errors.sponsor ? <p className="mt-2 text-sm text-rose-500">{errors.sponsor}</p> : null}
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
