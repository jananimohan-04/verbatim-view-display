import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { finishedGoods, num } from "@/data/erp";

export const Route = createFileRoute("/finished-goods")({
  head: () => ({
    meta: [
      { title: "Finished Goods | Engineering ERP" },
      {
        name: "description",
        content: "Manage finished goods inventory, batches, and dispatch readiness.",
      },
    ],
  }),
  component: FinishedGoodsPage,
});

type FinishedGood = (typeof finishedGoods)[number];

const columns: Column<FinishedGood>[] = [
  {
    key: "id",
    header: "FG ID",
    sortable: true,
    sortValue: (r) => r.id,
    cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.id}</span>,
  },
  {
    key: "product",
    header: "Product & Batch",
    sortable: true,
    sortValue: (r) => r.product,
    cell: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.product}</p>
        <p className="text-xs text-muted-foreground">{r.batch}</p>
      </div>
    ),
  },
  {
    key: "so",
    header: "Sales Order",
    cell: (r) => (
      <Link to={`/sales-orders/${r.so}`} className="text-primary hover:underline">
        {r.so}
      </Link>
    ),
  },
  {
    key: "party",
    header: "Party",
    cell: (r) => (
      <Link to="/parties" className="text-muted-foreground hover:text-foreground transition-colors">
        {r.party}
      </Link>
    ),
  },
  {
    key: "available",
    header: "Available",
    align: "right",
    sortable: true,
    sortValue: (r) => r.available,
    cell: (r) => <span className="tabular font-medium">{num(r.available)}</span>,
  },
  {
    key: "reserved",
    header: "Reserved",
    align: "right",
    cell: (r) => <span className="tabular text-muted-foreground">{num(r.reserved)}</span>,
  },
  {
    key: "dispatched",
    header: "Dispatched",
    align: "right",
    cell: (r) => <span className="tabular text-muted-foreground">{num(r.dispatched)}</span>,
  },
  {
    key: "location",
    header: "Location",
    cell: (r) => <span className="text-muted-foreground">{r.location}</span>,
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function FinishedGoodsPage() {
  const featured = finishedGoods[1]; // Pick one for the detail view
  
  const totalAvailable = finishedGoods.reduce((sum, fg) => sum + fg.available, 0);
  const totalReserved = finishedGoods.reduce((sum, fg) => sum + fg.reserved, 0);
  const totalDispatched = finishedGoods.reduce((sum, fg) => sum + fg.dispatched, 0);
  const totalPending = finishedGoods.reduce((sum, fg) => sum + fg.pending, 0);

  return (
    <>
      <PageHeader
        title="Finished Goods"
        description="Track completed production batches, inventory locations, and dispatch readiness."
        actions={
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="size-3.5" /> Add FG Entry
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Available Stock" value={num(totalAvailable)} hint="Ready for allocation" tone="success" />
        <StatTile label="Reserved Stock" value={num(totalReserved)} hint="Allocated to orders" tone="primary" />
        <StatTile label="Dispatched" value={num(totalDispatched)} hint="Total dispatched quantity" />
        <StatTile label="Pending Dispatch" value={num(totalPending)} hint="Awaiting delivery challan" tone="warning" />
      </div>

      <DataTable
        columns={columns}
        rows={finishedGoods}
        rowKey={(r) => r.id}
        searchPlaceholder="Search FG ID, product, batch, or SO..."
        searchKeys={(r) => `${r.id} ${r.product} ${r.batch} ${r.so} ${r.party}`}
        statusOptions={["Available", "Reserved", "Ready for Dispatch", "Dispatched"]}
        statusOf={(r) => r.status}
      />

      <SectionCard
        title={`FG Profile · ${featured.id}`}
        description={`${featured.product} · ${featured.batch}`}
      >
        <Tabs defaultValue="Overview" className="p-5">
          <TabsList className="flex-wrap">
            <TabsTrigger value="Overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="History" className="text-xs">History</TabsTrigger>
          </TabsList>
          <TabsContent value="Overview" className="mt-4">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Product", featured.product],
                ["Batch Number", featured.batch],
                ["Sales Order", featured.so],
                ["Customer", featured.party],
                ["Completed Qty", num(featured.completed)],
                ["Available Qty", num(featured.available)],
                ["Reserved Qty", num(featured.reserved)],
                ["Dispatched Qty", num(featured.dispatched)],
                ["Location", featured.location],
                ["Date Added", featured.date],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-border/70 pb-2">
                  <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
          <TabsContent value="History" className="mt-4">
            <p className="rounded-md border border-dashed border-border bg-surface px-4 py-10 text-center text-xs text-muted-foreground">
              Movement history for {featured.id} will appear here.
            </p>
          </TabsContent>
        </Tabs>
      </SectionCard>
    </>
  );
}
