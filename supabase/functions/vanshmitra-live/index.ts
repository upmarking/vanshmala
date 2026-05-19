import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. WebSocket upgrade check
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected websocket upgrade", { status: 400 });
  }

  try {
    // 2. Authentication
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      console.error("No token provided");
      return new Response("Unauthorized: No token provided", { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

    console.log("Authenticating user...");
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response("Unauthorized", { status: 401 });
    }
    console.log(`User ${user.id} authenticated.`);

    // 3. Fetch User Settings & Kundali
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Fetching profile and kundali data...");
    const [{ data: profileData }, { data: kundaliInputs }] = await Promise.all([
      supabase.from("profiles").select("language").eq("user_id", user.id).maybeSingle(),
      supabase.from("kundali_inputs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
    ]);

    const userLanguage = profileData?.language || "en";

    if (!kundaliInputs || kundaliInputs.length === 0) {
      console.error("No kundali found for user");
      return new Response("Forbidden: No Kundali found", { status: 403 });
    }

    const birthInput = kundaliInputs[0];
    const { data: kundaliResult } = await supabase
      .from("kundali_results")
      .select("result_data")
      .eq("user_id", user.id)
      .eq("calc_type", "kundali")
      .order("created_at", { ascending: false })
      .limit(1);

    const chartData = kundaliResult?.[0]?.result_data || {};
    const systemInstruction = buildSystemPrompt(chartData, birthInput, userLanguage);

    // 4. Upgrade to WebSocket
    console.log(`[${user.id}] Upgrading to WebSocket...`);
    const { socket, response } = Deno.upgradeWebSocket(req);

    let geminiSocket: WebSocket | null = null;
    let cleaned = false;

    const cleanupBoth = (initiator: string) => {
      if (cleaned) return;
      cleaned = true;
      console.log(`[${user.id}] Cleanup initiated by: ${initiator}`);
      // Close Gemini socket if still open (not CLOSING or CLOSED)
      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        try { geminiSocket.close(1000, "Session ended"); } catch { /* ignore */ }
      }
      // Close client socket if still open (not CLOSING or CLOSED)
      if (socket.readyState === WebSocket.OPEN) {
        try { socket.close(1000, "Session ended"); } catch { /* ignore */ }
      }
    };

    socket.onopen = () => {
      console.log(`[${user.id}] Client WebSocket opened. Connecting to Gemini...`);
      
      try {
        const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
        geminiSocket = new WebSocket(geminiUrl);

        geminiSocket.onopen = () => {
          console.log(`[${user.id}] Gemini connected. Sending setup...`);
          const setupMsg = {
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
                },
              },
            },
          };
          try {
            if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
              geminiSocket.send(JSON.stringify(setupMsg));
            }
          } catch (err) {
            console.error(`[${user.id}] Error sending Gemini setup:`, err);
            cleanupBoth("gemini.onopen.error");
          }
        };

        geminiSocket.onmessage = (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            try {
              if (typeof e.data !== "string") {
                const text = new TextDecoder().decode(e.data as ArrayBuffer);
                socket.send(text);
              } else {
                socket.send(e.data);
              }
            } catch (err) {
              console.error(`[${user.id}] Error forwarding Gemini → Client:`, err);
            }
          }
        };

        geminiSocket.onclose = (e) => {
          console.log(`[${user.id}] Gemini closed: ${e.code} ${e.reason}`);
          cleanupBoth("gemini.onclose");
        };

        geminiSocket.onerror = (e) => {
          console.error(`[${user.id}] Gemini error:`, e);
          // onclose will fire after onerror, so cleanup happens there
        };

      } catch (err) {
        console.error(`[${user.id}] Error initializing Gemini WebSocket:`, err);
        cleanupBoth("init.error");
      }
    };

    socket.onmessage = (e) => {
      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        try {
          if (typeof e.data !== "string") {
            const text = new TextDecoder().decode(e.data as ArrayBuffer);
            geminiSocket.send(text);
          } else {
            geminiSocket.send(e.data);
          }
        } catch (err) {
          console.error(`[${user.id}] Error forwarding Client → Gemini:`, err);
        }
      }
    };

    socket.onclose = (e) => {
      console.log(`[${user.id}] Client closed: ${e.code} ${e.reason}`);
      cleanupBoth("client.onclose");
    };

    socket.onerror = (e) => {
      console.error(`[${user.id}] Client error:`, e);
    };

    return response;
  } catch (error) {
    console.error("VanshMitra Live error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
