# Venue data tables (additive)

These tables extend the schema for more member/venue data **without changing existing tables or architecture**.

## New tables (migrations `20250210130000`, `20250210130001`)

### `venue_transactions`

Purchases at the venue (e.g. drinks, food).

| Column          | Type        | Description |
|----------------|-------------|-------------|
| id             | uuid        | PK |
| venue_id       | uuid        | FK → venues |
| user_id        | uuid        | FK → auth.users |
| membership_id  | uuid        | FK → memberships (optional) |
| occurred_at    | timestamptz | When the purchase happened |
| kind           | text        | e.g. `drink`, `drinks`, `food` |
| quantity       | int         | Default 1 |
| amount_cents   | int         | Optional |
| notes          | text        | Optional |

- **RLS:** Members can `SELECT` only their own rows (`user_id = auth.uid()`).
- **Writes:** No policy for `authenticated` → only **service_role** (e.g. staff API, POS, or a future “record purchase” Edge Function) can INSERT/UPDATE/DELETE.

**Dashboard:** “Your activity” shows **Drinks today** and **This week** by summing `quantity` where `kind IN ('drink','drinks')`.

### `venue_redemptions`

When a member uses a reward/benefit (e.g. free pint, skip the line).

| Column         | Type        | Description |
|----------------|-------------|-------------|
| id             | uuid        | PK |
| venue_id       | uuid        | FK → venues |
| user_id        | uuid        | FK → auth.users |
| membership_id  | uuid        | FK → memberships (optional) |
| benefit_key    | text        | e.g. matches venue_tier_benefits.benefit_key |
| tier_key       | text        | Optional |
| redeemed_at    | timestamptz | When it was used |
| notes          | text        | Optional |

- **RLS:** Members can `SELECT` only their own rows.
- **Writes:** Service_role only (e.g. staff UI or verify flow when marking a benefit as used).

**Dashboard:** “Your activity” shows **Rewards used today** and **This week** (count of rows).

## How to write data

Use the **Supabase service role** (e.g. in an Edge Function, backend API, or one-off script). Example:

```sql
-- Record a drink (after migration)
INSERT INTO public.venue_transactions (venue_id, user_id, membership_id, kind, quantity)
VALUES (
  'venue-uuid-here',
  'user-uuid-here',
  'membership-uuid-here',
  'drink',
  1
);

-- Record a redemption
INSERT INTO public.venue_redemptions (venue_id, user_id, membership_id, benefit_key, tier_key)
VALUES (
  'venue-uuid-here',
  'user-uuid-here',
  'membership-uuid-here',
  'free_house_pint',
  'founder'
);
```

A future staff UI or POS integration would call an API that uses the service role to insert into these tables.
