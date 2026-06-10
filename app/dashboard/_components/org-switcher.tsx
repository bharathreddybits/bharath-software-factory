"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserContext } from "@/src/features/organizations/db/get-context";

type Props = {
  context: UserContext;
};

export function OrgSwitcher({ context }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
          "text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors",
          open && "bg-zinc-800 text-white"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-700 text-xs font-semibold text-white uppercase">
          {context.organizationName.charAt(0)}
        </span>
        <span className="flex-1 truncate text-left font-medium">{context.organizationName}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-48 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
          {/* Current org (active) */}
          <div className="flex items-center gap-2 rounded-md bg-zinc-800 px-2 py-1.5 text-sm">
            <Building2 className="size-4 text-zinc-400" />
            <span className="flex-1 truncate text-white">{context.organizationName}</span>
            <span className="text-xs text-zinc-500 capitalize">{context.role}</span>
          </div>

          <div className="my-1 border-t border-zinc-800" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            onClick={() => {
              setOpen(false);
              router.push("/onboarding");
            }}
          >
            + Create organization
          </button>
        </div>
      )}
    </div>
  );
}
