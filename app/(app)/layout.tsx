import { Sidebar } from "@/components/layout/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
