import Link from "next/link";
import { LayoutDashboard, Settings, Users, Cpu } from "lucide-react";
import { OrgSwitcher } from "./org-switcher";
import factoryConfig from "@/src/config/factory.config";
import type { UserContext } from "@/src/features/organizations/db/get-context";

type Props = {
  context: UserContext;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ context }: Props) {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4">
      {/* Org switcher — only rendered when organizations module is on */}
      {factoryConfig.modules.organizations ? (
        <div className="mb-4 px-1">
          <OrgSwitcher context={context} />
        </div>
      ) : (
        <div className="mb-4 px-1 py-1.5">
          <span className="text-sm font-semibold text-white">{factoryConfig.product.name}</span>
        </div>
      )}

      {/* Primary navigation */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}

        {/* Team management — only when module is enabled */}
        {factoryConfig.modules.teamManagement && (
          <Link
            href="/dashboard/team"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Users className="size-4" />
            Team
          </Link>
        )}

        {/* AI features — only when module is enabled */}
        {factoryConfig.modules.aiFeatures && (
          <Link
            href="/dashboard/ai"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Cpu className="size-4" />
            AI
          </Link>
        )}
      </nav>

      {/* Footer — user info */}
      <div className="mt-auto border-t border-zinc-800 pt-3 px-1">
        <p className="truncate text-xs text-zinc-500">{context.email}</p>
      </div>
    </aside>
  );
}
