import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Download } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inr, productCosting } from "@/data/erp";

export const Route = createFileRoute("/product-costing")({
    head: () => ({
        meta: [
            { title: "Product Costing | Engineering ERP" },
            {
                name: "description",
                content: "Detailed cost breakdown and margin analysis for manufactured products.",
            },
        ],
    }),
    component: ProductCostingPage,
});

type ProductCost = (typeof productCosting)[number];

const columns: Column<ProductCost>[] = [
    {
        key: "code",
        header: "Item Code",
        sortable: true,
        sortValue: (r) => r.code,
        cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.code}</span>,
    },
    {
        key: "product",
        header: "Product Name",
        sortable: true,
        sortValue: (r) => r.product,
        cell: (r) => <span className="font-medium text-foreground">{r.product}</span>,
    },
    {
        key: "material",
        header: "Material",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.material)}</span>,
    },
    {
        key: "process",
        header: "Process",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.process)}</span>,
    },
    {
        key: "labour",
        header: "Labour",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.labour)}</span>,
    },
    {
        key: "totalCost",
        header: "Total Cost",
        align: "right",
        sortable: true,
        sortValue: (r) => r.material + r.process + r.labour + r.tool + r.overhead + r.other,
        cell: (r) => {
            const total = r.material + r.process + r.labour + r.tool + r.overhead + r.other;
            return <span className="font-semibold tabular text-foreground">{inr(total)}</span>;
        },
    },
    {
        key: "sellingPrice",
        header: "Selling Price",
        align: "right",
        sortable: true,
        sortValue: (r) => r.sellingPrice,
        cell: (r) => <span className="font-semibold tabular text-primary">{inr(r.sellingPrice)}</span>,
    },
    {
        key: "margin",
        header: "Margin %",
        align: "right",
        sortable: true,
        sortValue: (r) => {
            const total = r.material + r.process + r.labour + r.tool + r.overhead + r.other;
            return ((r.sellingPrice - total) / r.sellingPrice) * 100;
        },
        cell: (r) => {
            const total = r.material + r.process + r.labour + r.tool + r.overhead + r.other;
            const margin = ((r.sellingPrice - total) / r.sellingPrice) * 100;
            return (
                <span className={`font-medium tabular ${margin < 15 ? "text-warning" : "text-success"}`}>
                    {margin.toFixed(1)}%
                </span>
            );
        },
    },
];

function ProductCostingPage() {
    const featured = productCosting[0]; // Pick one for the detail view

    const totalProducts = productCosting.length;

    let totalCostSum = 0;
    let totalMarginSum = 0;

    productCosting.forEach((p) => {
        const cost = p.material + p.process + p.labour + p.tool + p.overhead + p.other;
        totalCostSum += cost;
        const margin = ((p.sellingPrice - cost) / p.sellingPrice) * 100;
        totalMarginSum += margin;
    });

    const avgProductCost = totalProducts > 0 ? totalCostSum / totalProducts : 0;
    const avgMargin = totalProducts > 0 ? totalMarginSum / totalProducts : 0;

    const featuredTotalCost = featured.material + featured.process + featured.labour + featured.tool + featured.overhead + featured.other;
    const featuredMargin = ((featured.sellingPrice - featuredTotalCost) / featured.sellingPrice) * 100;

    return (
        <>
            <PageHeader
                title="Product Costing"
                description="Detailed cost breakdown, pricing, and margin analysis for manufactured products."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 gap-1.5">
                            <Download className="size-3.5" /> Export
                        </Button>
                        <Button size="sm" className="h-9 gap-1.5">
                            <Calculator className="size-3.5" /> New Costing
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Total Products" value={String(totalProducts)} hint="Costed items" />
                <StatTile label="Avg Product Cost" value={inr(avgProductCost)} hint="Across all products" tone="primary" />
                <StatTile label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} hint="Blended margin" tone={avgMargin > 20 ? "success" : "warning"} />
                <StatTile label="Low Margin Items" value={String(productCosting.filter(p => {
                    const cost = p.material + p.process + p.labour + p.tool + p.overhead + p.other;
                    return ((p.sellingPrice - cost) / p.sellingPrice) * 100 < 15;
                }).length)} hint="Below 15% margin" tone="danger" />
            </div>

            <DataTable
                columns={columns}
                rows={productCosting}
                rowKey={(r) => r.code}
                searchPlaceholder="Search product name or code..."
                searchKeys={(r) => `${r.code} ${r.product}`}
            />

            <SectionCard
                title={`Costing Profile · ${featured.code}`}
                description={featured.product}
            >
                <Tabs defaultValue="Breakdown" className="p-5">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="Breakdown" className="text-xs">Cost Breakdown</TabsTrigger>
                        <TabsTrigger value="Pricing" className="text-xs">Pricing & Margin</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Breakdown" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["Material Cost", inr(featured.material)],
                                ["Process Cost", inr(featured.process)],
                                ["Labour Cost", inr(featured.labour)],
                                ["Tooling Cost", inr(featured.tool)],
                                ["Overheads", inr(featured.overhead)],
                                ["Other Costs", inr(featured.other)],
                                ["Total Manufacturing Cost", inr(featuredTotalCost)],
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
                    <TabsContent value="Pricing" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["Total Cost", inr(featuredTotalCost)],
                                ["Selling Price", inr(featured.sellingPrice)],
                                ["Gross Profit", inr(featured.sellingPrice - featuredTotalCost)],
                                ["Margin %", `${featuredMargin.toFixed(2)}%`],
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
