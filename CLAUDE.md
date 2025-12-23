# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build (includes TypeScript checking)
npm run lint     # Run ESLint
```

## UI/Design

Always use the `/frontend-design` skill when editing the UI. The design uses:
- Black & white color scheme
- JetBrains Mono font
- Tailwind CSS v4 with dark theme patterns (bg-white/[0.03], border-white/10, etc.)

## Architecture

**Next.js 15 App Router** with React 19 and TypeScript. Multi-tenant client portal for sales team performance tracking.

### Role-Based Authentication

**`/src/lib/auth/roles.ts`** - Central auth utility with 4-tier access:

| Role | Access | Identified By |
|------|--------|---------------|
| `executive` | All client dashboards, full edit | Email in `EXECUTIVE_EMAILS` |
| `client` | Own dashboard only, view-only | Default role with client_id |
| `setter` | Personal stats only | `role = 'setter'` + team_member_id |
| `closer` | Personal stats only | `role = 'closer'` + team_member_id |

Use `getAuthenticatedUser()` in server components for role detection and routing.

### Data Flow Pattern
1. **Server Components** (page.tsx files) call `getAuthenticatedUser()`, fetch data filtered by role/client_id
2. **Client Components** (_components/) handle interactivity, use `createClient()` from `@/lib/supabase/client`
3. Dashboard routing in `/dashboard/page.tsx` redirects by role automatically

### Key Modules

**`/src/types/database.ts`** - All Supabase table interfaces:
- `UserRole` - "executive" | "client" | "setter" | "closer"
- `SetterReport` / `CloserReport` - Daily EOD reports from sales team
- `VSLFunnelReport` - Paid/organic funnel metrics
- `ScheduledCall` - Call scheduling with confirmation status
- `TeamMember` - Setter/Closer team members per client

**`/src/lib/benchmarks.ts`** - Performance thresholds with color-coded status:
- `BENCHMARKS` - VSL funnel metrics (ROAS, CPA, show rate 24%+, close rate 30%+)
- `DM_BENCHMARKS` - DM outreach rates (response, conversation, booking)
- Helper functions return "green"/"yellow"/"red" status

**`/src/lib/supabase/`** - Supabase client factories:
- `server.ts` - Server Components (uses cookies)
- `client.ts` - Client Components (browser)
- `middleware.ts` - Auth session refresh

### Dashboard Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/dashboard` | Role-based router | All authenticated |
| `/dashboard/executive` | All clients overview | Executive only |
| `/dashboard/setter` | Personal setter stats | Setter role |
| `/dashboard/closer-personal` | Personal closer stats | Closer role |
| `/dashboard/eod` | Daily EOD reports | Executive/Client |
| `/dashboard/vsl-paid` | Paid traffic funnel | Executive/Client |
| `/dashboard/vsl-organic` | Organic traffic funnel | Executive/Client |
| `/dashboard/dm-setter` | DM outreach metrics | Executive/Client |
| `/dashboard/closer` | Closer funnel dashboard | Executive/Client |
| `/dashboard/calls-today` | Daily call schedule | Executive/Client |

### Supabase Tables

Main tables: `clients`, `user_profiles`, `team_members`, `setter_reports`, `closer_reports`, `vsl_funnel_reports`, `scheduled_calls`

All queries filter by `client_id` for multi-tenancy. User → user_profiles → client_id → data.

### Adding New Users

**Executive:** Add email to `EXECUTIVE_EMAILS` array in `/src/lib/auth/roles.ts`

**Client:** Create Supabase Auth user, set `user_profiles.role = 'client'` and `client_id`

**Setter/Closer:** Create Supabase Auth user, set `user_profiles.role = 'setter'/'closer'` and `team_member_id` (must match email in `team_members` table)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```
