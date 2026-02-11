'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useDemo } from '@/components/demo/DemoContext'
import { StartDemoButton } from '@/components/demo/StartDemoButton'
import { VenueContextBreadcrumb } from '@/components/gateway/VenueContextBreadcrumb'
import { ScannerModal } from './ScannerModal'
import { extractUserIdFromInput, formatCheckedTime } from '@/lib/verify-utils'

export type Benefit = {
  benefit_label: string
  description: string | null
}

export type VerifyResult = {
  valid: boolean
  venue: string
  expiresAt?: string | null
  benefits?: Benefit[]
}

type VerifyClientProps = {
  initialUserId: string | null
  initialResult: VerifyResult | null
}

const VENUE_NAME = 'The Function SF'
const DEBOUNCE_MS = 300

function haptic(type: 'success' | 'failure') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(type === 'success' ? 10 : [5, 50, 5])
  }
}

export function VerifyClient({ initialUserId, initialResult }: VerifyClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'paste' | 'code'>('paste')
  const [input, setInput] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [highBrightness, setHighBrightness] = useState(false)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userIdFromUrl = searchParams.get('user_id')
  const showResult = Boolean(initialUserId && initialResult !== undefined)
  const isValid = initialResult?.valid ?? false
  const { demoStep, isDemoMode, nextStep } = useDemo()
  const highlightPasteArea = isDemoMode && demoStep === 2

  useEffect(() => {
    if (initialResult) {
      setCheckedAt(new Date())
      haptic(initialResult.valid ? 'success' : 'failure')
    }
  }, [initialResult])

  // Auto-advance demo to step 3 when Staff Verify gets a valid result while on step 2
  useEffect(() => {
    if (demoStep === 2 && showResult && initialResult?.valid) {
      nextStep()
    }
  }, [demoStep, showResult, initialResult?.valid, nextStep])

  const verify = useCallback(
    (id: string) => {
      startTransition(() => {
        router.push(`/verify?user_id=${encodeURIComponent(id)}`)
      })
    },
    [router]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const raw = input.trim()
    if (!raw) return
    debounceRef.current = setTimeout(() => {
      const id = extractUserIdFromInput(input)
      if (id) verify(id)
      debounceRef.current = null
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input, verify])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = extractUserIdFromInput(input)
    if (id) verify(id)
  }

  const handleScan = useCallback(
    (result: { token: string }) => {
      verify(result.token)
    },
    [verify]
  )

  const handleScanAnother = () => {
    setInput('')
    setCheckedAt(null)
    startTransition(() => {
      router.push('/verify')
    })
    setScannerOpen(true)
  }

  const handlePasteAgain = () => {
    setInput('')
    setCheckedAt(null)
    startTransition(() => {
      router.push('/verify')
    })
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div
      className={`min-h-screen flex flex-col venue-theme ${highBrightness ? 'verify-high-brightness' : ''}`}
      style={highBrightness ? undefined : { backgroundColor: 'var(--venue-bg)', color: 'var(--venue-text)' }}
    >
      <header className="p-4 pb-2 text-center">
        <div className="absolute top-4 left-4 right-4 flex justify-center md:justify-start">
          <VenueContextBreadcrumb venueName={VENUE_NAME} currentLabel="Staff Verify" variant="venue" />
        </div>
        <div className="flex flex-col items-center pt-12">
          <StartDemoButton />
          <h1 className="text-xl font-bold tracking-tight">{VENUE_NAME}</h1>
          <p className="text-sm mt-0.5 text-gray-400">
            Staff Verification
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {!showResult && (
          <div className={`w-full max-w-md space-y-4 ${highlightPasteArea ? 'demo-highlight-ring rounded-2xl p-4' : ''}`}>
            <div className="flex gap-2 p-1 rounded-lg bg-white/10">
              <button
                type="button"
                onClick={() => setMode('paste')}
                className={`flex-1 min-h-[44px] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] ${mode === 'paste' ? 'bg-white/20' : ''}`}
              >
                Paste Link/Token
              </button>
              <button
                type="button"
                onClick={() => setMode('code')}
                className={`flex-1 min-h-[44px] rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] ${mode === 'code' ? 'bg-white/20' : ''}`}
              >
                Enter Access Code
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                inputMode={mode === 'code' ? 'text' : 'url'}
                autoComplete="off"
                placeholder={mode === 'paste' ? 'Paste link or token' : 'Access code'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl bg-white/10 border border-white/20 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:border-transparent"
                style={{ color: 'var(--venue-text)' }}
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full min-h-[48px] rounded-xl font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)] disabled:opacity-60"
                style={{ backgroundColor: 'var(--venue-accent)', color: '#0f0f0f' }}
              >
                {isPending ? 'Checking…' : 'Verify'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="w-full min-h-[48px] rounded-xl border-2 border-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)]"
            >
              Camera Scan
            </button>
          </div>
        )}

        {showResult && isPending === false && (
          <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
            <div
              className="rounded-2xl p-8 sm:p-10 text-center text-white"
              style={{
                backgroundColor: isValid ? 'var(--venue-success)' : 'var(--venue-secondary)',
                boxShadow: isValid ? '0 0 40px var(--venue-success-glow)' : undefined,
              }}
            >
              <p className="text-6xl sm:text-7xl font-bold tracking-tight leading-none">
                {isValid ? 'VALID' : 'NOT VALID'}
              </p>
              <p className="mt-3 text-xl sm:text-2xl font-medium opacity-95">
                {isValid ? 'Admit' : 'Do not admit'}
              </p>
              {!isValid && (
                <p className="mt-1 text-base opacity-90">No active membership found</p>
              )}
            </div>

            <div className="space-y-2 text-left text-lg" style={{ color: 'var(--venue-text-muted)' }}>
              <p><span style={{ color: 'var(--venue-text)' }}>Venue:</span> {initialResult?.venue ?? VENUE_NAME}</p>
              {isValid && <p><span style={{ color: 'var(--venue-text)' }}>Tier:</span> Member</p>}
              {initialResult?.expiresAt && (
                <p><span style={{ color: 'var(--venue-text)' }}>Expiration:</span> {initialResult.expiresAt}</p>
              )}
              {checkedAt && (
                <p className="text-base opacity-80">Checked: {formatCheckedTime(checkedAt)}</p>
              )}
            </div>

            {isValid && initialResult?.benefits && initialResult.benefits.length > 0 && (
              <div className="text-left" style={{ color: 'var(--venue-text-muted)' }}>
                <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--venue-text)' }}>
                  Member Benefits
                </p>
                <ul className="list-disc list-inside text-sm space-y-0.5 opacity-90">
                  {initialResult.benefits.map((b) => (
                    <li key={b.benefit_label}>
                      {b.description ? `${b.benefit_label}: ${b.description}` : b.benefit_label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleScanAnother}
                className="flex-1 min-h-[48px] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)]"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--venue-text)' }}
              >
                Scan another
              </button>
              <button
                type="button"
                onClick={handlePasteAgain}
                className="flex-1 min-h-[48px] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)]"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--venue-text)' }}
              >
                Paste again
              </button>
            </div>
          </div>
        )}

        {showResult && isPending && (
          <div className="w-full max-w-md rounded-2xl p-8 bg-white/10 animate-pulse" style={{ color: 'var(--venue-text-muted)' }}>
            <div className="h-12 bg-white/20 rounded mb-4" />
            <div className="h-4 bg-white/20 rounded w-2/3" />
            <p className="mt-4 text-center">Checking…</p>
          </div>
        )}
      </main>

      <footer className="p-4 flex justify-center">
        <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]" style={{ color: 'var(--venue-text-muted)' }}>
          <input
            type="checkbox"
            checked={highBrightness}
            onChange={(e) => setHighBrightness(e.target.checked)}
            className="w-5 h-5 rounded border-gray-500"
          />
          High brightness mode
        </label>
      </footer>

      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  )
}
