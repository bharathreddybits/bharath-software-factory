import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import factoryConfig from "@/src/config/factory.config";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// ── Model registry ─────────────────────────────────────────────────────────────

const COST_PER_TOKEN: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.0000008, output: 0.000004 },
  "claude-3-5-haiku-20241022": { input: 0.0000008, output: 0.000004 },
  "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
};

function getModel(modelId: string) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (modelId.startsWith("gpt-") && openaiKey) {
    return { model: createOpenAI({ apiKey: openaiKey })(modelId), provider: "openai" };
  }
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  return { model: createAnthropic({ apiKey: anthropicKey })(modelId), provider: "anthropic" };
}

// ── Request body schema ───────────────────────────────────────────────────────

const BodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
  model: z.string().optional(),
});

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response("Supabase environment variables not configured.", { status: 500 });
  }

  // ── Auth: verify session via SSR cookies ────────────────────────────────────
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // no-op: edge route cannot mutate cookies; middleware refreshes them
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Rate limiting — 20 requests / user / minute ───────────────────────────────
  const rateLimitUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rateLimitToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (rateLimitUrl && rateLimitToken) {
    const ratelimit = new Ratelimit({
      redis: new Redis({ url: rateLimitUrl, token: rateLimitToken }),
      limiter: Ratelimit.slidingWindow(20, "1 m"),
    });
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return new Response("Too many requests. Try again shortly.", { status: 429 });
    }
  }

  // ── Org context: query via Supabase REST (edge-safe, no postgres.js) ─────────
  const admin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: membership } = await admin
    .from("memberships")
    .select("organization_id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!membership) {
    return new Response("No organization found. Complete onboarding first.", { status: 403 });
  }

  const organizationId = membership.organization_id as string;

  // ── Parse + validate request body ────────────────────────────────────────────
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const modelId = body.model ?? "claude-haiku-4-5-20251001";

  let modelSetup: ReturnType<typeof getModel>;
  try {
    modelSetup = getModel(modelId);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Model not available.", {
      status: 503,
    });
  }

  const { model, provider } = modelSetup;
  const costs = COST_PER_TOKEN[modelId] ?? { input: 0, output: 0 };

  // ── Stream ─────────────────────────────────────────────────────────────────────
  const result = streamText({
    model,
    system: `You are a helpful AI assistant built into ${factoryConfig.product.name}.`,
    messages: body.messages,
    onFinish: async ({ usage }) => {
      try {
        const inputTokens = usage.inputTokens ?? 0;
        const outputTokens = usage.outputTokens ?? 0;
        const estimatedCost = (inputTokens * costs.input + outputTokens * costs.output).toFixed(6);

        await admin.from("ai_usage").insert({
          organization_id: organizationId,
          user_id: user.id,
          provider,
          model: modelId,
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          estimated_cost: estimatedCost,
        });
      } catch {
        // Ledger write failure must never crash the active token stream
      }
    },
  });

  return result.toTextStreamResponse();
}
