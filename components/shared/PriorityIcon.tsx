import { ChevronsUp, ChevronUp, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

const PRIORITY_CONFIG: Record<Priority, { icon: typeof ChevronsUp; color: string; label: string }> = {
  URGENT: { icon: ChevronsUp, color: "text-red-500", label: "긴급" },
  HIGH: { icon: ChevronUp, color: "text-orange-500", label: "높음" },
  MEDIUM: { icon: Minus, color: "text-yellow-500", label: "보통" },
  LOW: { icon: ChevronDown, color: "text-blue-500", label: "낮음" },
};

type Props = {
  priority: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

export function PriorityIcon({ priority, size = 14, showLabel = false, className }: Props) {
  const config = PRIORITY_CONFIG[priority as Priority] ?? PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 shrink-0", config.color, className)}>
      <Icon size={size} />
      {showLabel && <span className="text-[10px] font-medium">{config.label}</span>}
    </span>
  );
}
