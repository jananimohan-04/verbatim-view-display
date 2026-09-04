import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { inwardEntries, num } from "@/data/erp";

export const Route = createFileRoute("/inward-entry")({
  head: () => ({
    meta: [
      { title: "Inward Entry | Engineering ERP" },
      {
        name: "description",
        content:
          "Record incoming materials and customer free-issue jobs with challan references, acceptance and rejection quantities.",
      },
      { property: "og:title", content: "Inward Entry | Engineering ERP" },
      {
        property: "og:description",
        content: "Goods inward register linked to sales orders, planned workings and process entries.",
      },
    ],
  }),
  component: InwardPage,
});

type Inward = (typeof inwardEntries)[number];

const columns: Column<Inward>[] = [
  {
    key: "id",
    header: "Inward No",
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
    key: "party",
    header: "Party",
    sortable: true,
    sortValue: (r) => r.party,
    cell: (r) => <span className="block max-w-44 truncate font-medium">{r.party}</span>,
  },
  {
    key: "ref",
    header: "SO / Reference",
    cell: (r) => <span className="tabular text-xs text-accent-foreground">{r.ref}</span>,
  },
  { key: "challan", header: "Challan No", cell: (r) => <span className="tabular text-xs">{r.challan}</span> },
  {
    key: "material",
    header: "Material",
    cell: (r) => <span className="block max-w-56 truncate text-muted-foreground">{r.material}</span>,
  },
  {
    key: "received",
    header: "Received",
    align: "right",
    sortable: true,
    sortValue: (r) => r.received,
    cell: (r) => <span className="tabular">{num(r.received)}</span>,
  },
  {
    key: "accepted",
    header: "Accepted",
    align: "right",
    cell: (r) => <span className="tabular text-success">{num(r.accepted)}</span>,
  },
  {
    key: "rejected",
    header: "Rejected",
    align: "right",
    cell: (r) => (
      <span className={`tabular ${r.rejected > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {num(r.rejected)}
      </span>
    ),
  },
  { key: "weight", header: "Weight", align: "right", cell: (r) => <span className="tabular text-muted-foreground">{r.weight}</span> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

const timeline = [
  { stage: "Challan received at gate", detail: "Security gate pass GP-8841 · 09:12", state: "done" },
  { stage: "Unloaded at stores", detail: "Stores - N. Ravi · 09:48", state: "done" },
  { stage: "Quantity verified", detail: "500 nos against BAS/DC/12018", state: "done" },
  { stage: "Under inspection", detail: "QC - B. Latha · hardness & dimension check", state: "active" },
  { stage: "Accepted to stock", detail: "Pending QC clearance", state: "todo" },
  { stage: "Issued to production", detail: "Awaiting job card JOB-0460", state: "todo" },
];

function InwardPage() {
  return (
    <>
      <PageHeader
        title="Inward Entry"
        description="Manage incoming materials and customer jobs, and link them to orders and production."
        actions={
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="size-3.5" /> Create Inward Entry
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Inward This Month" value="5" hint="9,572 nos received" />
        <StatTile label="Accepted Quantity" value={num(8997)} hint="98.4% acceptance" tone="success" />
        <StatTile label="Rejected Quantity" value={num(73)} hint="Debit note pending" tone="danger" />
        <StatTile label="Under Inspection" value="1" hint="IN-2026-0334 · EN19 bar" tone="warning" />
      </div>

      <DataTable
        columns={columns}
        rows={inwardEntries}
        rowKey={(r) => r.id}
        searchPlaceholder="Search inward number, challan, party or material..."
        searchKeys={(r) => `${r.id} ${r.party} ${r.challan} ${r.material} ${r.ref}`}
        statusOptions={["Accepted", "Partially Accepted", "Under Inspection"]}
        statusOf={(r) => r.status}
      />

      <SectionCard
        title="Status Timeline · IN-2026-0334"
        description="Bharat Alloy Steels · EN19 Bar 50mm against SO-2026-005"
      >
        <ol className="relative space-y-4 px-8 py-5">
          <span className="absolute top-7 bottom-7 left-[38px] w-px bg-border" />
          {timeline.map((t) => (
            <li key={t.stage} className="relative flex gap-3">
              <span
                className={`z-10 mt-1 size-3 shrink-0 rounded-full border-2 border-card ${
                  t.state === "done" ? "bg-success" : t.state === "active" ? "bg-warning" : "bg-border-strong"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{t.stage}</p>
                <p className="text-xs text-muted-foreground">{t.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </>
  );
}
