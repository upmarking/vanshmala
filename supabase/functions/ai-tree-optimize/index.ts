import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { action, tree_id, link_request_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user is tree admin
    const { data: isAdmin } = await supabase.rpc("is_tree_admin", { _user_id: user.id, _tree_id: tree_id });
    if (!isAdmin) throw new Error("Only tree admins can trigger AI optimization");

    if (action === "optimize") {
      // Fetch tree data
      const { data: members } = await supabase
        .from("family_members")
        .select("id, full_name, full_name_hi, gender, generation_level, gotra, date_of_birth, user_id, mool_niwas")
        .eq("tree_id", tree_id);

      const { data: relationships } = await supabase
        .from("family_relationships")
        .select("from_member_id, to_member_id, relationship")
        .eq("tree_id", tree_id);

      // Check if any member appears in other trees
      const userIds = (members || []).filter(m => m.user_id).map(m => m.user_id);
      let crossTreeInfo: any[] = [];

      if (userIds.length > 0) {
        const { data: otherMemberships } = await supabase
          .from("tree_memberships")
          .select("user_id, tree_id")
          .in("user_id", userIds)
          .neq("tree_id", tree_id);

        if (otherMemberships && otherMemberships.length > 0) {
          // Get tree names for cross-tree members
          const otherTreeIds = [...new Set(otherMemberships.map(m => m.tree_id))];
          const { data: otherTrees } = await supabase
            .from("family_trees")
            .select("id, family_name")
            .in("id", otherTreeIds);

          crossTreeInfo = otherMemberships.map(m => ({
            user_id: m.user_id,
            other_tree_id: m.tree_id,
            other_tree_name: otherTrees?.find(t => t.id === m.tree_id)?.family_name,
            member_name: members?.find(mem => mem.user_id === m.user_id)?.full_name,
          }));
        }
      }

      const prompt = `You are analyzing a family tree for structural optimization. Review the data and provide actionable suggestions.

FAMILY MEMBERS (${members?.length || 0}):
${JSON.stringify(members, null, 2)}

RELATIONSHIPS (${relationships?.length || 0}):
${JSON.stringify(relationships, null, 2)}

CROSS-TREE MEMBERS (users who appear in other trees):
${JSON.stringify(crossTreeInfo, null, 2)}

Analyze and return a JSON object with:
1. "suggestions": Array of optimization suggestions, each with:
   - "type": "generation_fix" | "missing_link" | "cross_tree_merge" | "duplicate_detection" | "hierarchy_improvement"
   - "severity": "info" | "warning" | "critical"
   - "title": Short title
   - "description": Detailed explanation
   - "affected_members": Array of member IDs involved
   - "recommended_action": What should be done

2. "health_score": 0-100 score of tree health
3. "summary": Brief summary of tree state

Focus on:
- Generation levels consistency (parent should be generation N, child should be N+1)
- Missing spouse relationships where co-parents exist
- Members appearing in multiple trees that could be merged
- Potential duplicate entries (similar names, same generation)
- Orphan nodes with no relationships`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a family tree analysis expert. Always respond with valid JSON only, no markdown." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || "{}";

      // Strip markdown code fences if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let analysis;
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = { suggestions: [], health_score: 0, summary: content };
      }

      return new Response(JSON.stringify({ success: true, analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze_link_request") {
      // AI analyzes a link request to suggest placement
      const { data: request } = await supabase
        .from("tree_link_requests")
        .select("*")
        .eq("id", link_request_id)
        .single();

      if (!request) throw new Error("Link request not found");

      const { data: members } = await supabase
        .from("family_members")
        .select("id, full_name, full_name_hi, gender, generation_level, gotra, date_of_birth, mool_niwas")
        .eq("tree_id", tree_id);

      const { data: relationships } = await supabase
        .from("family_relationships")
        .select("from_member_id, to_member_id, relationship")
        .eq("tree_id", tree_id);

      // Check if requester has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, full_name_hi, gender, gotra, date_of_birth, mool_niwas")
        .eq("user_id", request.requester_user_id)
        .single();

      const prompt = `A user wants to join this family tree. Analyze where they best fit.

REQUESTER:
- Name: ${request.full_name}
- Claimed relationship: ${request.relationship_claim || "Not specified"}
- Profile data: ${JSON.stringify(profile)}

EXISTING TREE MEMBERS:
${JSON.stringify(members, null, 2)}

RELATIONSHIPS:
${JSON.stringify(relationships, null, 2)}

Return JSON with:
- "suggested_parent_id": The member ID this person is most likely a child of (or null)
- "suggested_relationship": "parent" | "child" | "spouse" | "sibling"
- "confidence": 0-100 confidence score
- "reasoning": Why you suggest this placement
- "alternative_placements": Array of other possible placements with member_id, relationship, confidence`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a family tree placement expert. Always respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);

      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || "{}";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let suggestion;
      try {
        suggestion = JSON.parse(content);
      } catch {
        suggestion = { suggested_parent_id: null, confidence: 0, reasoning: content };
      }

      // Update the link request with AI suggestions
      await supabase
        .from("tree_link_requests")
        .update({
          ai_suggested_parent_id: suggestion.suggested_parent_id,
          ai_suggested_relationship: suggestion.suggested_relationship,
          ai_confidence: suggestion.confidence,
          ai_reasoning: suggestion.reasoning,
        })
        .eq("id", link_request_id);

      return new Response(JSON.stringify({ success: true, suggestion }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tree-optimize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
