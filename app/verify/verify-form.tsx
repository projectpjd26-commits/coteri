"use client";

import { useActionState, useEffect, useState } from "react";
import type { VerifyApiResult } from "./page";

type VerifyAction = (prev: VerifyApiResult | null, formData: FormData) => Promise<VerifyApiResult>;

const MIN_DISPLAY_MS = 500;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function lastScanAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
}

type Props = {
  initialResult: VerifyApiResult | null;
  venueName: string;
  staffRole: string;
  verifyAction: VerifyAction;
};

export function VerifyForm({ initialResult, venueName, staffRole, verifyAction }: Props) {
  const [result, setResult] = useState<VerifyApiResult | null>(initialResult);
  const [minDisplayMet, setMinDisplayMet] = useState(false);
  const [highBrightness, setHighBrightness] = useState(false);
  const [state, formAction, isPending] = useActionState(verifyAction, null);

  useEffect(() => {
    setResult(initialResult);
  }, [initialResult]);

  useEffect(() => {
    if (state && !state.rateLimited) setResult(state);
  }, [state]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setMinDisplayMet(true), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (result && state) setMinDisplayMet(false);
  }, [result, state]);

  const showResult = result && (minDisplayMet || !isPending);
  const tierLabel = result?.tier ? `${result.tier.charAt(0).toUpperCase()}${result.tier.slice(1)} Member` : null;

  return (
    <div className={highBrightness ? "verify-high-brightness min-h-screen flex flex-col" : "min-h-screen flex flex-col"}>
      {/* Minimal header: venue + role, no nav */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          <span className="text-neutral-300">{venueName}</span>
          <span className="mx-2" aria-hidden>·</span>
          <span>{staffRole}</span>
        </p>
        <button
          type="button"
          onClick={() => setHighBrightness((v) => !v)}
          className="text-xs font-medium px-2 py-1.5 rounded border border-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
          aria-pressed={highBrightness}
          aria-label={highBrightness ? "Switch to normal brightness" : "Switch to high brightness for bright environments"}
        >
          {highBrightness ? "Normal" : "Bright"}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {!showResult ? (
          <>
            <p className="text-neutral-500 text-sm mb-4">Paste link or scan code to verify</p>
            <form
              action={formAction}
              className="w-full max-w-md space-y-3"
            >
              <input
                type="text"
                name="payload"
                placeholder="membership:&lt;uuid&gt; or paste link"
                className="w-full min-h-[48px] px-4 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                autoComplete="off"
                aria-label="Payload or membership link"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full min-h-[48px] rounded-lg font-semibold bg-neutral-700 text-neutral-100 hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50"
              >
                {isPending ? "Checking…" : "Verify"}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Deterministic state banner — color + large text (accessibility) */}
            <div
              role="status"
              aria-live="polite"
              className="w-full max-w-lg rounded-2xl p-8 sm:p-10 text-center text-white shadow-xl"
              style={{
                backgroundColor:
                  result.result === "VALID"
                    ? "#14532d"
                    : result.result === "EXPIRED"
                      ? "#9a3412"
                      : "#7f1d1d",
              }}
            >
              <p className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
                {result.result === "VALID"
                  ? "VALID"
                  : result.result === "EXPIRED"
                    ? "EXPIRED"
                    : "NOT VALID"}
              </p>
              <p className="mt-3 text-xl sm:text-2xl font-medium opacity-95">
                {result.result === "VALID"
                  ? "Admit"
                  : result.result === "EXPIRED"
                    ? "Membership expired"
                    : "Do not admit"}
              </p>

              {result.result === "VALID" && (
                <>
                  {tierLabel && <p className="mt-2 text-lg opacity-90">{tierLabel}</p>}
                  <p className="mt-1 text-base opacity-90">{result.venue}</p>
                </>
              )}
              {result.result === "EXPIRED" && result.expiresAt && (
                <p className="mt-2 text-base opacity-90">
                  Membership expired {formatDate(result.expiresAt)}
                </p>
              )}
              {result.result === "INVALID" && (
                <p className="mt-2 text-base opacity-90">No active membership found</p>
              )}
            </div>

            {/* Secondary metadata — small */}
            <div className="mt-6 text-center text-sm text-neutral-500 space-y-1">
              <p>Verified at {formatTime(result.verifiedAt)}</p>
              {result.lastVerifiedAt && result.result === "VALID" && (
                <p>Last scan {lastScanAgo(result.lastVerifiedAt)}</p>
              )}
              <p>{result.venue}</p>
            </div>

            {/* Scan another — clear result so form shows again */}
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setMinDisplayMet(false);
              }}
              className="mt-8 px-6 py-3 rounded-lg font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              Scan another
            </button>
          </>
        )}
      </main>
    </div>
  );
}
