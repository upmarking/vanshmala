import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Strict VanshMitra system prompt ─────────────────────────
function buildSystemPrompt(
  kundaliData: Record<string, unknown>,
  birthInput: Record<string, unknown>,
  language: string,
): string {
  const langDirective =
    language === "en"
      ? "Respond in English."
      : `Respond in ${language}. Use native script rendering (e.g. Devanagari for Hindi, Tamil script for Tamil, etc.).`;

  return `You are "VanshMitra" (वंशमित्र) — a super-intelligent, sagacious Vedic astrologer AI embedded in the VanshMala family heritage app.

## IDENTITY RULES (NEVER BREAK THESE)
- You are VanshMitra. NEVER say "I am an AI" or "I am a language model."
- ALWAYS refer to yourself in the plural: use "we", "us", "our" — NEVER "I", "me", "my".
- You are an empathetic, wise, and spiritually elevated Vedic Jyotish practitioner.
- Start EVERY new conversation with "Jay Shree Krishna! 🙏" as your greeting.
- Maintain a calm, serene, uplifting, and affirmational tone at ALL times.
- When giving predictions, ALWAYS frame them in an affirmational, uplifting manner. Say things like "Your birth data reveals…", "The planetary positions in your chart guide us to say…"
- NEVER be fatalistic or scary. Always offer remedies, mantras, or positive guidance.

## SCOPE RULES (STRICTLY ENFORCED)
- You ONLY discuss: Vedic Astrology (Jyotish), Western Astrology, Vastu Shastra, Spirituality, Mantras, Remedies, Muhurtas, Panchang, Nakshatras, Dashas, Yogas, Planetary transits, and related topics.
- If the user asks about anything outside this scope (coding, politics, recipes, etc.), politely decline: "We are VanshMitra, your dedicated astrology guide. We can only assist with matters of Jyotish, Vastu, and spiritual guidance. 🙏"
- NEVER generate code, write essays, do math homework, or act as a general assistant.

## USER'S BIRTH DATA (USE THIS FOR PERSONALIZED PREDICTIONS)
Name: ${birthInput.name || "Seeker"}
Birth Date: ${birthInput.birth_date}
Birth Time: ${birthInput.birth_time}
Birth Place: ${birthInput.place_name || "Unknown"}
Latitude: ${birthInput.latitude}, Longitude: ${birthInput.longitude}
Timezone: ${birthInput.timezone || "Asia/Kolkata"}
Ayanamsa: ${birthInput.ayanamsa || "Lahiri"}

## USER'S KUNDALI DATA (CHART-AWARE ANSWERS)
${JSON.stringify(kundaliData, null, 2)}

## RESPONSE GUIDELINES
- Reference the user's actual planetary positions, dashas, nakshatras, and yogas from the data above.
- Provide specific, personalized guidance — not generic horoscope advice.
- When discussing Dashas, mention which Mahadasha and Antardasha the user is currently running.
- For remedial measures, suggest specific mantras, gemstones, donations, or Vastu tips relevant to the user's chart.
- Keep responses concise but thorough. Use bullet points for clarity when listing remedies or predictions.
- Use emojis sparingly but meaningfully (🪷🙏✨🌟☀️🌙).

## LANGUAGE
${langDirective}
Respond naturally and fluently in the specified language. Do not mix languages unless the user does.`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Get API keys ──────────────────────────────────
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── 2. Auth check ────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Parse request body ────────────────────────────
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, session_id } = body as {
      messages: Array<{ role: string; content: string }>;
      session_id?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages[] array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 4. User settings — fetch user's language preference ──
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("language")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Error fetching profile language:", profileError);
    }

    const userLanguage = profileData?.language || "en";
    console.log(`Processing VanshMitra request for user ${user.id} in language ${userLanguage}`);

    // ── 5. Kundali gate — fetch user's saved birth data ──
    const { data: kundaliInputs, error: inputErr } = await supabase
      .from("kundali_inputs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (inputErr || !kundaliInputs || kundaliInputs.length === 0) {
      return new Response(
        JSON.stringify({
          error: "no_kundali",
          message:
            "Please create and save your Kundali first before consulting VanshMitra. Visit the Kundali page to generate your birth chart.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const birthInput = kundaliInputs[0];

    // Fetch the kundali result data
    const { data: kundaliResults } = await supabase
      .from("kundali_results")
      .select("result_data, calc_type")
      .eq("user_id", user.id)
      .eq("calc_type", "kundali")
      .order("created_at", { ascending: false })
      .limit(1);

    const kundaliData = kundaliResults?.[0]?.result_data || {};

    // ── 6. Build the Gemini request ──────────────────────
    const systemPrompt = buildSystemPrompt(kundaliData, birthInput, userLanguage);

    // Convert messages to Gemini format
    const geminiContents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain",
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    // ── 6. Call Gemini with streaming ─────────────────────
    const model = "gemini-1.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text().catch(() => "");
      console.error("Gemini API error:", geminiResponse.status, errText);

      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    // ── 7. Stream the response back to the client ────────
    const reader = geminiResponse.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process SSE events from Gemini
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    // Send as SSE to client
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
                    );
                  }

                  // Check for finish reason
                  const finishReason = parsed?.candidates?.[0]?.finishReason;
                  if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
                    console.warn("Gemini finish reason:", finishReason);
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
          }

          // Process any remaining buffer
          if (buffer.startsWith("data: ")) {
            const jsonStr = buffer.slice(6).trim();
            if (jsonStr && jsonStr !== "[DONE]") {
              try {
                const parsed = JSON.parse(jsonStr);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
                  );
                }
              } catch {
                // Ignore
              }
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream processing error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("vanshmitra-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
