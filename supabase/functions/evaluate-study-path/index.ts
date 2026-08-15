import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const payload = await req.json()

    if (payload.action === 'generate_rationale') {
      const targetMatch = payload.target_match || {}
      const leadData = payload.lead_data || payload
      const targetUniversity = targetMatch.university || 'the suggested university'
      const targetProgram = targetMatch.program || 'the recommended program'
      const targetTuition = targetMatch.tuition || leadData?.tuition_budget_range || 'the available tuition budget'
      const customPrompt = `You are an expert admissions advisor. The applicant is applying to ${targetUniversity} for ${targetProgram}. Write a highly specific, professional 3-sentence rationale explaining why this is a great academic fit based on their grades and budget. Output ONLY JSON with keys "rationale_en" and "rationale_ar".`

      // @ts-ignore
      const apiKey = Deno.env.get('GROQ_API_KEY') || Deno.env.get('GEMINI_API_KEY')
      if (!apiKey) {
        throw new Error('Missing Groq/Gemini API key for targeted rationale generation.')
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: customPrompt },
            { role: 'user', content: `Applicant profile:\n- Current qualification: ${leadData.normalized_degree || leadData.degree_type || 'High School'}\n- GPA: ${leadData.gpa || 'N/A'}\n- Tuition budget: ${targetTuition}\n- Subject strengths: ${leadData.subject_scores ? JSON.stringify(leadData.subject_scores) : 'Not provided'}\n- Selected countries: ${Array.isArray(leadData.selected_countries) ? leadData.selected_countries.join(', ') : 'Not provided'}` }
          ]
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(`Groq Error: ${data.error.message}`)

      const rawText = data.choices[0].message.content
      const aiOutput = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim())

      return new Response(JSON.stringify({
        rationale_en: aiOutput.rationale_en || aiOutput.reasoning_en || 'Rationale generated but missing key.',
        rationale_ar: aiOutput.rationale_ar || aiOutput.reasoning_ar || 'لم يتم توفير شرح باللغة العربية.'
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const rawData = payload
    const subjectScores = typeof rawData.subject_scores === 'object' && rawData.subject_scores
      ? rawData.subject_scores
      : (typeof rawData.country_specific_data === 'object' && rawData.country_specific_data
        ? rawData.country_specific_data?._meta?.academic?.subject_scores || {}
        : {})

    const formattedSubjectScores = Object.entries(subjectScores || {}).reduce((acc, [key, value]) => {
      const score = value === null || value === undefined || value === '' ? 'N/A' : value
      acc[key] = score
      return acc
    }, {} as Record<string, unknown>)

    const subjectScoresSummary = Object.keys(formattedSubjectScores).length > 0
      ? Object.entries(formattedSubjectScores).map(([key, value]) => `${key}: ${value}`).join(', ')
      : 'Not provided'

    // Normalize degree, language, and age before building the prompt
    const degree = rawData.normalized_degree || rawData.degree_type
    const age = rawData.calculated_age || 21
    const englishLevel = rawData.english_level || 'Intermediate'
    const ieltsEquivalent = rawData.normalized_ielts_score || 4.5
    const sponsorIncome = rawData.sponsor_annual_income || '7000 USD/year'
    const tuitionBudget = rawData.tuition_budget_range || '0-2000 USD/year'

    const selectedCountries = Array.isArray(rawData.selected_countries) ? rawData.selected_countries : []
    const allowedCountries = selectedCountries.length > 0 ? selectedCountries.map((item) => `${item}`.trim().toLowerCase()) : ['poland']

    let universityCriteriaContext = 'No university criteria rows were available for the selected country.'

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-ignore
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')

    if (supabaseUrl && supabaseKey) {
      try {
        const criteriaUrl = `${supabaseUrl}/rest/v1/university_criteria?select=country,university,minimum_gpa,minimum_ielts,minimum_fee,level_1,level_2,m_t,phy,se,lng,eco,geo_his&order=country.asc&limit=120`
        const criteriaResponse = await fetch(criteriaUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'application/json',
          },
        })

        const criteriaRows = await criteriaResponse.json()
        const filteredRows = Array.isArray(criteriaRows)
          ? criteriaRows.filter((row) => {
              const rowCountry = `${row?.country || ''}`.trim().toLowerCase()
              return allowedCountries.includes(rowCountry)
            })
          : []

        if (filteredRows.length > 0) {
          universityCriteriaContext = filteredRows.slice(0, 30).map((row) => {
            const universityName = `${row?.university || row?.name || 'Unknown university'}`
            const majorPart = universityName.match(/\/+(.+?)\/+/) || universityName.match(/\/(.+?)\//) || null
            const programName = majorPart ? majorPart[1].trim() : 'General'
            const cleanUniversity = universityName.replace(/\/+.*?\/+/, '').trim() || universityName
            return `- ${cleanUniversity} | Program: ${programName} | Country: ${row?.country || 'Unknown'} | GPA ${row?.minimum_gpa || 'N/A'} | IELTS ${row?.minimum_ielts || 'N/A'} | Fee ${row?.minimum_fee || 'N/A'} | Level: ${row?.level_1 || 'N/A'}`
          }).join('\n')
        }
      } catch (error) {
        universityCriteriaContext = 'University criteria could not be loaded; use the applicant data and your general academic knowledge only.'
      }
    }

    // @ts-ignore
    const apiKey = Deno.env.get('GROQ_API_KEY') || Deno.env.get('GEMINI_API_KEY')

    const systemPrompt = `You are a strict international student visa officer and educational consultant at Sefar.
    Evaluate the applicant's profile based on these STRICT rules:

    CRITICAL EVALUATION RULES:
    1. CURRENT DEGREE: The applicant holds a "${degree}". If it is a High School / Baccalaureate degree, NEVER suggest a Master's program. Only suggest Bachelor's or Foundation (Preparatory) programs.
    2. LANGUAGE LEVEL: The applicant's level is "${englishLevel}" (IELTS Equivalent: ${ieltsEquivalent}).
       - If IELTS is less than 5.5, direct admission to English-taught European universities is a HIGH VISA RISK. You MUST recommend a "Preparatory English / Foundation Year" or "Language Course" as an actionable step.
    3. FINANCIAL PROFILE: Sponsor Annual Income is "${sponsorIncome}" and Tuition Budget is "${tuitionBudget}".
       - Evaluate if this budget is sufficient for European tuition (average €2,000 - €3,500/year) and living expenses. Highlight financial risk if tuition budget is below €2,500.
    4. AGE PROFILE: Applicant is ${age} years old. Flag any unexplained study gaps if age is over 22 for Bachelor applications.
    5. CAREER COUNSELOR RULE: Analyze the applicant's highest subject_scores alongside their current degree type. Deduce their strongest academic field. You MUST recommend the single best university major category for them (e.g., 'Computer Science', 'Engineering', 'Business', 'Languages', 'Journalism'). Base this strictly on logical deduction of their highest grades.
    6. UNIVERSITY CRITERIA CONTEXT: You are given the actual universities and programs available in the database. Use these university names and embedded program names to suggest the best fit from the available options, not invented universities. Explain which university and program best matches the student's academic profile and why.

    Available university criteria rows:
    ${universityCriteriaContext}

    Return ONLY a valid JSON object matching this EXACT structure in both English and natural, high-quality Arabic:
    {
      "relevance_score": number (0-10),
      "recommended_major_en": "The deduced major category",
      "best_university_en": "The exact best university from the provided list",
      "best_program_en": "Best matching program name from the provided list",
      "why_best_university_en": "Why this university and program fit the applicant best, based on degree, grades, and subject strengths.",
      "general_info_en": "Brief general information about this university/program and its typical academic profile.",
      "reasoning_en": "Concise English assessment emphasizing degree fit, language gap (IELTS ${ieltsEquivalent}), and financial capability.",
      "reasoning_ar": "تقييم باللغة العربية بأسلوب استشاري احترافي يوضح توافق الشهادة، المستوى اللغوي، والقدرة المالية.",
      "suggested_alternatives_en": ["Alternative 1", "Alternative 2"],
      "suggested_alternatives_ar": ["بديل 1", "بديل 2"],
      "actionable_advice_en": ["Advice 1", "Advice 2"],
      "actionable_advice_ar": ["نصيحة 1", "نصيحة 2"]
    }`

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Applicant Data Summary:
            - Age: ${age}
            - Current Qualification: ${degree}
            - GPA: ${rawData.gpa || '10.04/20'}
            - English Proficiency: ${englishLevel} (IELTS ~${ieltsEquivalent})
            - Sponsor Income: ${sponsorIncome}
            - Annual Tuition Budget: ${tuitionBudget}
            - Subject Scores: ${subjectScoresSummary}
            - Selected Target Countries: ${rawData.selected_countries || 'Poland'}` }
        ],
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(`Groq Error: ${data.error.message}`)

    const rawText = data.choices[0].message.content
    const aiOutput = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim())

    let combinedExplanation = ` ENGLISH EVALUATION:\n${aiOutput.reasoning_en}`
    if (aiOutput.suggested_alternatives_en?.length) {
      combinedExplanation += `\n\n Suggested Alternatives:\n• ${aiOutput.suggested_alternatives_en.join("\n• ")}`
    }
    if (aiOutput.actionable_advice_en?.length) {
      combinedExplanation += `\n\n Actionable Advice:\n• ${aiOutput.actionable_advice_en.join("\n• ")}`
    }

    combinedExplanation += `\n\n----------------------------------------\n\n التقييم باللغة العربية:\n${aiOutput.reasoning_ar}`
    if (aiOutput.suggested_alternatives_ar?.length) {
      combinedExplanation += `\n\n بدائل مقترحة:\n• ${aiOutput.suggested_alternatives_ar.join("\n• ")}`
    }
    if (aiOutput.actionable_advice_ar?.length) {
      combinedExplanation += `\n\n نصائح عملية:\n• ${aiOutput.actionable_advice_ar.join("\n• ")}`
    }

    return new Response(JSON.stringify({
      relevance_score: aiOutput.relevance_score || 0,
      recommended_major_en: aiOutput.recommended_major_en || 'Not specified',
      best_university_en: aiOutput.best_university_en || null,
      best_program_en: aiOutput.best_program_en || null,
      why_best_university_en: aiOutput.why_best_university_en || null,
      general_info_en: aiOutput.general_info_en || null,
      reasoning: combinedExplanation
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})