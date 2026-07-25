import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const rawData = await req.json()
    
    // Normalize degree, language, and age before building the prompt
    const degree = rawData.normalized_degree || rawData.degree_type
    const age = rawData.calculated_age || 21
    const englishLevel = rawData.english_level || 'Intermediate'
    const ieltsEquivalent = rawData.normalized_ielts_score || 4.5
    const sponsorIncome = rawData.sponsor_annual_income || '7000 USD/year'
    const tuitionBudget = rawData.tuition_budget_range || '0-2000 USD/year'

    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    const systemPrompt = `You are a strict international student visa officer and educational consultant at Sefar. 
    Evaluate the applicant's profile based on these STRICT rules:

    CRITICAL EVALUATION RULES:
    1. CURRENT DEGREE: The applicant holds a "${degree}". If it is a High School / Baccalaureate degree, NEVER suggest a Master's program. Only suggest Bachelor's or Foundation (Preparatory) programs.
    2. LANGUAGE LEVEL: The applicant's level is "${englishLevel}" (IELTS Equivalent: ${ieltsEquivalent}). 
       - If IELTS is less than 5.5, direct admission to English-taught European universities is a HIGH VISA RISK. You MUST recommend a "Preparatory English / Foundation Year" or "Language Course" as an actionable step.
    3. FINANCIAL PROFILE: Sponsor Annual Income is "${sponsorIncome}" and Tuition Budget is "${tuitionBudget}".
       - Evaluate if this budget is sufficient for European tuition (average €2,000 - €3,500/year) and living expenses. Highlight financial risk if tuition budget is below €2,500.
    4. AGE PROFILE: Applicant is ${age} years old. Flag any unexplained study gaps if age is over 22 for Bachelor applications.

    Return ONLY a valid JSON object matching this EXACT structure in both English and natural, high-quality Arabic:
    {
      "relevance_score": number (0-10),
      "reasoning_en": "Concise English assessment emphasizing degree fit, language gap (IELTS ${ieltsEquivalent}), and financial capability.",
      "reasoning_ar": "تقييم باللغة العربية بأسلوب استشاري احترافي يوضح توافق الشهادة، المستوى اللغوي، والقدرة المالية.",
      "suggested_alternatives_en": ["Alternative 1", "Alternative 2"],
      "suggested_alternatives_ar": ["بديل 1", "بديل 2"],
      "actionable_advice_en": ["Advice 1", "Advice 2"],
      "actionable_advice_ar": ["نصيحة 1", "نصيحة 2"]
    }`

    // Upgraded to Llama 3.3 70B for superior Arabic reasoning and zero hallucinations
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Applicant Data Summary:
            - Age: ${age}
            - Current Qualification: ${degree}
            - GPA: ${rawData.gpa || '10.04/20'}
            - English Proficiency: ${englishLevel} (IELTS ~${ieltsEquivalent})
            - Sponsor Income: ${sponsorIncome}
            - Annual Tuition Budget: ${tuitionBudget}
            - Selected Target Countries: ${rawData.selected_countries || 'Poland'}` 
          }
        ],
        response_format: { type: "json_object" }
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