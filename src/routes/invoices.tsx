import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inr, invoices, num } from "@/data/erp";

export const Route = createFileRoute("/invoices")({
    head: () => ({
        meta: [
            { title: "Invoices | Engineering ERP" },
            {
                name: "description",
                content: "Manage sales invoices, track payments, and monitor outstanding balances.",
            },
        ],
    }),
    component: InvoicesPage,
});

type Invoice = (typeof invoices)[number];

const columns: Column<Invoice>[] = [
    {
        key: "id",
        header: "Invoice No",
        sortable: true,
        sortValue: (r) => r.id,
        cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.id}</span>,
    },
    {
        key: "date",
        header: "Date",
        sortable: true,
        sortValue: (r) => r.date,
        cell: (r) => <span className="tabular text-muted-foreground">{r.date}</span>,
    },
    {
        key: "party",
        header: "Customer",
        cell: (r) => (
            <Link to="/parties" className="font-medium text-foreground hover:underline">
                {r.party}
            </Link>
        ),
    },
    {
        key: "dc",
        header: "Delivery Challan",
        cell: (r) => (
            <Link to="/dc-entry" className="text-primary hover:underline">
                {r.dc}
            </Link>
        ),
    },
    {
        key: "total",
        header: "Total Value",
        align: "right",
        sortable: true,
        sortValue: (r) => r.total,
        cell: (r) => <span className="font-semibold tabular text-foreground">{inr(r.total)}</span>,
    },
    {
        key: "received",
        header: "Received",
        align: "right",
        cell: (r) => <span className="tabular text-success">{inr(r.received)}</span>,
    },
    {
        key: "outstanding",
        header: "Outstanding",
        align: "right",
        sortable: true,
        sortValue: (r) => r.outstanding,
        cell: (r) => (
            <span className={`font-medium tabular ${r.outstanding > 0 ? "text-warning" : "text-muted-foreground"}`}>
                {inr(r.outstanding)}
            </span>
        ),
    },
    {
        key: "due",
        header: "Due Date",
        sortable: true,
        sortValue: (r) => r.due,
        cell: (r) => <span className="tabular text-muted-foreground">{r.due}</span>,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function InvoicesPage() {
    const featured = invoices[1]; // Pick one for the detail view

    let totalValue = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    invoices.forEach((inv) => {
        totalValue += inv.total;
        totalReceived += inv.received;
        totalOutstanding += inv.outstanding;
        if (inv.status === "Overdue") {
            totalOverdue += inv.outstanding;
        }
    });

    return (
        <>
            <PageHeader
                title="Invoices"
                description="Generate sales invoices against delivery challans and track payment collections."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Plus className="size-3.5" /> Create Invoice
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Total Invoice Value" value={inr(totalValue, true)} hint="All generated invoices" />
                <StatTile label="Total Received" value={inr(totalReceived, true)} hint="Payments collected" tone="success" />
                <StatTile label="Total Outstanding" value={inr(totalOutstanding, true)} hint="Pending collection" tone="primary" />
                <StatTile label="Overdue Amount" value={inr(totalOverdue, true)} hint="Past due date" tone="danger" />
            </div>

            <DataTable
                columns={columns}
                rows={invoices}
                rowKey={(r) => r.id}
                searchPlaceholder="Search invoice no, customer, or DC..."
                searchKeys={(r) => `${r.id} ${r.party} ${r.dc}`}
                statusOptions={["Draft", "Sent", "Partially Paid", "Paid", "Overdue"]}
                statusOf={(r) => r.status}
            />

            <SectionCard
                title={`Invoice Profile · ${featured.id}`}
                description={`${featured.party} · ${featured.date}`}
            >
                <Tabs defaultValue="Overview" className="p-5">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="Overview" className="text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="Financials" className="text-xs">Financials</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Overview" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["Invoice Date", featured.date],
                                ["Due Date", featured.due],
                                ["Customer", featured.party],
                                ["Delivery Challan", featured.dc],
                                ["Status", featured.status],
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
                    <TabsContent value="Financials" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["Taxable Amount", inr(featured.amount)],
                                ["Tax Amount", inr(featured.tax)],
                                ["Total Invoice Value", inr(featured.total)],
                                ["Amount Received", inr(featured.received)],
                                ["Outstanding Balance", inr(featured.outstanding)],
                            ].map(([label, value]) => (
                                <div key={label} className="border-b border-border/70 pb-2">
                                    <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                        {label}
                                    </dt>
                                    <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </TabsContent>
                </Tabs>
            </SectionCard>
        </>
    );
}
