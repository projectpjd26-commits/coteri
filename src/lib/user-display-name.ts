/**
 * Display name for the current user: auth metadata (full_name, name) or email local part.
 * Use this everywhere we show the member's name so behavior is consistent.
 */
export function memberDisplayNameFromUser(user: {
  user_metadata?: { full_name?: string; name?: string } | null;
  email?: string | null;
}): string {
  const fromMeta =
    (user.user_metadata?.full_name ?? user.user_metadata?.name)?.trim();
  if (fromMeta) return fromMeta;
  const local = user.email?.split("@")[0]?.trim();
  if (local) return local;
  return "Member";
}
