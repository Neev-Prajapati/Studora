import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import AuthGuard from "@/components/AuthGuard";
import DeadlinePopup from "@/components/DeadlinePopup";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="h-full flex overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopNav />
          <main className="flex-1 overflow-y-auto outline-none">
            {children}
            <DeadlinePopup />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
