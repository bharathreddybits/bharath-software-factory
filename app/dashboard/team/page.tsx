import { redirect } from "next/navigation";
import factoryConfig from "@/src/config/factory.config";
import { getServerContext } from "@/src/features/organizations";

export default async function TeamPage() {
  if (!factoryConfig.modules.teamManagement) redirect("/dashboard");
  const { organizationName } = await getServerContext();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Team</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Members of <span className="text-zinc-200 font-medium">{organizationName}</span>.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
        Invite and manage team members here.
      </div>
    </div>
  );
}
