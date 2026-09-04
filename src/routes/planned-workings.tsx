import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus, Rows3 } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { PriorityTag, StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { num, plannedWorkings } from "@/data/erp";

export const Route = createFileRoute("/planned-workings")({
  head: () => ({
    meta: [
      { title: "Planned Workings | Engineering ERP" },
      {
        name: "description",
        content:
          "Production planning workspace for CNC jobs: planned quantities, target dates, priorities and approval status.",
      },
      { property: "og:title", content: "Planned Workings | Engineering ERP" },
      {
        property: "og:description",
        content: "Plan CNC job quantities against target dates with calendar and list views.",
      },
    ],
  }),
  component: PlannedWorkingsPage,
});

type Plan = (typeof plannedWorkings)[number];

const columns: Column<Plan>[] = [
  {
    key: "plan",
    header: "Plan Number",
    sortable: true,
    sortValue: (r) => r.plan,
    cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.plan}</span>,
  },
  {
    key: "party",
    header: "Party",
    sortable: true,
    sortValue: (r) => r.party,
    cell: (r) => (
      <div>
        <p className="max-w-48 truncate font-medium text-foreground">{r.party}</p>
        <p className="text-xs tabular text-muted-foreground">Ref: {r.ref}</p>
      </div>
    ),
  },
  {
    key: "product",
    header: "Product / Job",
    cell: (r) => <span className="block max-w-64 truncate text-muted-foreground">{r.product}</span>,
  },
  {
    key: "required",
    header: "Required",
    align: "right",
    sortable: true,
    sortValue: (r) => r.required,
    cell: (r) => <span className="tabular">{num(r.required)}</span>,
  },
  {
    key: "planned",
    header: "Planned",
    align: "right",
    cell: (r) => (
      <div className="min-w-24">
        <span className="tabular">{num(r.planned)}</span>
        <Progress value={(r.planned / r.required) * 100} className="mt-1 h-1" />
      </div>
    ),
  },
  {
    key: "target",
    header: "Target Date",
    sortable: true,
    sortValue: (r) => r.target,
    cell: (r) => <span className="tabular text-muted-foreground">{r.target}</span>,
  },
  { key: "priority", header: "Priority", cell: (r) => <PriorityTag priority={r.priority} /> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

const weeks = ["Wk 36 · 01–07 Sep", "Wk 37 · 08–14 Sep", "Wk 38 · 15–21 Sep", "Wk 39 · 22–28 Sep"];

function PlannedWorkingsPage() {
  const [view, setView] = useState<"list" | "timeline">("list");

  return (
    <>
      <PageHeader
        title="Planned Workings"
        description="Plan job quantities, sequence the shop floor and track every plan against its target date."
        actions={
          <>
            <div className="flex rounded-md border border-border bg-card p-0.5">
              {[
                { id: "list", label: "List", icon: Rows3 },
                { id: "timeline", label: "Timeline", icon: CalendarDays },
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
                  <v.icon className="size-3.5" /> {v.label}
                </button>
              ))}
            </div>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-3.5" /> Create Planned Working
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Planned Jobs" value="7" hint="7,850 nos planned" />
        <StatTile label="Upcoming Jobs" value="3" hint="Next 14 days" tone="primary" />
        <StatTile label="Overdue Jobs" value="1" hint="PW-2026-0146 · urgent" tone="danger" />
        <StatTile label="Completed Jobs" value="1" hint="Moved to dispatch" tone="success" />
      </div>

      {view === "timeline" ? (
        <SectionCard title="Planning Timeline" description="Plans distributed across the next four weeks">
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            {weeks.map((week, wi) => {
              const items = plannedWorkings.filter((_, i) => i % 4 === wi);
              return (
                <div key={week} className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {week}
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {items.map((p) => (
                      <div key={p.plan} className="rounded-md border border-border bg-card px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold tabular text-accent-foreground">
                            {p.plan}
                          </span>
                          <PriorityTag priority={p.priority} />
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-foreground">
                          {p.product}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {num(p.planned)} / {num(p.required)} nos · {p.target}
                        </p>
                        <div className="mt-1.5">
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <DataTable
          columns={columns}
          rows={plannedWorkings}
          rowKey={(r) => r.plan}
          searchPlaceholder="Search plan number, party, product or reference..."
          searchKeys={(r) => `${r.plan} ${r.party} ${r.product} ${r.ref}`}
          statusOptions={["Draft", "Planned", "Approved", "In Progress", "Completed", "Cancelled"]}
          statusOf={(r) => r.status}
        />
      )}
    </>
  );
}
