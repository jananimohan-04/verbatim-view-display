import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bankEntries, inr } from "@/data/erp";

export const Route = createFileRoute("/bank-entry")({
    head: () => ({
        meta: [
            { title: "Bank Entry | Engineering ERP" },
            {
                name: "description",
                content: "Record and reconcile bank receipts, payments, and contra entries.",
            },
        ],
    }),
    component: BankEntryPage,
});

type BankEntry = (typeof bankEntries)[number];

const columns: Column<BankEntry>[] = [
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
        key: "account",
        header: "Bank Account",
        cell: (r) => <span className="text-foreground">{r.account}</span>,
    },
    {
        key: "party",
        header: "Party / Ledger",
        cell: (r) => (
            <div>
                <Link to="/parties" className="font-medium text-foreground hover:underline">
                    {r.party}
                </Link>
                <p className="text-xs text-muted-foreground">{r.type}</p>
            </div>
        ),
    },
    {
        key: "ref",
        header: "Reference",
        cell: (r) => (
            r.ref.startsWith("INV-") ? (
                <Link to="/invoices" className="text-primary hover:underline">
                    {r.ref}
                </Link>
            ) : (
                <span className="text-muted-foreground">{r.ref}</span>
            )
        ),
    },
    {
        key: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        sortValue: (r) => r.amount,
        cell: (r) => (
            <span className={`font-semibold tabular ${r.direction === "Credit" ? "text-success" : "text-foreground"}`}>
                {inr(r.amount)} {r.direction === "Credit" ? "Cr" : "Dr"}
            </span>
        ),
    },
    {
        key: "mode",
        header: "Mode & UTR",
        cell: (r) => (
            <div>
                <p className="text-sm text-foreground">{r.mode}</p>
                <p className="text-xs text-muted-foreground">{r.utr}</p>
            </div>
        ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function BankEntryPage() {
    const featured = bankEntries[0]; // Pick one for the detail view

    let totalReceipts = 0;
    let totalPayments = 0;

    bankEntries.forEach((b) => {
        if (b.direction === "Credit") {
            totalReceipts += b.amount;
        } else {
            totalPayments += b.amount;
        }
    });

    const currentPosition = totalReceipts - totalPayments; // Simplified for demo

    return (
        <>
            <PageHeader
                title="Bank Entry"
                description="Record and reconcile bank receipts, payments, and contra entries."
                actions={
                    <Button size="sm" className="h-9 gap-1.5">
                        <Plus className="size-3.5" /> Add Bank Entry
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <StatTile label="Total Receipts" value={inr(totalReceipts, true)} hint="Credits recorded" tone="success" />
                <StatTile label="Total Payments" value={inr(totalPayments, true)} hint="Debits recorded" tone="warning" />
                <StatTile label="Net Position" value={inr(currentPosition, true)} hint="Receipts - Payments" tone="primary" />
            </div>

            <DataTable
                columns={columns}
                rows={bankEntries}
                rowKey={(r) => r.id}
                searchPlaceholder="Search voucher, party, ref, or UTR..."
                searchKeys={(r) => `${r.id} ${r.party} ${r.ref} ${r.utr} ${r.account}`}
                statusOptions={["Reconciled", "Unreconciled"]}
                statusOf={(r) => r.status}
            />

            <SectionCard
                title={`Voucher Profile · ${featured.id}`}
                description={`${featured.party} · ${featured.date}`}
            >
                <Tabs defaultValue="Overview" className="p-5">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="Overview" className="text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="Reconciliation" className="text-xs">Reconciliation</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Overview" className="mt-4">
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["Voucher Date", featured.date],
                                ["Bank Account", featured.account],
                                ["Transaction Type", featured.type],
                                ["Party / Ledger", featured.party],
                                ["Reference", featured.ref],
                                ["Amount", `${inr(featured.amount)} ${featured.direction === "Credit" ? "Cr" : "Dr"}`],
                                ["Mode", featured.mode],
                                ["UTR / Cheque No", featured.utr],
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
                    <TabsContent value="Reconciliation" className="mt-4">
                        <p className="rounded-md border border-dashed border-border bg-surface px-4 py-10 text-center text-xs text-muted-foreground">
                            Reconciliation details and bank statement matching will appear here.
                        </p>
                    </TabsContent>
                </Tabs>
            </SectionCard>
        </>
    );
}
