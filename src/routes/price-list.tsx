import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { inr, priceList } from "@/data/erp";

export const Route = createFileRoute("/price-list")({
    head: () => ({
        meta: [
            { title: "Price List | Engineering ERP" },
            {
                name: "description",
                content: "Manage standard and customer-specific product pricing.",
            },
        ],
    }),
    component: PriceListPage,
});

type PriceListItem = (typeof priceList)[number];

const columns: Column<PriceListItem>[] = [
    {
        key: "product",
        header: "Product",
        sortable: true,
        sortValue: (r) => r.product,
        cell: (r) => (
            <div>
                <p className="font-medium text-foreground">{r.product}</p>
                <p className="text-xs text-muted-foreground">{r.code}</p>
            </div>
        ),
    },
    {
        key: "customer",
        header: "Customer",
        cell: (r) => (
            r.customer === "Standard Price List" ? (
                <span className="text-muted-foreground italic">{r.customer}</span>
            ) : (
                <Link to="/parties" className="font-medium text-foreground hover:underline">
                    {r.customer}
                </Link>
            )
        ),
    },
    {
        key: "standard",
        header: "Standard Price",
        align: "right",
        cell: (r) => <span className="tabular text-muted-foreground">{inr(r.standard)}</span>,
    },
    {
        key: "customerPrice",
        header: "Agreed Price",
        align: "right",
        sortable: true,
        sortValue: (r) => r.customerPrice,
        cell: (r) => <span className="font-semibold tabular text-foreground">{inr(r.customerPrice)}</span>,
    },
    {
        key: "minimum",
        header: "Min. Price",
        align: "right",
        cell: (r) => <span className="tabular text-muted-foreground">{inr(r.minimum)}</span>,
    },
    {
        key: "validity",
        header: "Validity",
        cell: (r) => (
            <span className="text-xs text-muted-foreground">
                {r.from} to {r.to}
            </span>
        ),
    },
    {
        key: "tax",
        header: "Tax",
        cell: (r) => <span className="text-xs text-muted-foreground">{r.tax}</span>,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function PriceListPage() {
    const totalLists = priceList.length;
    const activeLists = priceList.filter((p) => p.status === "Active").length;
    const expiredLists = priceList.filter((p) => p.status === "Expired").length;
    const standardLists = priceList.filter((p) => p.customer === "Standard Price List").length;

    return (
        <>
            <PageHeader
                title="Price List"
                description="Manage standard pricing and customer-specific negotiated rates."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Plus className="size-3.5" /> Add Price List
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Total Price Lists" value={String(totalLists)} hint="All records" />
                <StatTile label="Active Price Lists" value={String(activeLists)} hint="Currently valid" tone="success" />
                <StatTile label="Standard Price Lists" value={String(standardLists)} hint="Base pricing" tone="primary" />
                <StatTile label="Expired Price Lists" value={String(expiredLists)} hint="Needs renewal" tone="warning" />
            </div>

            <DataTable
                columns={columns}
                rows={priceList}
                rowKey={(r) => `${r.code}-${r.customer}`}
                searchPlaceholder="Search product, code, or customer..."
                searchKeys={(r) => `${r.code} ${r.product} ${r.customer}`}
                statusOptions={["Active", "Expired"]}
                statusOf={(r) => r.status}
            />
        </>
    );
}
