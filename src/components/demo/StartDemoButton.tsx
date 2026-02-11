'use client'

import { useDemo } from './DemoContext'

export function StartDemoButton() {
  const { isDemoMode, startDemo } = useDemo()

  if (!isDemoMode) return null

  return (
    <button
      type="button"
      onClick={startDemo}
      className="mb-4 min-h-[40px] px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0f0f0f]"
    >
      Start Demo
    </button>
  )
}
