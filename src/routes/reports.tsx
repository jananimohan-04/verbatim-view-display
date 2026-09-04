import { createFileRoute } from "@tanstack/react-router";
import {
    BarChart3,
    Calculator,
    ChevronRight,
    FileSpreadsheet,
    LineChart,
    PackageCheck,
    PieChart,
    TrendingUp,
    Wallet,
} from "lucide-react";

import { PageHeader, SectionCard } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports")({
    head: () => ({
        meta: [
            { title: "Reports & Insights | Engineering ERP" },
            {
                name: "description",
                content: "Comprehensive reporting across operations, costing, and financials.",
            },
        ],
    }),
    component: ReportsPage,
});

function ReportCard({
    title,
    description,
    icon: Icon,
    metric,
    metricLabel,
}: {
    title: string;
    description: string;
    icon: any;
    metric: string;
    metricLabel: string;
}) {
    return (
        <div className="erp-card group flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]">
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="mt-6 flex items-end justify-between border-t border-border/70 pt-4">
                <div>
                    <p className="text-xl font-bold tabular text-foreground">{metric}</p>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {metricLabel}
                    </p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary">
                    View Report <ChevronRight className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

function ReportsPage() {
    return (
        <>
            <PageHeader
                title="Reports & Insights"
                description="Comprehensive reporting across operations, costing, and financials."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Download className="size-3.5" /> Export All Data
                    </Button>
                }
            />

            <SectionCard title="Operations Reports" description="Production, inventory, and fulfillment metrics">
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <ReportCard
                        title="Production Yield"
                        description="Analysis of good vs rejected parts across all CNC processes."
                        icon={BarChart3}
                        metric="98.4%"
                        metricLabel="Avg Yield Rate"
                    />
                    <ReportCard
                        title="Inventory Valuation"
                        description="Current value of raw materials, WIP, and finished goods."
                        icon={PackageCheck}
                        metric="₹42.5 L"
                        metricLabel="Total Stock Value"
                    />
                    <ReportCard
                        title="Dispatch Fulfillment"
                        description="Delivery challan tracking against sales order commitments."
                        icon={TrendingUp}
                        metric="92%"
                        metricLabel="On-Time Delivery"
                    />
                </div>
            </SectionCard>

            <SectionCard title="Costing Reports" description="Process efficiency and product margin analysis">
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <ReportCard
                        title="Process Cost Variance"
                        description="Standard vs actual cost comparison for machine and labour."
                        icon={Calculator}
                        metric="+4.2%"
                        metricLabel="Cost Variance"
                    />
                    <ReportCard
                        title="Product Margin Analysis"
                        description="Profitability breakdown by product code and customer."
                        icon={PieChart}
                        metric="22.8%"
                        metricLabel="Blended Margin"
                    />
                    <ReportCard
                        title="Machine Utilization"
                        description="OEE metrics and cost recovery per machine center."
                        icon={LineChart}
                        metric="76%"
                        metricLabel="Avg Utilization"
                    />
                </div>
            </SectionCard>

            <SectionCard title="Financial Reports" description="Receivables, payables, and cash flow">
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    <ReportCard
                        title="Accounts Receivable"
                        description="Aging analysis of outstanding customer invoices."
                        icon={FileSpreadsheet}
                        metric="₹19.4 L"
                        metricLabel="Total Outstanding"
                    />
                    <ReportCard
                        title="Cash Flow Statement"
                        description="Inflow and outflow analysis across all bank accounts."
                        icon={Wallet}
                        metric="₹6.4 L"
                        metricLabel="Net Cash Flow"
                    />
                    <ReportCard
                        title="Expense Summary"
                        description="Categorized breakdown of petty cash and overhead expenses."
                        icon={PieChart}
                        metric="₹1.2 L"
                        metricLabel="Monthly Expenses"
                    />
                </div>
            </SectionCard>
        </>
    );
}

// Add Download icon import since it's used in the header
import { Download } from "lucide-react";
