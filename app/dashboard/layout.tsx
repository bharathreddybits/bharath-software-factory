import { getServerContext } from "@/src/features/organizations";
import { Sidebar } from "./_components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Enforces auth + org guards; redirects to /login or /onboarding as needed
  const context = await getServerContext();

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar context={context} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
