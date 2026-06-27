import { supabase } from '../lib/supabase'

function normalizeAccessCode(code = '') {
  return `${code}`.trim().toUpperCase().replaceAll(/\s+/g, '')
}

export async function getAccessCodeByValue(code) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const normalizedCode = normalizeAccessCode(code)

  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function consumeAccessCode(code, leadId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const normalizedCode = normalizeAccessCode(code)

  const { data, error } = await supabase
    .from('access_codes')
    .update({ used: true, used_at: new Date().toISOString(), lead_id: leadId })
    .eq('code', normalizedCode)
    .is('used', false)
    .select('id')

  if (error) throw error
  return (data || []).length > 0
}

export async function createAccessCode(customerName) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const code = normalizeAccessCode(Math.random().toString(36).slice(2, 10))

  const { data, error } = await supabase
    .from('access_codes')
    .insert([{ customer_name: customerName, code, used: false }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAccessCodes() {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
