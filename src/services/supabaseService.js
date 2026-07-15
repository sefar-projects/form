import { supabase } from '../lib/supabase'

export async function fetchUniversityCriteria() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  }

  // FIXED: Removed the fake 'is_active' query Copilot invented
  const { data, error } = await supabase
    .from('university_criteria')
    .select('*')
    .order('country', { ascending: true })

  if (error) {
    console.error("Error fetching university criteria:", error)
    return [] // Return empty array so the form doesn't crash
  }

  return data || []
}

export async function evaluateStudyPath(previousDegree, targetDegree) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  try {
    const { data, error } = await supabase.functions.invoke('evaluate-study-path', {
      body: { previousDegree, targetDegree }
    })

    if (error) throw error

    return {
      relevance_score: Number(data?.relevance_score ?? 0),
      reasoning: data?.reasoning || '',
    }
  } catch (error) {
    // FIXED: Instead of crashing the form, we catch the error, log it, and return a safe default
    console.error("Edge Function AI Error (Safe Fallback Used):", error)
    return {
      relevance_score: 5,
      reasoning: "AI evaluation unavailable at the time of submission. Manual review required."
    }
  }
}

export async function submitLead(leadData) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
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
    study_path_score: leadData.studyPathScore ?? null,
    study_path_explanation: leadData.studyPathExplanation ?? null,
    country_specific_data: leadData.countrySpecificData,
    access_code: leadData.accessCode || null,
  }

  const { error } = await supabase.from('leads').insert([payload], { returning: 'minimal' })

  if (error) {
    throw error
  }

  return true
}