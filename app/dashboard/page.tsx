import { getServerContext } from "@/src/features/organizations/db/get-context";
import factoryConfig from "@/src/config/factory.config";

export default async function DashboardPage() {
  const { organizationName, role } = await getServerContext();

  return (
    <div className="p-8 max-w-4xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">{organizationName}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          You are the <span className="capitalize text-zinc-300">{role}</span> of this workspace.
        </p>
      </div>

      {/* Module status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard title="Organizations" enabled={factoryConfig.modules.organizations} />
        <StatusCard title="Team Management" enabled={factoryConfig.modules.teamManagement} />
        <StatusCard title="AI Features" enabled={factoryConfig.modules.aiFeatures} />
        <StatusCard title="Realtime" enabled={factoryConfig.modules.realtimeFeatures} />
        <StatusCard title="Leaderboards" enabled={factoryConfig.modules.leaderboards} />
        <StatusCard title="Referrals" enabled={factoryConfig.modules.referrals} />
      </div>
    </div>
  );
}

function StatusCard({ title, enabled }: { title: string; enabled: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{title}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            enabled
              ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
              : "bg-zinc-800 text-zinc-500 border border-zinc-700"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
    </div>
  );
}
