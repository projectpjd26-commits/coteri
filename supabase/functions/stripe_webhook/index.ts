import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

/** Returns true if the error is a Postgres unique violation (duplicate key). */
function isDuplicateKeyError(err: { code?: string; message?: string }): boolean {
  return err?.code === "23505" || /duplicate key|unique constraint/i.test(err?.message ?? "");
}

/** Structured log once per event at terminal state. Never log secrets or raw payloads. */
function logTerminalState(
  requestId: string,
  eventId: string,
  type: string,
  status: "success" | "ignored" | "error",
  durationMs: number,
  errorMessage?: string,
) {
  const payload: Record<string, unknown> = { request_id: requestId, event_id: eventId, type, status, duration_ms: durationMs };
  if (errorMessage) payload.error = errorMessage;
  console.log(JSON.stringify(payload));
}

async function getSubscriptionExpiresAt(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = subscription.current_period_end;
  return currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : new Date().toISOString();
}

type ProcessResult = { status: "ignored" } | { status: "success" } | { status: "error"; errorMessage: string };

/** Single pipeline for webhook ingestion and replay. Idempotent on event_id. */
async function processEvent(supabase: ReturnType<typeof createClient>, event: Stripe.Event): Promise<ProcessResult> {
  const receivedAt = new Date().toISOString();
  const { data: inserted, error: insertErr } = await supabase
    .from("stripe_webhook_events")
    .upsert(
      {
        event_id: event.id,
        event_type: event.type,
        status: "received",
        received_at: receivedAt,
      },
      { onConflict: "event_id", ignoreDuplicates: true },
    )
    .select("id");

  if (insertErr) {
    return { status: "ignored" };
  }
  if (!inserted || inserted.length === 0) {
    return { status: "ignored" };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const membershipId = session.client_reference_id;
        const subscriptionId = session.subscription as string | null;

        if (!membershipId || !subscriptionId) break;

        const expiresAt = await getSubscriptionExpiresAt(subscriptionId);

        const { error: updateErr } = await supabase
          .from("memberships")
          .update({
            status: "active",
            stripe_subscription_id: subscriptionId,
            expires_at: expiresAt,
          })
          .eq("id", membershipId);

        if (updateErr) throw updateErr;

        const { error: verifyErr } = await supabase
          .from("membership_verifications")
          .upsert(
            { membership_id: membershipId, method: "stripe" },
            { onConflict: "membership_id,method", ignoreDuplicates: true },
          );

        if (verifyErr) console.error(verifyErr);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;

        if (!subscriptionId) break;

        const expiresAt = await getSubscriptionExpiresAt(subscriptionId);

        await supabase
          .from("memberships")
          .update({ expires_at: expiresAt })
          .eq("stripe_subscription_id", subscriptionId)
          .eq("status", "active");

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("memberships")
          .update({ status: "expired" })
          .eq("stripe_subscription_id", subscription.id)
          .neq("status", "revoked");

        break;
      }

      default:
        break;
    }
  } catch (err) {
    const processedAt = new Date().toISOString();
    const errorMessage = err instanceof Error ? err.message : String(err);
    try {
      await supabase
        .from("stripe_webhook_events")
        .update({
          status: "error",
          processed_at: processedAt,
          error: errorMessage,
        })
        .eq("event_id", event.id);
    } catch (updateErr) {
      console.error(updateErr);
    }
    return { status: "error", errorMessage };
  }

  try {
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "success", processed_at: new Date().toISOString() })
      .eq("event_id", event.id);
  } catch (updateErr) {
    console.error(updateErr);
  }

  return { status: "success" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const startMs = Date.now();

  // --- Replay mode: admin-only, same pipeline, no change to Stripe webhook interface
  const replayToken = Deno.env.get("REPLAY_TOKEN");
  const headerToken = req.headers.get("x-replay-token");
  if (replayToken && headerToken && headerToken === replayToken) {
    let body: { event_id?: string };
    try {
      body = (await req.json()) as { event_id?: string };
    } catch {
      return new Response(JSON.stringify({ ok: true, replay: true, error: "Invalid JSON body" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const eventId = body?.event_id;
    if (!eventId || typeof eventId !== "string") {
      return new Response(JSON.stringify({ ok: true, replay: true, error: "Missing event_id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let event: Stripe.Event;
    try {
      event = await stripe.events.retrieve(eventId);
    } catch (fetchErr) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const durationMs = Date.now() - startMs;
      logTerminalState(requestId, eventId, "replay_fetch", "error", durationMs, errMsg);
      try {
        await supabase
          .from("stripe_webhook_events")
          .upsert(
            {
              event_id: eventId,
              event_type: null,
              status: "error",
              received_at: new Date().toISOString(),
              processed_at: new Date().toISOString(),
              error: errMsg,
            },
            { onConflict: "event_id" },
          );
      } catch (upErr) {
        console.error(upErr);
      }
      return new Response(JSON.stringify({ ok: true, replay: true, error: errMsg }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await processEvent(supabase, event);
    const durationMs = Date.now() - startMs;
    if (result.status === "error") {
      logTerminalState(requestId, event.id, event.type, "error", durationMs, result.errorMessage);
    } else {
      logTerminalState(requestId, event.id, event.type, result.status, durationMs);
    }
    return new Response(JSON.stringify({ ok: true, replay: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Normal Stripe webhook path
  const sig = req.headers.get("stripe-signature")!;
  const rawBody = await req.arrayBuffer();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const result = await processEvent(supabase, event);
  const durationMs = Date.now() - startMs;

  if (result.status === "ignored") {
    logTerminalState(requestId, event.id, event.type, "ignored", durationMs);
    return new Response("ok", { status: 200 });
  }

  if (result.status === "error") {
    logTerminalState(requestId, event.id, event.type, "error", durationMs, result.errorMessage);
    return new Response("ok", { status: 200 });
  }

  logTerminalState(requestId, event.id, event.type, "success", durationMs);
  return new Response("ok", { status: 200 });
});

// ---------------------------------------------------------------------------
// VERIFICATION CHECKLIST
// ---------------------------------------------------------------------------
// • Signature: invalid signature => 400; valid => processing.
// • Idempotency: duplicate event_id => 200, status=ignored, no double-processing.
// • No 5xx after verification: all paths after constructEvent return 200.
// • anon SELECT stripe_webhook_events: 0 rows (RLS). authenticated: only own memberships/verifications.
// • Stripe replay: same event_id short-circuited; handler updates/upserts only => no duplicate data.
// • Replay mode: only when x-replay-token matches REPLAY_TOKEN; returns 200 with { ok: true, replay: true }.
