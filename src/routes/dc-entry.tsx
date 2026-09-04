import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dcEntries, num } from "@/data/erp";

export const Route = createFileRoute("/dc-entry")({
    head: () => ({
        meta: [
            { title: "Delivery Challan | Engineering ERP" },
            {
                name: "description",
                content: "Manage delivery challans, dispatch tracking, and transporter details.",
            },
        ],
    }),
    component: DCEntryPage,
});

type DCEntry = (typeof dcEntries)[number];

const columns: Column<DCEntry>[] = [
    {
        key: "id",
        header: "DC Number",
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
        header: "Party",
        cell: (r) => (
            <Link to="/parties" className="font-medium text-foreground hover:underline">
                {r.party}
            </Link>
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
        key: "product",
        header: "Product",
        cell: (r) => <span className="text-muted-foreground">{r.product}</span>,
    },
    {
        key: "qty",
        header: "Dispatch Qty",
        align: "right",
        sortable: true,
        sortValue: (r) => r.qty,
        cell: (r) => <span className="tabular font-medium">{num(r.qty)}</span>,
    },
    {
        key: "transporter",
        header: "Transporter & E-Way",
        cell: (r) => (
            <div>
                <p className="text-sm text-foreground">{r.transporter}</p>
                <p className="text-xs text-muted-foreground">{r.eway}</p>
            </div>
        ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function DCEntryPage() {
    const featured = dcEntries[0]; // Pick one for the detail view

    const totalDraft = dcEntries.filter((dc) => dc.status === "Draft").length;
    const totalReady = dcEntries.filter((dc) => dc.status === "Ready").length;
    const totalDispatched = dcEntries.filter((dc) => dc.status === "Dispatched").length;
    const totalDelivered = dcEntries.filter((dc) => dc.status === "Delivered").length;

    return (
        <>
            <PageHeader
                title="Delivery Challan"
                description="Create and track delivery challans for outgoing shipments."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Plus className="size-3.5" /> Create DC
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Draft DCs" value={String(totalDraft)} hint="Pending finalization" />
                <StatTile label="Ready for Dispatch" value={String(totalReady)} hint="Awaiting vehicle" tone="primary" />
                <StatTile label="In Transit" value={String(totalDispatched)} hint="Currently dispatched" tone="warning" />
                <StatTile label="Delivered" value={String(totalDelivered)} hint="Successfully delivered" tone="success" />
            </div>

            <DataTable
                columns={columns}
                rows={dcEntries}
                rowKey={(r) => r.id}
                searchPlaceholder="Search DC number, party, SO, or transporter..."
                searchKeys={(r) => `${r.id} ${r.party} ${r.so} ${r.product} ${r.transporter} ${r.eway}`}
                statusOptions={["Draft", "Ready", "Dispatched", "Delivered"]}
                statusOf={(r) => r.status}
            />

            <SectionCard
                title={`DC Profile · ${featured.id}`}
                description={`${featured.party} · ${featured.date}`}
            >
                <Tabs defaultValue="Overview" className="p-5">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="Overview" className="text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="Transport" className="text-xs">Transport Details</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Overview" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["DC Date", featured.date],
                                ["Customer", featured.party],
                                ["Sales Order", featured.so],
                                ["Product", featured.product],
                                ["Ordered Qty", num(featured.ordered)],
                                ["Dispatched Qty", num(featured.qty)],
                                ["Balance Qty", num(featured.balance)],
                                ["Destination", featured.destination],
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
                    <TabsContent value="Transport" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["Transporter", featured.transporter],
                                ["Vehicle Number", featured.vehicle],
                                ["E-Way Bill", featured.eway],
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
                </Tabs>
            </SectionCard>
        </>
    );
}
