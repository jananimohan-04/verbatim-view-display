import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { logEntries, num } from "@/data/erp";

export const Route = createFileRoute("/log-entry")({
  head: () => ({
    meta: [
      { title: "Log Entry | Engineering ERP" },
      {
        name: "description",
        content:
          "Operational log with full job traceability: who did what, on which machine, at what quantity and when.",
      },
      { property: "og:title", content: "Log Entry | Engineering ERP" },
      {
        property: "og:description",
        content: "Complete job history and shop-floor traceability log for CNC production.",
      },
    ],
  }),
  component: LogEntryPage,
});

type Log = (typeof logEntries)[number];

const columns: Column<Log>[] = [
  {
    key: "time",
    header: "Date & Time",
    sortable: true,
    sortValue: (r) => r.time,
    cell: (r) => <span className="tabular text-xs font-medium text-foreground">{r.time}</span>,
  },
  { key: "employee", header: "Employee", sortable: true, sortValue: (r) => r.employee, cell: (r) => r.employee },
  {
    key: "job",
    header: "Job",
    cell: (r) => <span className="tabular font-semibold text-accent-foreground">{r.job}</span>,
  },
  { key: "process", header: "Process", cell: (r) => r.process },
  {
    key: "qty",
    header: "Quantity",
    align: "right",
    sortable: true,
    sortValue: (r) => r.qty,
    cell: (r) => <span className="tabular">{num(r.qty)}</span>,
  },
  {
    key: "action",
    header: "Action Performed",
    cell: (r) => <span className="font-medium text-foreground">{r.action}</span>,
  },
  { key: "machine", header: "Machine", cell: (r) => <span className="text-muted-foreground">{r.machine}</span> },
  { key: "remarks", header: "Remarks", cell: (r) => <span className="block max-w-56 truncate text-muted-foreground">{r.remarks}</span> },
];

const jobHistory = [
  { stage: "Inward Received", detail: "4,180 nos EN8 bar accepted · IN-2026-0331", state: "done" },
  { stage: "Process Started", detail: "CNC Turning on DMG MORI NLX-2500 · K. Muthu", state: "done" },
  { stage: "Quantity Completed", detail: "1,188 good · 8 rejected · 4 rework", state: "done" },
  { stage: "Sent to Next Process", detail: "Moved to CNC Milling (Haas VF-4SS)", state: "done" },
  { stage: "Rework", detail: "4 nos re-machined and re-inspected", state: "done" },
  { stage: "QC Approved", detail: "Awaiting final milling batch clearance", state: "active" },
  { stage: "Finished Goods", detail: "Target FG Rack B-11 · balance 400 nos", state: "todo" },
];

function LogEntryPage() {
  return (
    <>
      <PageHeader
        title="Log Entry"
        description="Complete operational log providing traceability for every job, process and operator action."
        actions={
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="size-3.5" /> Add Log Entry
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Entries Today" value="4" hint="Shift A & B" />
        <StatTile label="Quantity Logged" value={num(1020)} hint="Across 3 jobs" tone="primary" />
        <StatTile label="Active Operators" value="6" hint="4 machines running" />
        <StatTile label="Rework Logged" value="12" hint="JOB-0452 threading" tone="warning" />
      </div>

      <DataTable
        columns={columns}
        rows={logEntries}
        rowKey={(r) => r.time + r.job}
        searchPlaceholder="Search job, employee, process or machine..."
        searchKeys={(r) => `${r.job} ${r.employee} ${r.process} ${r.machine} ${r.action}`}
      />

      <SectionCard title="Complete Job History · JOB-0441" description="Hydraulic Cylinder End Cap - 80mm for SO-2026-001">
        <ol className="relative space-y-4 px-8 py-5">
          <span className="absolute top-7 bottom-7 left-[38px] w-px bg-border" />
          {jobHistory.map((h) => (
            <li key={h.stage} className="relative flex gap-3">
              <span
                className={`z-10 mt-1 size-3 shrink-0 rounded-full border-2 border-card ${
                  h.state === "done" ? "bg-success" : h.state === "active" ? "bg-primary" : "bg-border-strong"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{h.stage}</p>
                <p className="text-xs text-muted-foreground">{h.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </>
  );
}
