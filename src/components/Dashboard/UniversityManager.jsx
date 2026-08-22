import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const emptyForm = {
  country: '',
  university: '',
  minimum_fee: '',
  minimum_gpa: '',
  minimum_ielts: '',
  max_age_bachelor: '',
  max_age_master: '',
  max_gap_years: '',
  deadline: '',
  level_1: '',
  level_2: '',
  m_t: '',
  phy: '',
  se: '',
  lng: '',
  eco: '',
  geo_his: '',
  accepts_english_moi: false,
}

const formFields = [
  ['country', 'Country'],
  ['university', 'University / Program'],
  ['minimum_fee', 'Minimum fee'],
  ['minimum_gpa', 'Minimum GPA'],
  ['minimum_ielts', 'Minimum IELTS'],
  ['max_age_bachelor', 'Max age bachelor'],
  ['max_age_master', 'Max age master'],
  ['max_gap_years', 'Max gap years'],
  ['deadline', 'Application deadline'],
  ['level_1', 'Level 1'],
  ['level_2', 'Level 2'],
  ['m_t', 'Math requirement'],
  ['phy', 'Physics requirement'],
  ['se', 'Science requirement'],
  ['lng', 'Languages requirement'],
  ['eco', 'Economics requirement'],
  ['geo_his', 'Geo-history requirement'],
]

function getProgramName(university = '') {
  const match = `${university}`.match(/\/+(.+?)\/+$/)
  return match ? match[1].trim() : university || 'General'
}

function UniversityManager({ onBack }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadRows = async () => {
    setLoading(true)
    setError('')
    const { data, error: fetchError } = await supabase
      .from('university_criteria')
      .select('*')
      .order('country', { ascending: true })
      .order('university', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setRows([])
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRows()
  }, [])

  const openAddModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setForm({
      ...emptyForm,
      ...Object.fromEntries(Object.keys(emptyForm).map((key) => [
        key,
        key === 'deadline'
          ? row.deadline ?? row.application_deadline ?? emptyForm[key]
          : row[key] ?? emptyForm[key],
      ])),
    })
    setError('')
    setIsModalOpen(true)
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ${row.university || 'this university program'}?`)) return

    setError('')
    const { error: deleteError } = await supabase
      .from('university_criteria')
      .delete()
      .eq('id', row.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setRows((current) => current.filter((item) => item.id !== row.id))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.university.trim() || !form.country.trim()) {
      setError('Country and university are required.')
      return
    }

    setSaving(true)
    setError('')
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        if (key === 'accepts_english_moi') return [key, Boolean(value)]
        if (typeof value === 'string' && value.trim() === '') return [key, null]
        return [key, value]
      }),
    )

    const query = editingId
      ? supabase.from('university_criteria').update(payload).eq('id', editingId)
      : supabase.from('university_criteria').insert(payload)
    const { error: saveError } = await query

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    await loadRows()
    setSaving(false)
    setIsModalOpen(false)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="text-sm font-semibold text-sky-700">Back to dashboard</button>
          <h3 className="mt-2 text-2xl font-semibold text-slate-800">University Criteria</h3>
          <p className="mt-1 text-sm text-slate-500">Manage universities, programs, and admission requirements.</p>
        </div>
        <button type="button" onClick={openAddModal} className="rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
          Add New Program
        </button>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-[850px] w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr>
                {['University', 'Program', 'Level', 'Deadline', 'Minimum GPA', 'Minimum IELTS', 'Tuition Fee', 'Math', 'Physics', 'Science', 'Languages', 'Economics', 'Geo-History', 'Actions'].map((heading) => (
                  <th key={heading} className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-600">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="14" className="px-4 py-10 text-center text-slate-500"><span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" /> <span className="ml-2">Loading universities...</span></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="14" className="px-4 py-10 text-center text-slate-500">No university criteria found.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{`${row.university || row.name || 'Unknown'}`.replace(/\/+.*?\/+/, '').trim()}</td>
                  <td className="px-4 py-3 text-slate-700">{getProgramName(row.university || row.name)}</td>
                  <td className="px-4 py-3 text-slate-700">{[row.level_1, row.level_2].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.deadline ?? row.application_deadline ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.minimum_gpa ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.minimum_ielts ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.minimum_fee ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.m_t ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.phy ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.se ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.lng ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.eco ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.geo_his ?? '—'}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => openEditModal(row)} className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700">Edit</button><button type="button" onClick={() => handleDelete(row)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="university-manager-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4"><h4 id="university-manager-title" className="text-xl font-semibold text-slate-800">{editingId ? 'Edit Program' : 'Add New Program'}</h4><button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl leading-none text-slate-400" aria-label="Close">×</button></div>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              {formFields.map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-700"><span>{label}</span><input value={form[key] ?? ''} onChange={(event) => updateField(key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-sky-500" /></label>)}
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(form.accepts_english_moi)} onChange={(event) => updateField('accepts_english_moi', event.target.checked)} /> Accepts English MOI</label>
              <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Program'}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default UniversityManager
