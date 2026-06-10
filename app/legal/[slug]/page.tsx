import { notFound } from "next/navigation";
import Link from "next/link";
import factoryConfig from "@/src/config/factory.config";
import type { Metadata } from "next";

const LEGAL_PAGES: Record<string, { title: string; updated: string }> = {
  privacy: { title: "Privacy Policy", updated: "January 1, 2025" },
  terms: { title: "Terms of Service", updated: "January 1, 2025" },
  cookies: { title: "Cookie Policy", updated: "January 1, 2025" },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];
  if (!page) return {};
  return { title: page.title };
}

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }));
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];
  if (!page) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 py-16 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to home
        </Link>

        <h1 className="text-2xl font-semibold text-white">{page.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {factoryConfig.legal.companyName} · Last updated: {page.updated}
        </p>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-400 space-y-4">
          <p>
            This is a placeholder {page.title.toLowerCase()} for{" "}
            <strong className="text-zinc-200">{factoryConfig.product.name}</strong>.
          </p>
          <p>
            Replace the content of{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
              app/legal/[slug]/page.tsx
            </code>{" "}
            with your product-specific legal text, or wire it to a CMS.
          </p>
        </div>

        <p className="mt-8 text-xs text-zinc-600">
          Questions?{" "}
          <a
            href={`mailto:${factoryConfig.product.supportEmail}`}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {factoryConfig.product.supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}
