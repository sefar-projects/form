import { supabase } from '../lib/supabase'

export async function submitLead(leadData) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }

  const payload = {
    name: `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim(),
    first_name: leadData.firstName,
    last_name: leadData.lastName,
    email: leadData.email,
    phone_number: leadData.phone,
    date_of_birth: leadData.dob,
    financial_sponsor: leadData.sponsor,
    budget_availability: leadData.budget || null,
    degree_type: leadData.degreeType,
    gpa: leadData.finalMark,
    english_level: leadData.englishLevel,
    selected_countries: leadData.selectedCountries,
    agency_internal_score: leadData.agencyInternalScore,
    country_specific_data: leadData.countrySpecificData,
    access_code: leadData.accessCode || null,
  }

  const { data, error } = await supabase.from('leads').insert([payload]).select().single()

  if (error) {
    throw error
  }

  return data
}
