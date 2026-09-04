import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Download, MoreHorizontal, Pencil } from "lucide-react";

import { SectionCard } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  dcEntries,
  finishedGoods,
  inr,
  inwardEntries,
  invoices,
  num,
  processEntries,
  plannedWorkings,
  salesOrderItems,
  salesOrders,
} from "@/data/erp";

export const Route = createFileRoute("/sales-orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Sales Order Detail | Engineering ERP" },
      {
        name: "description",
        content:
          "Complete sales order lifecycle: planned workings, inward, process tracking, finished goods, dispatch, invoices and activity.",
      },
      { property: "og:title", content: "Sales Order Detail | Engineering ERP" },
      {
        property: "og:description",
        content: "Full traceability for a single CNC manufacturing sales order.",
      },
    ],
  }),
  component: SalesOrderDetail,
});

const tabs = [
  "Overview",
  "Items",
  "Planned Workings",
  "Inward",
  "Process Tracking",
  "Finished Goods",
  "DC",
  "Invoices",
  "Activity",
];

function LinkedCard({
  label,
  value,
  to,
  hint,
}: {
  label: string;
  value: string;
  to: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="group erp-card flex items-center justify-between px-4 py-3 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
    >
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold tabular text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="size-4 text-border-strong group-hover:text-accent-foreground" />
    </Link>
  );
}

function SalesOrderDetail() {
  const { orderId } = useParams({ from: "/sales-orders/$orderId" });
  const order = salesOrders.find((o) => o.id === orderId) ?? salesOrders[0];
  const orderInvoices = invoices.filter((i) => i.party === order.party);
  const orderDcs = dcEntries.filter((d) => d.so === order.id);
  const orderProcesses = processEntries.filter((p) => p.so === order.id);
  const orderInward = inwardEntries.filter((i) => i.ref === order.id);
  const orderPlans = plannedWorkings.filter((p) => p.party === order.party);
  const orderFg = finishedGoods.filter((f) => f.so === order.id);
  const dispatched = orderDcs.reduce((s, d) => s + d.qty, 0);
  const invoiced = orderInvoices.reduce((s, i) => s + i.total, 0);
  const received = orderInvoices.reduce((s, i) => s + i.received, 0);
  const completed = orderFg.reduce((s, f) => s + f.completed, 0);

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <Link
          to="/sales-orders"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to Sales Orders
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tabular text-foreground">{order.id}</h1>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.integration} />
            </div>
            <p className="mt-1 text-sm text-foreground">{order.party}</p>
            <p className="text-xs text-muted-foreground">
              Created {order.date} · PO {order.po} · Quotation {order.quotationRef} ·{" "}
              {order.externalId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Download className="size-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Pencil className="size-3.5" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Create Planned Working</DropdownMenuItem>
                <DropdownMenuItem>Create Inward Entry</DropdownMenuItem>
                <DropdownMenuItem>Create Delivery Challan</DropdownMenuItem>
                <DropdownMenuItem>Generate Invoice</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Order Quantity", value: num(order.qty) },
          { label: "Completed", value: num(completed) },
          { label: "Dispatched", value: num(dispatched) },
          { label: "Pending", value: num(Math.max(order.qty - dispatched, 0)) },
          { label: "Invoice Value", value: inr(order.value, true) },
        ].map((k) => (
          <div key={k.label} className="erp-card px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {k.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LinkedCard
          label="Planned Workings"
          value={String(orderPlans.length)}
          hint="Open planning records"
          to="/planned-workings"
        />
        <LinkedCard
          label="Inward Entries"
          value={String(orderInward.length)}
          hint="Material received against order"
          to="/inward-entry"
        />
        <LinkedCard
          label="Processes"
          value={`${orderProcesses.filter((p) => p.status === "Completed").length}/${orderProcesses.length || 1}`}
          hint="Completed of routed operations"
          to="/process-entry"
        />
        <LinkedCard
          label="Outstanding"
          value={inr(invoiced - received, true)}
          hint={`Invoiced ${inr(invoiced, true)} · Received ${inr(received, true)}`}
          to="/invoices"
        />
      </div>

      <SectionCard title="Order Lifecycle" description="Every linked record for this sales order">
        <Tabs defaultValue="Overview" className="p-5">
          <TabsList className="flex-wrap">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Overview" className="mt-4 space-y-5">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Order Date", order.date],
                ["Delivery Date", order.delivery],
                ["Payment Terms", order.terms],
                ["Customer PO Number", order.po],
                ["External Quotation Reference", order.quotationRef],
                ["External System Reference ID", order.externalId],
                ["Integration Status", order.integration],
                ["Tax", order.tax === 0 ? "Export · 0%" : `${order.tax}% GST`],
                ["Order Value", inr(order.value)],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-border/70 pb-2">
                  <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-xs font-semibold text-foreground">Fulfilment progress</p>
              <Progress value={(dispatched / order.qty) * 100} className="mt-2 h-2" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {num(dispatched)} of {num(order.qty)} nos dispatched
              </p>
            </div>
          </TabsContent>

          <TabsContent value="Items" className="mt-4">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-3 py-2 text-left font-semibold">Sr</th>
                  <th className="px-3 py-2 text-left font-semibold">Item Code</th>
                  <th className="px-3 py-2 text-left font-semibold">Description</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-left font-semibold">UOM</th>
                  <th className="px-3 py-2 text-right font-semibold">Rate</th>
                  <th className="px-3 py-2 text-right font-semibold">Tax</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {salesOrderItems.map((it) => (
                  <tr key={it.sr} className="border-b border-border/70">
                    <td className="px-3 py-2 tabular">{it.sr}</td>
                    <td className="px-3 py-2 tabular font-medium">{it.code}</td>
                    <td className="px-3 py-2 text-muted-foreground">{it.description}</td>
                    <td className="px-3 py-2 text-right tabular">{num(it.qty)}</td>
                    <td className="px-3 py-2">{it.uom}</td>
                    <td className="px-3 py-2 text-right tabular">{inr(it.rate)}</td>
                    <td className="px-3 py-2 text-right tabular">{it.tax}%</td>
                    <td className="px-3 py-2 text-right font-semibold tabular">{inr(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface">
                  <td colSpan={7} className="px-3 py-2 text-right text-xs font-semibold">
                    Taxable value
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular">{inr(824400)}</td>
                </tr>
                <tr>
                  <td colSpan={7} className="px-3 py-2 text-right text-xs font-semibold">
                    GST @ 18%
                  </td>
                  <td className="px-3 py-2 text-right tabular">{inr(148392)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td colSpan={7} className="px-3 py-2.5 text-right text-sm font-semibold">
                    Order total
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-bold tabular">{inr(972792)}</td>
                </tr>
              </tfoot>
            </table>
          </TabsContent>

          <TabsContent value="Planned Workings" className="mt-4">
            <ul className="divide-y divide-border">
              {orderPlans.map((p) => (
                <li key={p.plan} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-semibold tabular text-accent-foreground">{p.plan}</span>{" "}
                    <span className="text-muted-foreground">· {p.product}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    {num(p.planned)} / {num(p.required)} nos
                    <StatusBadge status={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="Inward" className="mt-4">
            <ul className="divide-y divide-border">
              {orderInward.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-semibold tabular text-accent-foreground">{i.id}</span>{" "}
                    <span className="text-muted-foreground">
                      · {i.material} · Challan {i.challan}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    Accepted {num(i.accepted)} / {num(i.received)}
                    <StatusBadge status={i.status} />
                  </span>
                </li>
              ))}
              {orderInward.length === 0 ? (
                <li className="py-6 text-center text-xs text-muted-foreground">
                  No inward entries linked yet.
                </li>
              ) : null}
            </ul>
          </TabsContent>

          <TabsContent value="Process Tracking" className="mt-4">
            <ol className="relative space-y-4 pl-6">
              <span className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />
              {orderProcesses.map((p) => (
                <li key={p.id} className="relative">
                  <span
                    className={`absolute -left-6 top-1.5 size-3 rounded-full border-2 border-card ${
                      p.status === "Completed"
                        ? "bg-success"
                        : p.status === "Delayed"
                          ? "bg-destructive"
                          : p.status === "Pending"
                            ? "bg-warning"
                            : "bg-primary"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{p.process}</p>
                    <StatusBadge status={p.status} />
                    <span className="text-xs tabular text-muted-foreground">{p.id}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.machine} · {p.operator} · Good {num(p.good)} · Rejected {num(p.rejected)} ·
                    Rework {num(p.rework)}
                  </p>
                </li>
              ))}
              {orderProcesses.length === 0 ? (
                <li className="text-xs text-muted-foreground">No process routing recorded yet.</li>
              ) : null}
            </ol>
          </TabsContent>

          <TabsContent value="Finished Goods" className="mt-4">
            <ul className="divide-y divide-border">
              {orderFg.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-semibold tabular text-accent-foreground">{f.id}</span>{" "}
                    <span className="text-muted-foreground">
                      · {f.batch} · {f.location}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    Available {num(f.available)} · Reserved {num(f.reserved)}
                    <StatusBadge status={f.status} />
                  </span>
                </li>
              ))}
              {orderFg.length === 0 ? (
                <li className="py-6 text-center text-xs text-muted-foreground">
                  Nothing moved to finished goods yet.
                </li>
              ) : null}
            </ul>
          </TabsContent>

          <TabsContent value="DC" className="mt-4">
            <ul className="divide-y divide-border">
              {orderDcs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-semibold tabular text-accent-foreground">{d.id}</span>{" "}
                    <span className="text-muted-foreground">
                      · {d.transporter} · {d.vehicle}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    Dispatch {num(d.qty)} · Balance {num(d.balance)}
                    <StatusBadge status={d.status} />
                  </span>
                </li>
              ))}
              {orderDcs.length === 0 ? (
                <li className="py-6 text-center text-xs text-muted-foreground">
                  No delivery challans raised.
                </li>
              ) : null}
            </ul>
          </TabsContent>

          <TabsContent value="Invoices" className="mt-4">
            <ul className="divide-y divide-border">
              {orderInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-semibold tabular text-accent-foreground">{i.id}</span>{" "}
                    <span className="text-muted-foreground">· {i.dc} · Due {i.due}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    {inr(i.total)} · Outstanding {inr(i.outstanding)}
                    <StatusBadge status={i.status} />
                  </span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="Activity" className="mt-4">
            <ol className="space-y-3">
              {[
                ["Invoice generated", "M. Sridevi", "02 Sep 2026 · 14:05", "INV-2026-0718 for ₹4,53,120"],
                ["Delivery challan created", "Stores - N. Ravi", "02 Sep 2026 · 11:20", "DC-2026-0458 · 600 nos"],
                ["Process updated", "S. Prakash", "01 Sep 2026 · 15:40", "CNC Milling · 940 nos completed"],
                ["Order approved", "A. Ramesh", "05 Aug 2026 · 09:10", "Status changed Draft → In Progress"],
                ["Order created", "Janani Mohan", "04 Aug 2026 · 16:32", "Imported from quotation QTN-EXT-9921"],
              ].map(([action, who, when, detail]) => (
                <li key={when} className="flex gap-3 border-b border-border/70 pb-3 last:border-0">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {action} <span className="text-muted-foreground">by {who}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                    <p className="text-[11px] text-muted-foreground/80">{when}</p>
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </SectionCard>
    </>
  );
}
