import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AnimatedContent } from "@/components/layout/animated-content";
import { GlobalNotifications } from "@/components/layout/global-notifications";
import { QuickAdd } from "@/components/layout/quick-add";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          <GlobalNotifications />
          <AnimatedContent>{children}</AnimatedContent>
        </main>
      </div>
      <QuickAdd />
    </div>
  );
}
