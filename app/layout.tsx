import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/src/lib/analytics/provider";
import factoryConfig from "@/src/config/factory.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: factoryConfig.seo.metaTitle,
  description: factoryConfig.seo.metaDescription,
  openGraph: {
    title: factoryConfig.seo.openGraph.title,
    description: factoryConfig.seo.openGraph.description,
    images: [{ url: factoryConfig.seo.openGraph.imageUrl }],
    siteName: factoryConfig.product.name,
  },
  twitter: {
    card: "summary_large_image",
    title: factoryConfig.seo.openGraph.title,
    description: factoryConfig.seo.openGraph.description,
    images: [factoryConfig.seo.openGraph.imageUrl],
  },
};

// Inject brand color tokens as CSS custom properties so Tailwind utilities
// like bg-[var(--color-primary)] and arbitrary values work across all products.
const brandingStyles = `
  :root {
    --color-primary: ${factoryConfig.branding.primary.value};
    --color-accent: ${factoryConfig.branding.accent.value};
    --color-neutral: ${factoryConfig.branding.neutral.value};
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
