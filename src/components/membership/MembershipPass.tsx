'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDemo } from '@/components/demo/DemoContext'

export type MembershipPassTier = 'Supporter' | 'VIP' | 'Founder'

export type MembershipPassProps = {
  userId: string
  venueName: string
  tierName?: MembershipPassTier | string
  status: 'active' | 'inactive'
  memberSince?: string | null
  expiresAt?: string | null
}

const TIER_STYLES: Record<string, { borderClass: string }> = {
  Supporter: { borderClass: 'border-[var(--venue-text-muted)]/50' },
  VIP: { borderClass: 'border-purple-400/50' },
  Founder: { borderClass: 'border-[var(--venue-accent)]/60' },
  Member: { borderClass: 'border-[var(--venue-accent)]/50' },
}

function getTierBorder(tier: string) {
  return TIER_STYLES[tier]?.borderClass ?? TIER_STYLES.Supporter.borderClass
}

function accessCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function haptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10)
  }
}

export function MembershipPass({
  userId,
  venueName,
  tierName = 'Supporter',
  status,
  memberSince,
  expiresAt,
}: MembershipPassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const verificationPath = `/verify?user_id=${encodeURIComponent(userId)}`
  const code = accessCode(userId)

  useEffect(() => {
    let cancelled = false
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${verificationPath}`
        : `https://placeholder.example.com${verificationPath}`

    import('qrcode').then((QRCode) => {
      if (cancelled) return
      QRCode.toDataURL(url, { width: 256, margin: 1 }).then((dataUrl: string) => {
        if (!cancelled) setQrDataUrl(dataUrl)
      })
    })
    return () => {
      cancelled = true
    }
  }, [verificationPath])

  const copyLink = useCallback(() => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${verificationPath}`
        : verificationPath
    navigator.clipboard.writeText(url).then(() => {
      haptic()
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }, [verificationPath])

  const tierBorder = getTierBorder(tierName)
  const isActive = status === 'active'
  const { demoStep, isDemoMode } = useDemo()
  const highlightCard = isDemoMode && demoStep === 0
  const highlightQr = isDemoMode && demoStep === 1
  const highlightCopyLink = isDemoMode && demoStep === 2

  const memberSinceFormatted = memberSince ?? (expiresAt ? null : '—')

  return (
    <>
      <div
        className={`venue-theme max-w-sm mx-auto rounded-2xl shadow-xl overflow-hidden border border-white/10 ${tierBorder} ${highlightCard ? 'demo-highlight-ring' : ''}`}
        style={{
          backgroundColor: 'var(--venue-bg)',
          color: 'var(--venue-text)',
        }}
      >
        {/* Top row: venue left, member since right (Equinox-style) */}
        <div className="flex items-start justify-between px-4 pt-4">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--venue-text)' }}>
            {venueName.toUpperCase()}
          </span>
          {memberSinceFormatted && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--venue-text-muted)' }}>Member since</p>
              <p className="text-xs font-medium" style={{ color: 'var(--venue-text)' }}>{memberSinceFormatted}</p>
            </div>
          )}
        </div>

        {/* Header image area — venue-accent gradient */}
        <div
          className="h-20 w-full mt-3"
          style={{
            background: 'linear-gradient(135deg, var(--venue-accent) 0%, rgba(0,0,0,0.5) 50%, var(--venue-bg) 100%)',
          }}
        />

        {/* Name band */}
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--venue-bg-elevated)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--venue-text-muted)' }}>Access code</p>
          <p className="text-sm font-semibold font-mono mt-0.5" style={{ color: 'var(--venue-text)' }}>{code}</p>
        </div>

        {/* QR / show at door */}
        <div className={`px-4 pb-4 pt-4 ${highlightQr ? 'demo-highlight-ring-subtle rounded-lg' : ''}`} style={{ backgroundColor: 'var(--venue-bg-elevated)' }}>
          <button
            type="button"
            onClick={() => isActive && setModalOpen(true)}
            disabled={!isActive}
            className={`w-full rounded-lg bg-white p-3 flex flex-col items-center justify-center min-h-[140px] transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)] ${
              isActive ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {!isActive && (
              <span className="text-2xl mb-2 opacity-70" aria-hidden>🔒</span>
            )}
            {qrDataUrl && isActive ? (
              <img src={qrDataUrl} alt="Verification QR code" className="w-28 h-28 object-contain" />
            ) : (
              <span className="text-sm text-slate-500">{isActive ? 'Loading…' : 'Renew to reactivate'}</span>
            )}
            <span className="mt-2 text-xs font-mono font-semibold text-slate-800">{code}</span>
          </button>
          <div className="flex justify-between items-center mt-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--venue-accent)' }}>{tierName}</span>
            <span className={`text-[10px] font-semibold uppercase ${isActive ? 'venue-badge-glow' : ''}`} style={isActive ? { color: 'var(--venue-success)' } : { color: 'var(--venue-text-muted)' }}>{isActive ? 'Active' : 'Inactive'}</span>
          </div>
          {isActive && (
            <button
              type="button"
              onClick={copyLink}
              className={`mt-3 w-full min-h-[44px] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)] ${highlightCopyLink ? 'demo-highlight-ring demo-arrow-hint' : ''}`}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--venue-text)' }}
            >
              {copySuccess ? 'Copied!' : 'Copy verification link'}
            </button>
          )}
          {!isActive && (
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--venue-accent)' }}>Renew to reactivate access</p>
          )}
        </div>
      </div>

      {modalOpen && isActive && (
        <div
          className="venue-theme fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,15,15,0.95)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Verification QR code"
        >
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)]"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--venue-text)' }}
          >
            Close
          </button>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Verification QR code"
              className="max-w-[280px] w-full h-auto"
            />
          )}
          <p className="mt-4 text-lg font-mono font-semibold" style={{ color: 'var(--venue-text)' }}>
            {code}
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--venue-text-muted)' }}>
            Access code
          </p>
        </div>
      )}
    </>
  )
}
