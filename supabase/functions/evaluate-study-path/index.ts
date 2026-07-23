import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { previousDegree, targetDegree } = await req.json()
    
    // @ts-ignore
    const apiKey = Deno.env.get('GEMINI_API_KEY') // Now holding your Groq key!

    if (!apiKey) {
      throw new Error("API Key is missing from Supabase environment variables.")
    }

    const systemPrompt = `You are an expert international student visa officer. 
    Evaluate the logical progression between the applicant's previous academic background and their target university degree. 
    The inputs may be in Arabic, English, or a mix. Analyze them seamlessly.
    Return ONLY a JSON object.
    Format: {"relevance_score": number (0-10), "reasoning": "A concise, one-sentence explanation in English explaining why this progression makes sense or why it is a visa risk."}`

    // NEW: Calling Groq API using Llama 3.1 8B (Lightning fast and free)
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Previous Background: ${previousDegree}\nTarget Degree: ${targetDegree}` }
        ],
        response_format: { type: "json_object" } // Forces perfect JSON output
      })
    })

    const data = await response.json()

    if (data.error) {
      console.error("Groq API Error:", data.error)
      throw new Error(`Groq Error: ${data.error.message}`)
    }

    // Parse the Groq response
    const rawText = data.choices[0].message.content
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    
    return new Response(cleanJson, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error: any) {
    console.error("Function Crash Details:", error.message)
    
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})