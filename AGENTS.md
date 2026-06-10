<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — Breaking Changes That Will Trip You Up

This project runs **Next.js 16.x** (App Router). Your training data likely reflects Next.js 14/15.
The following APIs changed and **will cause TypeScript or runtime errors if you use the old form**.

## 1. `params` and `searchParams` are now Promises

```tsx
// ❌ Next.js 14 (will error in 16)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}

// ✅ Next.js 16
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

Same for `searchParams` in pages and `generateMetadata`.

## 2. `cookies()`, `headers()`, `draftMode()` are now async

```ts
// ❌ Old
import { cookies } from "next/headers";
const store = cookies();

// ✅ New
import { cookies } from "next/headers";
const store = await cookies();
```

## 3. `next/font` is the ONLY supported font loading method

Never use `<link>` tags or CSS `@import` for fonts. Use `next/font/google` or `next/font/local`
in the root layout. Fonts are already configured in `app/layout.tsx` — do not add more there.

## 4. Route Handlers must return `Response` (not `NextResponse` for simple cases)

```ts
// ✅ Preferred
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

## 5. `"use client"` boundary — Server Components cannot import Client Components that export async functions

Keep server logic in Server Components / Server Actions. Client Components must be leaf nodes
or accept only serializable props. Do not pass functions as props across the boundary.
<!-- END:nextjs-agent-rules -->
