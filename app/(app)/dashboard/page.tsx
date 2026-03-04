import { Header } from "@/components/layout/Header";

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="대시보드" />
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-sm text-muted-foreground">
          내 이슈 목록이 여기에 표시됩니다.
        </p>
      </div>
    </div>
  );
}
