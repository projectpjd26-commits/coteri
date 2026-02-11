# OAuth sign-in (Google, Apple, Facebook)

The sign-in page offers **Continue with Google**, **Apple**, and **Facebook** plus email magic link. To make OAuth work you must enable each provider in Supabase and set redirect URLs.

## 1. Supabase Dashboard

1. **Authentication → URL configuration**
   - **Site URL:** your production origin (e.g. `https://yourdomain.com`)
   - **Redirect URLs:** add:
     - `https://yourdomain.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

2. **Authentication → Providers**
   - Turn on **Google**, **Apple**, **Facebook** and fill in the credentials each requires (see below).

## 2. Provider credentials

### Google
- [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web).
- Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- Copy Client ID and Client secret into Supabase → Google provider.

### Apple
- [Apple Developer](https://developer.apple.com/) → Identifiers, Keys, and a Services ID for Sign in with Apple. Set redirect URL to the Supabase callback above.
- In Supabase → Apple: set Services ID, Key ID, Team ID, Bundle ID, and the .p8 private key.

### Facebook
- [Meta for Developers](https://developers.facebook.com/) → create app → Facebook Login → set Valid OAuth Redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`.
- Copy App ID and App Secret into Supabase → Facebook provider.

## 3. App behavior

- User clicks e.g. **Continue with Google** → Supabase redirects to Google → after consent, Supabase redirects to your **Site URL** with `?code=...` (Supabase may use a hash or query; the callback route handles the code exchange).
- Your app’s **`/auth/callback`** route exchanges the `code` for a session via `exchangeCodeForSession(code)` and redirects to the stored `next` path (or `/dashboard`). Same flow works for magic link and OAuth.

If a provider is disabled in Supabase, its button will still be shown but sign-in will fail until the provider is configured.
