import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inr, parties } from "@/data/erp";

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Party Entry | Engineering ERP" },
      {
        name: "description",
        content:
          "Master records for customers, suppliers and vendors with GST details, credit limits, payment terms and outstanding balances.",
      },
      { property: "og:title", content: "Party Entry | Engineering ERP" },
      {
        property: "og:description",
        content: "Manage customer, supplier and vendor masters with ledger and order history.",
      },
    ],
  }),
  component: PartiesPage,
});

type Party = (typeof parties)[number];

const columns: Column<Party>[] = [
  {
    key: "code",
    header: "Party Code",
    sortable: true,
    sortValue: (r) => r.code,
    cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.code}</span>,
  },
  {
    key: "name",
    header: "Party Name",
    sortable: true,
    sortValue: (r) => r.name,
    cell: (r) => (
      <div>
        <p className="font-medium text-foreground">{r.name}</p>
        <p className="text-xs text-muted-foreground">
          {r.contact} · {r.mobile}
        </p>
      </div>
    ),
  },
  { key: "type", header: "Type", cell: (r) => <span className="text-muted-foreground">{r.type}</span> },
  { key: "gst", header: "GST Number", cell: (r) => <span className="tabular text-xs">{r.gst}</span> },
  {
    key: "city",
    header: "Location",
    cell: (r) => (
      <span className="text-muted-foreground">
        {r.city}, {r.state}
      </span>
    ),
  },
  { key: "terms", header: "Terms", cell: (r) => r.terms },
  {
    key: "creditLimit",
    header: "Credit Limit",
    align: "right",
    sortable: true,
    sortValue: (r) => r.creditLimit,
    cell: (r) => <span className="tabular">{inr(r.creditLimit, true)}</span>,
  },
  {
    key: "outstanding",
    header: "Outstanding",
    align: "right",
    sortable: true,
    sortValue: (r) => r.outstanding,
    cell: (r) => (
      <span className={`tabular font-semibold ${r.outstanding > 0 ? "text-warning" : r.outstanding < 0 ? "text-info" : "text-muted-foreground"}`}>
        {inr(Math.abs(r.outstanding))} {r.outstanding < 0 ? "Cr" : r.outstanding > 0 ? "Dr" : ""}
      </span>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

const profileTabs = ["Overview", "Sales Orders", "Invoices", "Ledger", "Transactions", "Documents"];

function PartiesPage() {
  const featured = parties[0];

  return (
    <>
      <PageHeader
        title="Party Entry"
        description="Central master for all customers, suppliers and vendors used across the ERP."
        actions={
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="size-3.5" /> Create Party
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Parties" value="7" hint="4 customers · 3 supply partners" />
        <StatTile label="Active Customers" value="4" hint="1 export account" tone="success" />
        <StatTile label="Receivable Exposure" value={inr(4221500, true)} tone="warning" />
        <StatTile label="Payable Exposure" value={inr(200400, true)} tone="primary" />
      </div>

      <DataTable
        columns={columns}
        rows={parties}
        rowKey={(r) => r.code}
        searchPlaceholder="Search party name, code, GST or city..."
        searchKeys={(r) => `${r.code} ${r.name} ${r.gst} ${r.city} ${r.type}`}
        statusOptions={["Active", "Inactive"]}
        statusOf={(r) => r.status}
      />

      <SectionCard
        title={`Party Profile · ${featured.name}`}
        description={`${featured.code} · ${featured.type} · ${featured.terms}`}
      >
        <Tabs defaultValue="Overview" className="p-5">
          <TabsList className="flex-wrap">
            {profileTabs.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Overview" className="mt-4">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Contact Person", featured.contact],
                ["Mobile Number", featured.mobile],
                ["Email", featured.email],
                ["GST Number", featured.gst],
                ["PAN Number", featured.pan],
                ["Payment Terms", featured.terms],
                ["Billing Address", `Plot 44, SIDCO Industrial Estate, ${featured.city}`],
                ["Shipping Address", `Gate 2, Stores Dock, ${featured.city} ${featured.pincode}`],
                ["Credit Limit", inr(featured.creditLimit)],
                ["Opening Balance", inr(128400)],
                ["State", featured.state],
                ["Pincode", featured.pincode],
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
          {profileTabs.slice(1).map((t) => (
            <TabsContent key={t} value={t} className="mt-4">
              <p className="rounded-md border border-dashed border-border bg-surface px-4 py-10 text-center text-xs text-muted-foreground">
                {t} for {featured.name} are linked from their source modules and appear here once
                records exist for the selected period.
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </SectionCard>
    </>
  );
}
