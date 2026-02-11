export default function MembershipLoading() {
  return (
    <main
      className="venue-theme min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: 'var(--venue-bg)', color: 'var(--venue-text-muted)' }}
    >
      <div className="w-full max-w-[480px]">
        <p className="text-sm">Loading…</p>
      </div>
    </main>
  )
}
