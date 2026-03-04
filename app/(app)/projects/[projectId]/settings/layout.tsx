import { SettingsNav } from "@/components/settings/SettingsNav";

type Props = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function SettingsLayout({ children, params }: Props) {
  const { projectId } = await params;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <SettingsNav projectId={projectId} />
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}
