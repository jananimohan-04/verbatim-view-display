import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings2 } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { num, processEntries, processes } from "@/data/erp";

export const Route = createFileRoute("/process-entry")({
  head: () => ({
    meta: [
      { title: "Process Entry | Engineering ERP" },
      {
        name: "description",
        content:
          "Core CNC manufacturing workspace tracking every operation: quantities, good, rejected and rework with machine and operator detail.",
      },
      { property: "og:title", content: "Process Entry | Engineering ERP" },
      {
        property: "og:description",
        content: "Track job movement across turning, milling, VMC, grinding, treatment and inspection.",
      },
    ],
  }),
  component: ProcessEntryPage,
});

type Entry = (typeof processEntries)[number];

const columns: Column<Entry>[] = [
  {
    key: "id",
    header: "Entry No",
    sortable: true,
    sortValue: (r) => r.id,
    cell: (r) => (
      <div>
        <p className="font-semibold tabular text-accent-foreground">{r.id}</p>
        <p className="text-xs tabular text-muted-foreground">{r.date}</p>
      </div>
    ),
  },
  {
    key: "job",
    header: "Job / SO",
    cell: (r) => (
      <div className="text-xs">
        <p className="font-semibold tabular text-foreground">{r.job}</p>
        <p className="tabular text-muted-foreground">{r.so}</p>
      </div>
    ),
  },
  {
    key: "product",
    header: "Product",
    cell: (r) => <span className="block max-w-52 truncate text-muted-foreground">{r.product}</span>,
  },
  {
    key: "process",
    header: "Process Routing",
    sortable: true,
    sortValue: (r) => r.process,
    cell: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.process}</p>
        <p className="text-[11px] text-muted-foreground">
          {r.prev} → {r.next}
        </p>
      </div>
    ),
  },
  {
    key: "progress",
    header: "Processed",
    align: "right",
    cell: (r) => (
      <div className="min-w-24">
        <span className="tabular">
          {num(r.processed)} / {num(r.received)}
        </span>
        <Progress value={(r.processed / r.received) * 100} className="mt-1 h-1" />
      </div>
    ),
  },
  { key: "good", header: "Good", align: "right", cell: (r) => <span className="tabular text-success">{num(r.good)}</span> },
  {
    key: "rejected",
    header: "Rej / Rework",
    align: "right",
    cell: (r) => (
      <span className="tabular text-xs">
        <span className="text-destructive">{num(r.rejected)}</span>
        <span className="text-muted-foreground"> / </span>
        <span className="text-warning">{num(r.rework)}</span>
      </span>
    ),
  },
  {
    key: "machine",
    header: "Machine / Operator",
    cell: (r) => (
      <div className="text-xs">
        <p className="text-foreground">{r.machine}</p>
        <p className="text-muted-foreground">
          {r.operator} · {r.start}–{r.end}
        </p>
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function ProcessEntryPage() {
  return (
    <>
      <PageHeader
        title="Process Entry"
        description="The core manufacturing workspace: record every operation, movement and quality outcome."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Settings2 className="size-3.5" /> Configure Processes
            </Button>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-3.5" /> Create Process Entry
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Operations In Progress" value="2" hint="Milling & VMC lines" tone="primary" />
        <StatTile label="Quantity Processed Today" value={num(1204)} hint="Across 4 machines" />
        <StatTile label="Rejection Rate" value="0.9%" hint="Target ≤ 1.2%" tone="success" />
        <StatTile label="Delayed Operations" value="1" hint="Threading · JOB-0452" tone="danger" />
      </div>

      <DataTable
        columns={columns}
        rows={processEntries}
        rowKey={(r) => r.id}
        pageSize={6}
        searchPlaceholder="Search entry number, job, machine or operator..."
        searchKeys={(r) => `${r.id} ${r.job} ${r.so} ${r.process} ${r.machine} ${r.operator} ${r.product}`}
        statusOptions={["Pending", "In Progress", "Completed", "Delayed"]}
        statusOf={(r) => r.status}
      />

      <SectionCard
        title="Process Master"
        description="Configured manufacturing operations. Custom processes can be added per product routing."
      >
        <div className="flex flex-wrap gap-2 p-5">
          {processes.map((p) => (
            <span
              key={p}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {p}
            </span>
          ))}
          <button className="rounded-md border border-dashed border-primary/40 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-accent-foreground">
            + Add custom process
          </button>
        </div>
      </SectionCard>
    </>
  );
}
