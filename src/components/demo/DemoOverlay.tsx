'use client'

import { useDemo } from './DemoContext'

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'This is what a member sees',
    body: 'Their membership pass with venue, tier, and status. Everything they need in one place.',
  },
  {
    title: 'They show this at the door',
    body: 'The QR code or access code is what staff will scan or type to verify membership instantly.',
  },
  {
    title: 'Staff scans or pastes',
    body: 'On the Staff Verify page, staff can paste the member’s link, enter the access code, or scan the QR with the camera.',
  },
  {
    title: 'Instant yes / no',
    body: 'COTERI returns an immediate valid or not valid result. No forms, no waiting—just fast door flow.',
  },
]

export function DemoOverlay() {
  const { demoStep, nextStep, endDemo, isDemoMode } = useDemo()

  if (!isDemoMode || demoStep === null) return null

  const step = demoStep as 0 | 1 | 2 | 3
  const { title, body } = STEPS[step]
  const isLast = step === 3

  return (
    <div
      className="fixed z-[100] flex flex-col bg-[#0f0f0f] text-white shadow-2xl border border-white/20 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none md:max-w-[360px] md:w-full w-full max-h-[45vh] md:max-h-none md:h-full md:bottom-0 md:top-0 md:right-0 bottom-0 left-0 right-0"
      style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.4)' }}
      aria-live="polite"
      aria-label="Demo walkthrough"
    >
      <div className="p-5 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider" aria-hidden>
            Demo step {step + 1}/4
          </span>
          <button
            type="button"
            onClick={endDemo}
            className="text-sm text-gray-400 hover:text-white underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] rounded"
          >
            Exit demo
          </button>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-300 leading-relaxed flex-1">{body}</p>
        <div className="mt-5 pt-4 border-t border-white/10">
          {isLast ? (
            <button
              type="button"
              onClick={endDemo}
              className="w-full min-h-[48px] rounded-xl bg-amber-500 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0f0f0f]"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="w-full min-h-[48px] rounded-xl bg-amber-500 text-black font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0f0f0f]"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
