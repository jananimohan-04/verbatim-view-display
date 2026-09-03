import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info-soft text-info border-info/20",
  progress: "bg-primary-soft text-accent-foreground border-primary/20",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-destructive-soft text-destructive border-destructive/25",
};

const statusTone: Record<string, keyof typeof tones> = {
  Draft: "neutral",
  Cancelled: "neutral",
  Inactive: "neutral",
  Expired: "neutral",
  "Not Linked": "neutral",
  "To Do": "info",
  Planned: "info",
  Sent: "info",
  Available: "info",
  Reserved: "info",
  Ready: "info",
  "Under Inspection": "info",
  Approved: "success",
  Completed: "success",
  Paid: "success",
  Delivered: "success",
  Accepted: "success",
  Active: "success",
  Reconciled: "success",
  "On Track": "success",
  Synced: "success",
  "In Progress": "progress",
  Dispatched: "progress",
  "Ready for Dispatch": "progress",
  "Partially Paid": "warning",
  "Partially Completed": "warning",
  "Partially Accepted": "warning",
  Pending: "warning",
  Waiting: "warning",
  "Pending Sync": "warning",
  Unreconciled: "warning",
  Delayed: "danger",
  Overdue: "danger",
  Rejected: "danger",
  Critical: "danger",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = statusTone[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

const priorityTone: Record<string, string> = {
  Low: "text-muted-foreground",
  Medium: "text-info",
  High: "text-warning",
  Urgent: "text-destructive",
};

export function PriorityTag({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        priorityTone[priority] ?? "text-muted-foreground",
      )}
    >
      <span className="h-3 w-0.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}
