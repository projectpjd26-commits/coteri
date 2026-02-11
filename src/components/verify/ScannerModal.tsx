'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { extractUserIdFromInput } from '@/lib/verify-utils'

const SCANNER_CONTAINER_ID = 'verify-qr-scanner'

export type ScanResult = { token: string }

type ScannerModalProps = {
  open: boolean
  onClose: () => void
  onScan: (result: ScanResult) => void
  onCameraDenied?: () => void
}

export function ScannerModal({ open, onClose, onScan, onCameraDenied }: ScannerModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'denied' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      stopScanner()
      setStatus('idle')
      setErrorMessage('')
      return
    }

    let mounted = true
    setStatus('loading')

    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const cameras = await Html5Qrcode.getCameras()
        if (!mounted || !open) return
        if (!cameras || cameras.length === 0) {
          setStatus('denied')
          setErrorMessage('No camera found.')
          onCameraDenied?.()
          return
        }

        const container = document.getElementById(SCANNER_CONTAINER_ID)
        if (!container || !mounted) return

        const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID)
        scannerRef.current = scanner

        await scanner.start(
          cameras[0].id,
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
          },
          (decodedText) => {
            if (!mounted) return
            const token = extractUserIdFromInput(decodedText)
            if (token) {
              stopScanner()
              onScan({ token })
              onClose()
            }
          },
          () => {
            // silent scan errors (no code in frame)
          }
        )
        if (mounted) setStatus('scanning')
      } catch (err) {
        if (!mounted) return
        const msg = err instanceof Error ? err.message : String(err)
        if (/permission|denied|not allowed/i.test(msg)) {
          setStatus('denied')
          setErrorMessage('Camera permission denied. Use paste or enter code below.')
          onCameraDenied?.()
        } else {
          setStatus('error')
          setErrorMessage('Camera error — try again.')
        }
      }
    }

    init()
    return () => {
      mounted = false
      stopScanner()
    }
  }, [open, onClose, onScan, onCameraDenied, stopScanner])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR code"
    >
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] rounded-lg bg-white/20 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
        >
          Close
        </button>
      </div>

      {status === 'loading' && (
        <p className="text-lg">Starting camera…</p>
      )}

      {status === 'scanning' && (
        <>
          <p className="mb-4 text-lg font-medium">Point camera at QR code</p>
          <div
            id={SCANNER_CONTAINER_ID}
            className="w-full max-w-[min(100vw,400px)] overflow-hidden rounded-lg"
          />
        </>
      )}

      {(status === 'denied' || status === 'error') && (
        <div className="max-w-sm text-center">
          <p className="mb-4 text-lg font-medium text-red-400">{errorMessage}</p>
          <p className="mb-6 text-sm text-gray-400">
            Use the paste or access code field on the main screen instead.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg bg-white/20 px-6 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-white"
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}
