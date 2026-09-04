import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Filter } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, StatTile } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { inr, ledgerRows } from "@/data/erp";

export const Route = createFileRoute("/ledger")({
    head: () => ({
        meta: [
            { title: "Ledger Statement | Engineering ERP" },
            {
                name: "description",
                content: "View detailed ledger statements for parties and accounts.",
            },
        ],
    }),
    component: LedgerPage,
});

type LedgerRow = (typeof ledgerRows)[number];

const columns: Column<LedgerRow>[] = [
    {
        key: "date",
        header: "Date",
        sortable: true,
        sortValue: (r) => r.date,
        cell: (r) => <span className="tabular text-muted-foreground">{r.date}</span>,
    },
    {
        key: "voucher",
        header: "Voucher No",
        cell: (r) => {
            let linkTo = "";
            if (r.voucher.startsWith("INV-")) linkTo = "/invoices";
            else if (r.voucher.startsWith("BNK-")) linkTo = "/bank-entry";
            else if (r.voucher.startsWith("SO-")) linkTo = `/sales-orders/${r.voucher}`;
            else if (r.voucher.startsWith("PC-")) linkTo = "/petty-cash";

            return linkTo ? (
                <Link to={linkTo} className="font-medium text-primary hover:underline">
                    {r.voucher}
                </Link>
            ) : (
                <span className="font-medium text-foreground">{r.voucher}</span>
            );
        },
    },
    {
        key: "ref",
        header: "Reference",
        cell: (r) => <span className="text-xs text-muted-foreground">{r.ref}</span>,
    },
    {
        key: "particulars",
        header: "Particulars",
        cell: (r) => <span className="text-foreground">{r.particulars}</span>,
    },
    {
        key: "debit",
        header: "Debit",
        align: "right",
        sortable: true,
        sortValue: (r) => r.debit,
        cell: (r) => (
            <span className="tabular text-foreground">
                {r.debit > 0 ? inr(r.debit) : "-"}
            </span>
        ),
    },
    {
        key: "credit",
        header: "Credit",
        align: "right",
        sortable: true,
        sortValue: (r) => r.credit,
        cell: (r) => (
            <span className="tabular text-foreground">
                {r.credit > 0 ? inr(r.credit) : "-"}
            </span>
        ),
    },
    {
        key: "balance",
        header: "Balance",
        align: "right",
        sortable: true,
        sortValue: (r) => r.balance,
        cell: (r) => <span className="font-semibold tabular text-accent-foreground">{inr(r.balance)}</span>,
    },
];

function LedgerPage() {
    let totalDebit = 0;
    let totalCredit = 0;

    ledgerRows.forEach((r) => {
        totalDebit += r.debit;
        totalCredit += r.credit;
    });

    const openingBalance = 486500; // Mock opening balance
    const closingBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].balance : openingBalance;

    return (
        <>
            <PageHeader
                title="Ledger Statement"
                description="View detailed ledger statements for parties and accounts."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 gap-1.5">
                            <Filter className="size-3.5" /> Filter
                        </Button>
                        <Button size="sm" className="h-9 gap-1.5">
                            <Download className="size-3.5" /> Export Statement
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Opening Balance" value={inr(openingBalance, true)} hint="As of start date" />
                <StatTile label="Total Debit" value={inr(totalDebit, true)} hint="Total debits in period" tone="warning" />
                <StatTile label="Total Credit" value={inr(totalCredit, true)} hint="Total credits in period" tone="success" />
                <StatTile label="Closing Balance" value={inr(closingBalance, true)} hint="As of end date" tone="primary" />
            </div>

            <DataTable
                columns={columns}
                rows={ledgerRows}
                rowKey={(r) => `${r.date}-${r.voucher}`}
                searchPlaceholder="Search voucher, reference, or particulars..."
                searchKeys={(r) => `${r.voucher} ${r.ref} ${r.particulars}`}
            />
        </>
    );
}
