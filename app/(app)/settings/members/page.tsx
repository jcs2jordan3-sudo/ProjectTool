import { Header } from "@/components/layout/Header";
import { MembersClient } from "@/components/members/MembersClient";
import { db } from "@/lib/db";

export default async function MembersPage() {
  const members = await db.member.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="팀원 관리" />
      <div className="flex-1 overflow-y-auto p-6">
        <MembersClient initialMembers={members} />
      </div>
    </div>
  );
}
