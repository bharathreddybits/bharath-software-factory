# Bharath Software Factory

> Ship SaaS products 10× faster with Claude Code and AI-native architecture.

BSF is a production-ready SaaS boilerplate and **Product Factory Platform** — not just a starter template. It standardizes infrastructure, development workflows, product architecture, and AI collaboration patterns so that 80–90% of concerns are solved before you write a single line of product-specific code.

---

## Quick Start (< 4 hours to a working product)

### 1. Fork and clone

```bash
git clone https://github.com/bharathreddybits/bharath-software-factory.git my-product
cd my-product
npm install
```

### 2. Copy environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. See the comments in `.env.example` for where to find each key.

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Copy your Project URL and anon key into `.env.local`.
3. Run the schema migrations (Phase 2 — coming soon).

### 4. Rebrand in 10 seconds

Open [`src/config/factory.config.ts`](src/config/factory.config.ts) and update:

```ts
product: {
  name: "Your Product Name",
  tagline: "Your tagline here.",
  domain: "yourproduct.com",
  ...
}
```

That single file drives the app name, SEO metadata, branding colors, enabled modules, and legal links across the entire product.

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Set your environment variables in the Vercel dashboard (copy from `.env.example`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Magic Link + OAuth) |
| Payments | DoDo Payments (US) + Razorpay (India) with abstraction layer |
| Email | Resend |
| Analytics | PostHog |
| Error Tracking | Sentry |
| AI | Anthropic Claude + OpenAI |
| Hosting | Vercel |

---

## Project Structure

```
bsf-boilerplate/
├── app/                        # Next.js App Router (routes, layouts, pages)
├── components/
│   └── ui/                     # ShadCN UI primitives
├── lib/                        # Shared utilities (lib/utils.ts, etc.)
├── src/
│   ├── config/
│   │   └── factory.config.ts   # Master config — rebrand here
│   ├── features/               # Feature modules (self-contained)
│   │   ├── subscriptions/
│   │   │   ├── ui/             # React components for this feature
│   │   │   ├── api/            # Server Actions + Route Handlers
│   │   │   ├── db/             # Supabase queries
│   │   │   ├── events/         # Analytics event helpers
│   │   │   ├── tests/          # Vitest + Playwright specs
│   │   │   └── docs/           # Feature-level documentation
│   │   └── organizations/      # (same structure)
│   └── ai/                     # AI persona prompts
│       ├── staff-engineer.md
│       ├── product-manager.md
│       ├── frontend-engineer.md
│       ├── backend-engineer.md
│       ├── designer.md
│       ├── qa-engineer.md
│       ├── security-engineer.md
│       └── growth-marketer.md
├── public/                     # Static assets
├── .env.example                # Environment variable template
└── components.json             # ShadCN configuration
```

---

## The 6-Phase Assembly Line

| Phase | Goal | Status |
|---|---|---|
| **1 — Core Foundation** | Next.js + TypeScript + Tailwind + ShadCN + Config layer | ✅ Done |
| **2 — Database** | Supabase schema, RLS, tenant isolation | ✅ Done |
| **3 — Auth & UI** | Supabase Auth, middleware, dashboard layout, landing page | 🔜 Next |
| **4 — Payments** | DoDo + Razorpay abstraction layer, webhooks | 🔜 Planned |
| **5 — Add-ons** | Resend email, PostHog analytics, AI streaming routes | 🔜 Planned |
| **6 — Monitoring** | Sentry, Vercel deployment configuration | 🔜 Planned |

---

## Adding a New Feature Module

```bash
mkdir -p src/features/my-feature/{ui,api,db,events,tests,docs}
```

Follow the Feature Architecture Standard: every feature is self-contained — UI components live in `ui/`, server actions in `api/`, Supabase queries in `db/`, analytics helpers in `events/`, and tests in `tests/`. No cross-feature imports except through a public barrel (`index.ts`).

To enable a feature, add its toggle to `src/config/factory.config.ts`:

```ts
modules: {
  myFeature: true,
}
```

---

## Claude Prompt Template

Use this template when starting a new feature with Claude Code:

```
You are building a new feature called "<Feature Name>" for the Bharath Software Factory boilerplate.

Product: Bharath Software Factory
Config: src/config/factory.config.ts
Feature module location: src/features/<feature-name>/

Architecture rules:
- UI components go in src/features/<feature-name>/ui/
- Server Actions go in src/features/<feature-name>/api/
- Supabase queries go in src/features/<feature-name>/db/
- Analytics events go in src/features/<feature-name>/events/

Tech stack: Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, ShadCN (base-nova style),
Supabase, Zod for validation, TanStack Query for client-side data.

Read src/ai/staff-engineer.md before writing any code.

Here is the feature I need: ...
```

---

## AI Persona Repository

Every persona in `src/ai/` contains role-specific review frameworks. Reference them in your Claude prompts to get context-appropriate code and reviews.

| Persona | Use When |
|---|---|
| `staff-engineer.md` | General code quality, TypeScript, architecture decisions |
| `product-manager.md` | Scoping features, writing acceptance criteria |
| `frontend-engineer.md` | Building UI components, RSC decisions, accessibility |
| `backend-engineer.md` | API routes, Server Actions, database access patterns |
| `designer.md` | Landing pages, design system, component patterns |
| `qa-engineer.md` | Writing tests, defining acceptance criteria |
| `security-engineer.md` | Auth, RLS, input validation, secrets management |
| `growth-marketer.md` | Analytics instrumentation, email flows, SEO |

---

## Development Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all files
npm run format:check # Prettier check (CI)
```

Pre-commit hooks (Husky + lint-staged) run Prettier and ESLint automatically on every commit.

---

## Environment Variables

All required environment variables are documented in [`.env.example`](.env.example). Copy it to `.env.local` and fill in each value. Never commit `.env.local`.

---

## License

Private — all rights reserved. © Bharath Software Factory.
