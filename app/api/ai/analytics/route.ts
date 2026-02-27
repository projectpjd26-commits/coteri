/**
 * Venue Copilot: on-demand AI analytics over venue data.
 * Uses Vercel AI SDK with tool-calling; tools read only from existing views (RLS applies).
 * Rate-limited per user. Requires venue_staff for the requested venue.
 *
 * Provider (pick one):
 * - Ollama (free, local): set OLLAMA_BASE_URL (e.g. http://localhost:11434) and optional OLLAMA_MODEL (default llama3.2).
 * - Anthropic (paid): set ANTHROPIC_API_KEY. Used when OLLAMA_BASE_URL is not set.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { streamText, tool } from "ai";
import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider-v2";
import { createServerSupabase } from "@/lib/supabase-server";

const AI_RATE_LIMIT_PER_MINUTE = 10;
const aiRateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (aiRateLimitMap.get(userId) ?? []).filter((t) => t > windowStart);
  if (hits.length >= AI_RATE_LIMIT_PER_MINUTE) return false;
  hits.push(now);
  aiRateLimitMap.set(userId, hits);
  return true;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Too many requests; try again in a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL?.trim();
  const useOllama = !!ollamaBaseUrl;

  if (!useOllama && !apiKey) {
    return NextResponse.json(
      { error: "AI Copilot not configured. Set OLLAMA_BASE_URL (e.g. http://localhost:11434) for local Ollama, or ANTHROPIC_API_KEY for Anthropic." },
      { status: 503 }
    );
  }

  const { data: staffRows } = await supabase
    .from("venue_staff")
    .select("venue_id")
    .eq("user_id", user.id);
  const allowedVenueIds = new Set((staffRows ?? []).map((r) => r.venue_id));

  let body: { messages?: unknown[]; venueId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const venueId = typeof body.venueId === "string" ? body.venueId.trim() : null;
  if (!venueId || !allowedVenueIds.has(venueId)) {
    return NextResponse.json(
      { error: "Valid venueId required; you must be staff for that venue." },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  const model = useOllama
    ? createOllama({ baseURL: ollamaBaseUrl })(process.env.OLLAMA_MODEL ?? "llama3.2")
    : createAnthropic({ apiKey })("claude-3-5-haiku-20241022");

  const tools = {
    predict_staffing: tool({
      description:
        "Get peak hours and staffing suggestion for this venue from recent scan heatmap data (venue_daily_hourly_scans).",
      inputSchema: z.object({ _: z.string().optional() }),
      execute: async () => {
        const { data } = await supabase
          .from("venue_daily_hourly_scans")
          .select("day, hour, total_scans")
          .eq("venue_id", venueId)
          .order("day", { ascending: false })
          .limit(7 * 24);
        const rows = (data ?? []) as { day: string; hour: number; total_scans: number }[];
        const byHour = new Map<number, number>();
        for (const r of rows) {
          byHour.set(r.hour, (byHour.get(r.hour) ?? 0) + r.total_scans);
        }
        const sorted = [...byHour.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        return {
          peak_hours: sorted.map(([hour, scans]) => ({ hour, scans })),
          summary: `Peak hours (UTC) by total scans in last 7 days: ${sorted.map(([h]) => `${h}:00`).join(", ") || "no data"}.`,
        };
      },
    }),
    detect_churn: tool({
      description:
        "List members at risk of churn for this venue (from member_visit_frequency and member_behavior_features).",
      inputSchema: z.object({
        min_risk: z.number().min(0).max(1).optional().describe("Minimum churn risk score (0-1) to include"),
      }),
      execute: async ({ min_risk = 0.5 }) => {
        const { data: features } = await supabase
          .from("member_behavior_features")
          .select("user_id, visits_30d, visits_90d, days_since_last_visit, churn_risk_score")
          .eq("venue_id", venueId)
          .gte("churn_risk_score", min_risk)
          .order("churn_risk_score", { ascending: false })
          .limit(20);
        const list = (features ?? []) as { user_id: string; visits_30d: number; visits_90d: number; days_since_last_visit: number | null; churn_risk_score: number }[];
        return {
          at_risk_count: list.length,
          members: list.map((m) => ({
            user_id: m.user_id,
            visits_30d: m.visits_30d,
            days_since_last_visit: m.days_since_last_visit,
            churn_risk_score: m.churn_risk_score,
          })),
          summary: `${list.length} member(s) at or above risk ${min_risk}. Consider targeted outreach.`,
        };
      },
    }),
  };

  const systemPrompt = `You are a venue operations analyst for COTERI. Use the tools to answer questions about staffing (peak hours) or churn risk. Always scope venue tools to the venue the user is asking about. Be concise and actionable.`;

  try {
    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages as { role: "user" | "assistant" | "system"; content: string }[],
      tools,
    });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("AI analytics stream error:", err);
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}
