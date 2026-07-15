import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { previousDegree, targetDegree } = await req.json()
    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is completely missing from Supabase environment variables.")
    }

    const systemPrompt = `You are an expert international student visa officer. 
    Evaluate the logical progression between the applicant's previous academic background and their target university degree. 
    The inputs may be in Arabic, English, or a mix. Analyze them seamlessly.
    Return ONLY a JSON object with no markdown formatting.
    Format: {"relevance_score": number (0-10), "reasoning": "A concise, one-sentence explanation in English explaining why this progression makes sense or why it is a visa risk."}`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nPrevious Background: ${previousDegree}\nTarget Degree: ${targetDegree}` }]
        }]
      })
    })

    const data = await response.json()

    // NEW: Safely check if Google Gemini rejected the API key
    if (data.error) {
      console.error("Google Gemini API Error:", data.error)
      throw new Error(`Gemini Error: ${data.error.message}`)
    }

    const rawText = data.candidates[0].content.parts[0].text
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error: any) {
    // NEW: This forces Supabase to print the error in red on your dashboard
    console.error("Function Crash Details:", error.message)
    
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})