import type { Metadata } from "next";
import factoryConfig from "@/src/config/factory.config";

export const metadata: Metadata = {
  title: {
    template: `%s — ${factoryConfig.product.name}`,
    default: factoryConfig.product.name,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
