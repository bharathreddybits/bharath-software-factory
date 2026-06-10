import { OrgSwitcher } from "./org-switcher";
import { NavLinks } from "./nav-links";
import factoryConfig from "@/src/config/factory.config";
import type { UserContext } from "@/src/features/organizations/db/get-context";

type Props = {
  context: UserContext;
};

export function Sidebar({ context }: Props) {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4">
      {factoryConfig.modules.organizations ? (
        <div className="mb-4 px-1">
          <OrgSwitcher context={context} />
        </div>
      ) : (
        <div className="mb-4 px-1 py-1.5">
          <span className="text-sm font-semibold text-white">{factoryConfig.product.name}</span>
        </div>
      )}

      <NavLinks />

      <div className="mt-auto border-t border-zinc-800 pt-3 px-1">
        <p className="truncate text-xs text-zinc-500">{context.email}</p>
      </div>
    </aside>
  );
}
