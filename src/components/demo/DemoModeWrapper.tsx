'use client'

import { type ReactNode } from 'react'
import { DemoProvider } from './DemoContext'
import { DemoOverlay } from './DemoOverlay'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

type DemoModeWrapperProps = {
  children: ReactNode
}

/**
 * When NEXT_PUBLIC_DEMO_MODE === 'true', wraps the app with DemoProvider
 * and renders DemoOverlay when the demo is active. Otherwise renders children only.
 */
export function DemoModeWrapper({ children }: DemoModeWrapperProps) {
  if (!DEMO_MODE) {
    return <>{children}</>
  }

  return (
    <DemoProvider>
      {children}
      <DemoOverlay />
    </DemoProvider>
  )
}
