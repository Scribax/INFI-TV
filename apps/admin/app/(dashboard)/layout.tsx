"use client";

import { useSession } from "@/hooks/use-session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, loading, logout } = useSession();

  if (loading || admin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar role={admin.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={admin.email} role={admin.role} onLogout={logout} />
        <main className="flex-1 overflow-y-auto bg-brand-glow p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
