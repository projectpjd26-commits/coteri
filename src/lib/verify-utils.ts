export function extractUserIdFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const asUrl = trimmed.startsWith('http') ? trimmed : `https://dummy.com/${trimmed}`
    const url = new URL(asUrl)
    const userId =
      url.searchParams.get('user_id') ??
      url.searchParams.get('token') ??
      url.pathname.split('/').filter(Boolean).pop()
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
      return userId
  } catch {
    // not a URL
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed))
    return trimmed
  return null
}

export function formatCheckedTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
