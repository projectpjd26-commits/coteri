# Venue Membership MVP

A Next.js membership platform with Supabase authentication, Stripe payments, and tier-based access control.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **Styling:** Tailwind CSS

## Features

- 🔐 Authentication with Supabase
- 💳 Stripe payment integration
- 🎟️ Tiered membership system
- 📱 Responsive design
- 🔒 Row-level security (RLS)
- 🎨 Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/projectpjd26-commits/coteri.git
   cd coteri
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your credentials (Supabase URL/keys, Stripe keys, etc.).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Deploy to Vercel (or use the Vercel GitHub integration for automatic deployments). See `docs/DEPLOY.md` for env vars and Supabase redirect URL setup.

**Before production:** See [docs/PRE-PRODUCTION-CHECKLIST.md](docs/PRE-PRODUCTION-CHECKLIST.md) for a consolidated checklist (admins, migrations, auth, audit, Stripe/QR if used). For CSV/positions, use [docs/MIGRATIONS-CSV-CHECKLIST.md](docs/MIGRATIONS-CSV-CHECKLIST.md) to tick off migrations per env.

**Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) for PR checklist (build, lint, RUNBOOK updates). Version history: [CHANGELOG.md](CHANGELOG.md). Optional/future work: [docs/FUTURE-BACKLOG.md](docs/FUTURE-BACKLOG.md).

## License

MIT
