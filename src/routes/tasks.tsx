import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, KanbanSquare, Plus, Rows3, UserRound } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { PriorityTag, StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { tasks } from "@/data/erp";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Management | Engineering ERP" },
      {
        name: "description",
        content:
          "Assign, track and close plant tasks across planning, production, dispatch and accounts with list and Kanban views.",
      },
      { property: "og:title", content: "Task Management | Engineering ERP" },
      {
        property: "og:description",
        content: "Operational task board for CNC manufacturing teams with priorities and due dates.",
      },
    ],
  }),
  component: TasksPage,
});

type Task = (typeof tasks)[number];

const statuses = ["To Do", "In Progress", "Waiting", "Completed", "Cancelled"];

const columns: Column<Task>[] = [
  {
    key: "id",
    header: "Task ID",
    sortable: true,
    sortValue: (r) => r.id,
    cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.id}</span>,
  },
  {
    key: "title",
    header: "Task",
    cell: (r) => (
      <div className="max-w-80">
        <p className="truncate font-medium text-foreground">{r.title}</p>
        <p className="truncate text-xs text-muted-foreground">{r.description}</p>
      </div>
    ),
  },
  { key: "module", header: "Module", cell: (r) => <span className="text-muted-foreground">{r.module}</span> },
  {
    key: "related",
    header: "Linked Record",
    cell: (r) => <span className="tabular text-xs text-accent-foreground">{r.related}</span>,
  },
  { key: "assignee", header: "Assigned To", sortable: true, sortValue: (r) => r.assignee, cell: (r) => r.assignee },
  { key: "priority", header: "Priority", cell: (r) => <PriorityTag priority={r.priority} /> },
  {
    key: "due",
    header: "Due Date",
    sortable: true,
    sortValue: (r) => r.due,
    cell: (r) => <span className="tabular text-muted-foreground">{r.due}</span>,
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function TasksPage() {
  const [view, setView] = useState<"list" | "kanban" | "mine">("list");
  const visible = view === "mine" ? tasks.filter((t) => t.assignee === "M. Sridevi") : tasks;

  return (
    <>
      <PageHeader
        title="Task Management"
        description="Assign, follow up and close operational tasks linked to any ERP record."
        actions={
          <>
            <div className="flex rounded-md border border-border bg-card p-0.5">
              {[
                { id: "list", label: "List", icon: Rows3 },
                { id: "kanban", label: "Kanban", icon: KanbanSquare },
                { id: "mine", label: "My Tasks", icon: UserRound },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id as typeof view)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    view === v.id
                      ? "bg-primary-soft text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <v.icon className="size-3.5" />
                  {v.label}
                </button>
              ))}
            </div>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-3.5" /> Create Task
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="My Open Tasks" value="3" hint="1 urgent" tone="primary" />
        <StatTile label="Overdue Tasks" value="2" hint="TSK-1144, TSK-1148" tone="danger" />
        <StatTile label="Due Today" value="2" hint="Approvals pending" tone="warning" />
        <StatTile label="Completed This Week" value="6" hint="+2 vs last week" tone="success" />
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {statuses.map((status) => {
            const items = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="erp-card flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-foreground">{status}</p>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 p-2.5">
                  {items.map((t) => (
                    <article
                      key={t.id}
                      className="rounded-md border border-border bg-surface px-3 py-2.5 transition-shadow hover:shadow-[var(--shadow-elevated)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tabular text-muted-foreground">
                          {t.id}
                        </span>
                        <PriorityTag priority={t.priority} />
                      </div>
                      <p className="mt-1.5 text-[13px] font-medium text-foreground">{t.title}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="size-3" /> {t.assignee}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular">
                          <CalendarClock className="size-3" /> {t.due}
                        </span>
                      </div>
                    </article>
                  ))}
                  {items.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">
                      No tasks in this stage
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(r) => r.id}
          searchPlaceholder="Search tasks, assignees or linked records..."
          searchKeys={(r) => `${r.id} ${r.title} ${r.assignee} ${r.module} ${r.related}`}
          statusOptions={statuses}
          statusOf={(r) => r.status}
        />
      )}

      <SectionCard title="Activity History" description="Recent updates on plant tasks">
        <ul className="divide-y divide-border">
          {[
            "TSK-1148 marked completed by QC - B. Latha · 31 Aug",
            "TSK-1144 escalated to Urgent by Accounts Head · 2 Sep",
            "TSK-1145 moved to Waiting — supplier response pending · 2 Sep",
            "TSK-1142 assigned to A. Ramesh · 1 Sep",
          ].map((row) => (
            <li key={row} className="flex items-center gap-2.5 px-5 py-3 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-success" />
              {row}
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}
