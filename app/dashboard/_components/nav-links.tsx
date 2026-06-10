"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users, Cpu, CreditCard } from "lucide-react";
import factoryConfig from "@/src/config/factory.config";

const STATIC_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function NavLinks() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const cls = (href: string) =>
    `flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
      isActive(href) ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
    }`;

  return (
    <nav className="flex-1 space-y-0.5">
      {STATIC_NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={cls(href)}>
          <Icon className="size-4" />
          {label}
        </Link>
      ))}

      {factoryConfig.modules.teamManagement && (
        <Link href="/dashboard/team" className={cls("/dashboard/team")}>
          <Users className="size-4" />
          Team
        </Link>
      )}

      {factoryConfig.modules.aiFeatures && (
        <Link href="/dashboard/ai-chat" className={cls("/dashboard/ai-chat")}>
          <Cpu className="size-4" />
          AI Chat
        </Link>
      )}

      {factoryConfig.businessModel.subscriptionEnabled && (
        <Link href="/dashboard/billing" className={cls("/dashboard/billing")}>
          <CreditCard className="size-4" />
          Billing
        </Link>
      )}
    </nav>
  );
}
