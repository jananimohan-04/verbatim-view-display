import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { inr, pettyCash } from "@/data/erp";

export const Route = createFileRoute("/petty-cash")({
    head: () => ({
        meta: [
            { title: "Petty Cash | Engineering ERP" },
            {
                name: "description",
                content: "Manage day-to-day petty cash expenses and reimbursements.",
            },
        ],
    }),
    component: PettyCashPage,
});

type PettyCash = (typeof pettyCash)[number];

const columns: Column<PettyCash>[] = [
    {
        key: "id",
        header: "Voucher No",
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
        key: "category",
        header: "Category",
        cell: (r) => <span className="font-medium text-foreground">{r.category}</span>,
    },
    {
        key: "description",
        header: "Description",
        cell: (r) => (
            <div>
                <p className="text-foreground">{r.description}</p>
                <p className="text-xs text-muted-foreground">Paid to: {r.paidTo} · Ref: {r.ref}</p>
            </div>
        ),
    },
    {
        key: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        sortValue: (r) => r.amount,
        cell: (r) => <span className="font-semibold tabular text-warning">{inr(r.amount)}</span>,
    },
    {
        key: "enteredBy",
        header: "Entered By",
        cell: (r) => <span className="text-sm text-muted-foreground">{r.enteredBy}</span>,
    },
    {
        key: "approvedBy",
        header: "Approved By",
        cell: (r) => (
            <span className={`text-sm ${r.approvedBy === "Pending" ? "text-warning" : "text-success"}`}>
                {r.approvedBy}
            </span>
        ),
    },
];

function PettyCashPage() {
    const openingCash = 25000;
    const cashReceived = 10000;

    let cashSpent = 0;
    pettyCash.forEach((p) => {
        cashSpent += p.amount;
    });

    const closingCash = openingCash + cashReceived - cashSpent;

    return (
        <>
            <PageHeader
                title="Petty Cash"
                description="Manage day-to-day petty cash expenses and reimbursements."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Plus className="size-3.5" /> Add Expense
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Opening Cash" value={inr(openingCash, true)} hint="Start of period" />
                <StatTile label="Cash Received" value={inr(cashReceived, true)} hint="Replenishments" tone="success" />
                <StatTile label="Cash Spent" value={inr(cashSpent, true)} hint="Total expenses" tone="warning" />
                <StatTile label="Closing Cash" value={inr(closingCash, true)} hint="Current balance" tone="primary" />
            </div>

            <DataTable
                columns={columns}
                rows={pettyCash}
                rowKey={(r) => r.id}
                searchPlaceholder="Search voucher, category, or description..."
                searchKeys={(r) => `${r.id} ${r.category} ${r.description} ${r.paidTo}`}
            />
        </>
    );
}
