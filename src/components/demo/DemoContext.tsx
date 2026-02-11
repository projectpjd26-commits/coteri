'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export type DemoStep = 0 | 1 | 2 | 3 | null

type DemoContextValue = {
  isDemoMode: boolean
  demoStep: DemoStep
  startDemo: () => void
  nextStep: () => void
  endDemo: () => void
}

const defaultValue: DemoContextValue = {
  isDemoMode: false,
  demoStep: null,
  startDemo: () => {},
  nextStep: () => {},
  endDemo: () => {},
}

const DemoContext = createContext<DemoContextValue>(defaultValue)

export function useDemo() {
  const ctx = useContext(DemoContext)
  return ctx ?? defaultValue
}

type DemoProviderProps = {
  children: ReactNode
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [demoStep, setDemoStep] = useState<DemoStep>(null)

  const startDemo = useCallback(() => {
    setDemoStep(0)
  }, [])

  const nextStep = useCallback(() => {
    setDemoStep((s) => {
      if (s === null || s >= 3) return null
      return (s + 1) as 0 | 1 | 2 | 3
    })
  }, [])

  const endDemo = useCallback(() => {
    setDemoStep(null)
  }, [])

  const value = useMemo<DemoContextValue>(
    () => ({
      isDemoMode: DEMO_MODE,
      demoStep,
      startDemo,
      nextStep,
      endDemo,
    }),
    [demoStep, startDemo, nextStep, endDemo]
  )

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}
