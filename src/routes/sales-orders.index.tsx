import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link2, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { inr, num, salesOrders } from "@/data/erp";

export const Route = createFileRoute("/sales-orders/")({
  head: () => ({
    meta: [
      { title: "Sales Orders | Engineering ERP" },
      {
        name: "description",
        content:
          "Manage and track all customer sales orders, external quotation references and production requirements.",
      },
      { property: "og:title", content: "Sales Orders | Engineering ERP" },
      {
        property: "og:description",
        content: "Customer order book with production lifecycle, dispatch and invoicing linkage.",
      },
    ],
  }),
  component: SalesOrdersPage,
});

type Order = (typeof salesOrders)[number];

function SalesOrdersPage() {
  const navigate = useNavigate();

  const columns: Column<Order>[] = [
    {
      key: "id",
      header: "SO Number",
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
      cell: (r) => (
        <div>
          <p className="max-w-48 truncate font-medium text-foreground">{r.party}</p>
          <p className="text-xs tabular text-muted-foreground">PO: {r.po}</p>
        </div>
      ),
    },
    {
      key: "product",
      header: "Product",
      cell: (r) => <span className="block max-w-56 truncate text-muted-foreground">{r.product}</span>,
    },
    {
      key: "quotationRef",
      header: "Quotation Ref",
      cell: (r) => (
        <div className="text-xs">
          <p className="tabular text-foreground">{r.quotationRef}</p>
          <p className="inline-flex items-center gap-1 text-muted-foreground">
            <Link2 className="size-3" /> {r.integration}
          </p>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      sortable: true,
      sortValue: (r) => r.qty,
      cell: (r) => <span className="tabular">{num(r.qty)}</span>,
    },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      cell: (r) => <span className="tabular text-muted-foreground">{inr(r.rate)}</span>,
    },
    {
      key: "value",
      header: "Order Value",
      align: "right",
      sortable: true,
      sortValue: (r) => r.value,
      cell: (r) => <span className="font-semibold tabular">{inr(r.value)}</span>,
    },
    {
      key: "delivery",
      header: "Delivery",
      sortable: true,
      sortValue: (r) => r.delivery,
      cell: (r) => <span className="tabular text-muted-foreground">{r.delivery}</span>,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Sales Orders"
        description="Manage and track all customer sales orders and production requirements."
        actions={
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="size-3.5" /> Create Sales Order
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Open Order Book" value={inr(6220190, true)} hint="5 live orders" tone="primary" />
        <StatTile label="Delivered Value" value={inr(1240854, true)} hint="1 order closed" tone="success" />
        <StatTile label="Delayed Orders" value="1" hint="SO-2026-003 · export" tone="danger" />
        <StatTile label="Quotation Sync" value="4 / 6" hint="1 pending · 1 not linked" tone="warning" />
      </div>

      <DataTable
        columns={columns}
        rows={salesOrders}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate({ to: "/sales-orders/$orderId", params: { orderId: r.id } })}
        searchPlaceholder="Search sales orders, party, PO or quotation reference..."
        searchKeys={(r) => `${r.id} ${r.party} ${r.po} ${r.quotationRef} ${r.product}`}
        statusOptions={["Draft", "Approved", "In Progress", "Delayed", "Completed"]}
        statusOf={(r) => r.status}
      />
    </>
  );
}
