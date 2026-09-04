import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, StatTile } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { inr, num, processCosting } from "@/data/erp";

export const Route = createFileRoute("/process-costing")({
    head: () => ({
        meta: [
            { title: "Process Costing | Engineering ERP" },
            {
                name: "description",
                content: "Analyze and track costs across various manufacturing processes.",
            },
        ],
    }),
    component: ProcessCostingPage,
});

type ProcessCost = (typeof processCosting)[number];

const columns: Column<ProcessCost>[] = [
    {
        key: "process",
        header: "Process Name",
        sortable: true,
        sortValue: (r) => r.process,
        cell: (r) => <span className="font-semibold text-foreground">{r.process}</span>,
    },
    {
        key: "units",
        header: "Units Processed",
        align: "right",
        sortable: true,
        sortValue: (r) => r.units,
        cell: (r) => <span className="tabular text-muted-foreground">{num(r.units)}</span>,
    },
    {
        key: "machine",
        header: "Machine Cost",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.machine)}</span>,
    },
    {
        key: "labour",
        header: "Labour Cost",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.labour)}</span>,
    },
    {
        key: "setup",
        header: "Setup Cost",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.setup)}</span>,
    },
    {
        key: "tool",
        header: "Tool Cost",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.tool)}</span>,
    },
    {
        key: "overhead",
        header: "Overheads",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.overhead)}</span>,
    },
    {
        key: "outsourcing",
        header: "Outsourcing",
        align: "right",
        cell: (r) => <span className="tabular">{inr(r.outsourcing)}</span>,
    },
    {
        key: "total",
        header: "Total Cost",
        align: "right",
        sortable: true,
        sortValue: (r) => r.machine + r.labour + r.setup + r.tool + r.overhead + r.outsourcing + r.other,
        cell: (r) => {
            const total = r.machine + r.labour + r.setup + r.tool + r.overhead + r.outsourcing + r.other;
            return <span className="font-semibold tabular text-accent-foreground">{inr(total)}</span>;
        },
    },
    {
        key: "costPerUnit",
        header: "Cost / Unit",
        align: "right",
        sortable: true,
        sortValue: (r) => (r.machine + r.labour + r.setup + r.tool + r.overhead + r.outsourcing + r.other) / (r.units || 1),
        cell: (r) => {
            const total = r.machine + r.labour + r.setup + r.tool + r.overhead + r.outsourcing + r.other;
            const cpu = total / (r.units || 1);
            return <span className="font-medium tabular text-primary">{inr(cpu)}</span>;
        },
    },
];

function ProcessCostingPage() {
    const totalProcesses = processCosting.length;

    let totalCost = 0;
    let totalUnits = 0;
    let highestCostProcess = { name: "-", cost: 0 };

    processCosting.forEach((p) => {
        const cost = p.machine + p.labour + p.setup + p.tool + p.overhead + p.outsourcing + p.other;
        totalCost += cost;
        totalUnits += p.units;
        if (cost > highestCostProcess.cost) {
            highestCostProcess = { name: p.process, cost };
        }
    });

    const avgCostPerUnit = totalUnits > 0 ? totalCost / totalUnits : 0;

    return (
        <>
            <PageHeader
                title="Process Costing"
                description="Analyze direct and indirect costs across all manufacturing processes."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Calculator className="size-3.5" /> Recalculate Costs
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Total Processes" value={String(totalProcesses)} hint="Active cost centers" />
                <StatTile label="Total Process Cost" value={inr(totalCost, true)} hint="Across all processes" tone="primary" />
                <StatTile label="Avg Cost / Unit" value={inr(avgCostPerUnit)} hint="Blended average" tone="success" />
                <StatTile label="Highest Cost Process" value={highestCostProcess.name} hint={inr(highestCostProcess.cost, true)} tone="warning" />
            </div>

            <DataTable
                columns={columns}
                rows={processCosting}
                rowKey={(r) => r.process}
                searchPlaceholder="Search process name..."
                searchKeys={(r) => r.process}
            />
        </>
    );
}
