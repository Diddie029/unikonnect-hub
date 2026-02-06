import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STUDENT_SYSTEM_PROMPT = `You are UniBot, the friendly AI assistant for UniConnect Hub — a university social and study platform.

You help students with:
1. **FAQs**: Answer common questions about using UniConnect Hub (posting, discussions, profiles, notifications, etc.)
2. **Research Help**: Assist with academic research — explain concepts, help brainstorm thesis topics, suggest study strategies, provide summaries, and guide them through academic writing.
3. **Study Tips**: Share effective study techniques, time management advice, and exam preparation strategies.
4. **Campus Life**: Help with general university questions about coursework, scheduling, and academic resources.

Guidelines:
- Be friendly, encouraging, and student-focused 🎓
- Use emojis sparingly to keep it fun
- Keep answers clear and concise
- If asked about something outside your scope, politely redirect
- Never provide harmful, unethical, or inappropriate content
- For research help, encourage critical thinking rather than just giving answers`;

const ADMIN_SYSTEM_PROMPT = `You are UniBot Admin Assistant for UniConnect Hub — a university social platform.

You help platform administrators with:
1. **System Analytics**: Provide insights about platform usage, user engagement trends, content moderation strategies, and growth metrics.
2. **Moderation Guidance**: Advise on content moderation best practices, handling user reports, suspension policies, and community guidelines.
3. **Platform Management**: Help with user management strategies, feature planning, and platform optimization.
4. **FAQs**: Answer questions about admin tools and dashboard features.

Guidelines:
- Be professional and data-driven
- Provide actionable recommendations
- Reference platform best practices
- Help interpret analytics and suggest improvements
- Advise on fair and transparent moderation policies`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, role } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = role === "admin" ? ADMIN_SYSTEM_PROMPT : STUDENT_SYSTEM_PROMPT;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact the administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
