import { getServerContext } from "@/src/features/organizations/db/get-context";

export default async function SettingsPage() {
  const { organizationName } = await getServerContext();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage settings for <span className="text-zinc-200 font-medium">{organizationName}</span>.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
        Account and workspace settings — wire your product-specific fields here.
      </div>
    </div>
  );
}
