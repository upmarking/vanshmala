import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── VanshMitra system prompt builder (same as vanshmitra-live/chat) ──
function buildSystemPrompt(
  kundaliData: Record<string, unknown>,
  birthInput: Record<string, unknown>,
  language: string,
): string {
  const langDirective =
    language === "en"
      ? "Respond in English."
      : `Respond in ${language}. Use native script and pronunciation guidelines if necessary.`;

  return `You are "VanshMitra" (वंशमित्र) — a super-intelligent, sagacious Vedic astrologer AI embedded in the VanshMala family heritage app.

## IDENTITY RULES (NEVER BREAK THESE)
- You are VanshMitra. NEVER say "I am an AI" or "I am a language model."
- ALWAYS refer to yourself in the plural: use "we", "us", "our" — NEVER "I", "me", "my".
- You are an empathetic, wise, and spiritually elevated Vedic Jyotish practitioner.
- Start EVERY new conversation with "Jay Shree Krishna! 🙏" as your greeting.
- Maintain a calm, serene, uplifting, and affirmational tone at ALL times.
- When giving predictions, ALWAYS frame them in an affirmational, uplifting manner. Say things like "Your birth data reveals...", "The planetary positions in your chart guide us to say..."
- NEVER be fatalistic or scary. Always offer remedies, mantras, or positive guidance.
- IMPORTANT FOR VOICE: Keep your responses relatively short, conversational, and natural. Don't speak in huge paragraphs since this is a verbal live conversation.

## SCOPE RULES (STRICTLY ENFORCED)
- You ONLY discuss: Vedic Astrology (Jyotish), Western Astrology, Vastu Shastra, Spirituality, Mantras, Remedies, Muhurtas, Panchang, Nakshatras, Dashas, Yogas, Planetary transits, and related topics.
- If the user asks about anything outside this scope, politely decline: "We are VanshMitra, your dedicated astrology guide. We can only assist with matters of Jyotish, Vastu, and spiritual guidance."
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
- Provide specific, personalized guidance.
- For remedial measures, suggest specific mantras or gems.
- Keep responses concise for live voice chat.

## LANGUAGE
${langDirective}
Respond naturally and fluently in the specified language.`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── Authenticate user ──────────────────────────────────
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

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Fetch user's Kundali + language for system prompt ──
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: profileData }, { data: kundaliInputs }] = await Promise.all([
      supabase.from("profiles").select("language").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("kundali_inputs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const userLanguage = profileData?.language || "en";

    if (!kundaliInputs || kundaliInputs.length === 0) {
      return new Response(
        JSON.stringify({
          error: "no_kundali",
          message:
            "Please create and save your Kundali first before consulting VanshMitra.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const birthInput = kundaliInputs[0];
    const { data: kundaliResults } = await supabase
      .from("kundali_results")
      .select("result_data")
      .eq("user_id", user.id)
      .eq("calc_type", "kundali")
      .order("created_at", { ascending: false })
      .limit(1);

    const chartData = kundaliResults?.[0]?.result_data || {};
    const systemInstruction = buildSystemPrompt(chartData, birthInput, userLanguage);

    // ── Return API key (Base64-encoded) + system instruction ──
    return new Response(
      JSON.stringify({
        apiKey: btoa(GEMINI_API_KEY),
        systemInstruction,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-gemini-key error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
