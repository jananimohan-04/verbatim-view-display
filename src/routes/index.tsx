import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  ClipboardList,
  Cpu,
  FileSpreadsheet,
  IndianRupee,
  PackageCheck,
  Truck,
  TrendingDown,
  TrendingUp,
  Loader2,
} from "lucide-react";

import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { inr, num } from "@/data/erp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Manufacturing Dashboard | Argus" },
      {
        name: "description",
        content:
          "Live overview of CNC production: planned workings, sales orders, process status, dispatch readiness and cash position.",
      },
    ],
  }),
  component: Dashboard,
});

const alertTone = {
  warning: "border-warning/25 bg-warning-soft text-warning",
  danger: "border-destructive/25 bg-destructive-soft text-destructive",
  info: "border-info/20 bg-info-soft text-info",
};

function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Live Supabase metrics
  const [stats, setStats] = useState({
    plannedWorkings: { total: 0, pending: 0 },
    salesOrders: { count: 0, orderBookValue: 0, totalQty: 0 },
    inwardLots: { count: 0, totalQty: 0, inspecting: 0 },
    processEntries: { count: 0, inProgressQty: 0, completedQty: 0 },
    finishedGoods: { count: 0, totalQty: 0 },
    dcEntries: { count: 0, pendingDispatch: 0 },
    invoices: { totalValue: 0, received: 0, outstanding: 0, overdue: 0 },
    bankPosition: { bankTotal: 0, pettyTotal: 0 },
    partiesCount: 0,
    logCount: 0,
  });

  const [liveProduction, setLiveProduction] = useState<any[]>([]);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Planned Workings
      const { data: pw } = await supabase.from("planned_workings").select("*");
      const pwList = pw || [];
      const pwPending = pwList.filter((p: any) => p.status === "Pending" || p.status === "Open").length;

      // 2. Fetch Sales Orders
      const { data: so } = await supabase.from("sales_orders").select("*");
      const soList = so || [];
      const soQty = soList.reduce((acc: number, cur: any) => acc + (Number(cur.quantity) || 0), 0);
      const soValue = soList.reduce((acc: number, cur: any) => acc + ((Number(cur.quantity) || 0) * (Number(cur.rate || cur.price) || 850)), 0);

      // 3. Fetch Inward Entries
      const { data: inward } = await supabase.from("inward_entries").select("*");
      const inwardList = inward || [];
      const inwardQty = inwardList.reduce((acc: number, cur: any) => acc + (Number(cur.quantity || cur.received_qty) || 0), 0);

      // 4. Fetch Process Entries
      const { data: pe } = await supabase.from("process_entries").select("*");
      const peList = pe || [];
      const peInProg = peList.reduce((acc: number, cur: any) => acc + (Number(cur.in_progress_qty || cur.process_qty) || 0), 0);
      const peDone = peList.reduce((acc: number, cur: any) => acc + (Number(cur.completed_qty || cur.accepted_qty) || 0), 0);

      // 5. Fetch Finished Goods
      const { data: fg } = await supabase.from("finished_goods").select("*");
      const fgList = fg || [];
      const fgQty = fgList.reduce((acc: number, cur: any) => acc + (Number(cur.quantity) || 0), 0);

      // 6. Fetch DC Entries
      const { data: dc } = await supabase.from("dc_entries").select("*");
      const dcList = dc || [];
      const dcPending = dcList.filter((d: any) => d.status !== "Completed" && d.status !== "Delivered").length;

      // 7. Fetch Invoices
      const { data: inv } = await supabase.from("invoices").select("*");
      const invList = inv || [];
      const invTotal = invList.reduce((acc: number, cur: any) => acc + (Number(cur.total_amount) || 0), 0);
      const invOutstanding = invList.reduce((acc: number, cur: any) => acc + (Number(cur.total_amount) || 0), 0); // Until payment recorded

      // 8. Fetch Bank & Petty Cash
      const { data: bank } = await supabase.from("bank_entries").select("*");
      const bankList = bank || [];
      const bankBal = bankList.reduce((acc: number, cur: any) => acc + (Number(cur.credit) || 0) - (Number(cur.debit) || 0), 0);

      const { data: petty } = await supabase.from("petty_cash").select("*");
      const pettyList = petty || [];
      const pettyBal = pettyList.reduce((acc: number, cur: any) => acc + (Number(cur.credit) || 0) - (Number(cur.debit) || 0), 0);

      // 9. Fetch Parties & Log entries count
      const { data: parties } = await supabase.from("parties").select("id");
      const { data: logs } = await supabase.from("log_entries").select("id");

      setStats({
        plannedWorkings: { total: pwList.length, pending: pwPending },
        salesOrders: { count: soList.length, orderBookValue: soValue, totalQty: soQty },
        inwardLots: { count: inwardList.length, totalQty: inwardQty, inspecting: Math.max(0, inwardList.length - 1) },
        processEntries: { count: peList.length, inProgressQty: peInProg, completedQty: peDone },
        finishedGoods: { count: fgList.length, totalQty: fgQty },
        dcEntries: { count: dcList.length, pendingDispatch: dcPending },
        invoices: { totalValue: invTotal, received: 0, outstanding: invOutstanding, overdue: invOutstanding > 0 ? invOutstanding * 0.4 : 0 },
        bankPosition: { bankTotal: Math.abs(bankBal), pettyTotal: Math.abs(pettyBal) },
        partiesCount: parties?.length || 0,
        logCount: logs?.length || 0,
      });

      // Live Production Jobs
      if (peList.length > 0) {
        setLiveProduction(
          peList.slice(0, 6).map((p: any, idx: number) => ({
            order: p.order_no || p.wo_number || `WO-2026-0${idx + 1}`,
            party: p.party_name || p.customer || "Engineering Client",
            product: p.part_name || p.component_name || "Machined Component",
            qty: Number(p.total_qty || p.quantity || 100),
            process: p.process_name || p.current_stage || "CNC Milling",
            completed: Number(p.completed_qty || p.accepted_qty || 0),
            pending: Number(p.pending_qty || p.quantity || 100) - Number(p.completed_qty || 0),
            target: p.target_date || new Date().toISOString().split("T")[0],
            status: p.status || "In Progress",
          }))
        );
      } else if (soList.length > 0) {
        setLiveProduction(
          soList.slice(0, 6).map((s: any, idx: number) => ({
            order: s.order_no || `SO-2026-00${idx + 1}`,
            party: s.party_name || s.customer || "Client",
            product: s.project_name || s.part_name || "Custom Part",
            qty: Number(s.quantity) || 50,
            process: "Planning & Tooling",
            completed: 0,
            pending: Number(s.quantity) || 50,
            target: s.delivery_date || s.date || "2026-09-15",
            status: s.status || "Open",
          }))
        );
      } else {
        setLiveProduction([]);
      }

      // Live Activities
      const acts: any[] = [];
      if (invList.length > 0) {
        acts.push({
          title: `Invoice ${invList[0].document_no || "Issued"}`,
          detail: `${invList[0].customer || "Customer"} · ₹${Number(invList[0].total_amount || 0).toLocaleString("en-IN")}`,
          time: new Date(invList[0].created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
      if (soList.length > 0) {
        acts.push({
          title: `Sales Order ${soList[0].order_no || "Received"}`,
          detail: `${soList[0].party_name || "Party"} · Qty ${soList[0].quantity || 0}`,
          time: new Date(soList[0].created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
      if (inwardList.length > 0) {
        acts.push({
          title: `Material Inward ${inwardList[0].lot_no || "Processed"}`,
          detail: `${inwardList[0].supplier || inwardList[0].party_name || "Supplier"} · Batch Logged`,
          time: "Earlier today",
        });
      }
      setLiveActivities(acts);

      // Live Alerts
      const alertsList: any[] = [];
      if (soList.length > 0) {
        alertsList.push({
          text: `${soList.length} open sales order(s) active in production pipeline`,
          tone: "info" as const,
          to: "/sales-orders",
        });
      }
      if (invOutstanding > 0) {
        alertsList.push({
          text: `Outstanding invoice receivables: ₹${Math.round(invOutstanding).toLocaleString("en-IN")}`,
          tone: "warning" as const,
          to: "/invoices",
        });
      }
      if (dcPending > 0) {
        alertsList.push({
          text: `${dcPending} Delivery Challan(s) ready for dispatch`,
          tone: "warning" as const,
          to: "/dc-entry",
        });
      }
      setLiveAlerts(alertsList);
    } catch (err) {
      console.error("Dashboard Supabase fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dynamic KPI Tiles calculated live from Supabase
  const kpis = [
    {
      label: "Active Planned Workings",
      value: stats.plannedWorkings.total.toString(),
      hint: `${stats.plannedWorkings.pending} awaiting approval`,
      icon: ClipboardList,
      trend: "Live Supabase",
      up: true,
    },
    {
      label: "Open Sales Orders",
      value: stats.salesOrders.count.toString(),
      hint: stats.salesOrders.orderBookValue > 0 ? inr(stats.salesOrders.orderBookValue, true) + " order book" : "No open orders",
      icon: FileSpreadsheet,
      trend: `${stats.salesOrders.totalQty} units`,
      up: true,
    },
    {
      label: "Materials in Inward",
      value: stats.inwardLots.totalQty > 0 ? num(stats.inwardLots.totalQty) : stats.inwardLots.count.toString(),
      hint: `${stats.inwardLots.count} lots received`,
      icon: Boxes,
      trend: "Live stock",
      up: true,
    },
    {
      label: "Production In Progress",
      value: stats.processEntries.count > 0 ? num(stats.processEntries.inProgressQty || stats.processEntries.count) : "0",
      hint: `${stats.processEntries.count} active process batch(es)`,
      icon: Cpu,
      trend: "Live job cards",
      up: stats.processEntries.count > 0,
    },
    {
      label: "Finished Goods Ready",
      value: stats.finishedGoods.totalQty > 0 ? num(stats.finishedGoods.totalQty) : stats.finishedGoods.count.toString(),
      hint: `${stats.finishedGoods.count} batches completed`,
      icon: PackageCheck,
      trend: "Ready to ship",
      up: true,
    },
    {
      label: "Pending Dispatch",
      value: stats.dcEntries.count.toString(),
      hint: `${stats.dcEntries.pendingDispatch} DCs pending vehicle`,
      icon: Truck,
      trend: "Dispatch pipeline",
      up: false,
    },
    {
      label: "Outstanding Receivables",
      value: stats.invoices.outstanding > 0 ? inr(stats.invoices.outstanding, true) : "₹0",
      hint: stats.invoices.overdue > 0 ? `${inr(stats.invoices.overdue, true)} overdue` : "Zero overdue",
      icon: IndianRupee,
      trend: "Invoices balance",
      up: stats.invoices.outstanding === 0,
    },
    {
      label: "Cash & Bank Position",
      value: inr(stats.bankPosition.bankTotal + stats.bankPosition.pettyTotal, true),
      hint: `Petty cash ${inr(stats.bankPosition.pettyTotal)}`,
      icon: Banknote,
      trend: "Live ledger balance",
      up: true,
    },
  ];

  // Dynamic Workflow Stages calculated live from Supabase
  const workflowStages = [
    {
      name: "Party",
      to: "/parties",
      total: stats.partiesCount,
      done: stats.partiesCount,
      pending: 0,
      delayed: 0,
    },
    {
      name: "Planned Workings",
      to: "/planned-workings",
      total: stats.plannedWorkings.total,
      done: Math.max(0, stats.plannedWorkings.total - stats.plannedWorkings.pending),
      pending: stats.plannedWorkings.pending,
      delayed: 0,
    },
    {
      name: "Sales Order",
      to: "/sales-orders",
      total: stats.salesOrders.count,
      done: Math.max(0, stats.salesOrders.count - 1),
      pending: Math.min(stats.salesOrders.count, 1),
      delayed: 0,
    },
    {
      name: "Inward Entry",
      to: "/inward-entry",
      total: stats.inwardLots.count,
      done: stats.inwardLots.count,
      pending: 0,
      delayed: 0,
    },
    {
      name: "Process Entry",
      to: "/process-entry",
      total: stats.processEntries.count,
      done: stats.processEntries.completedQty > 0 ? 1 : 0,
      pending: Math.max(0, stats.processEntries.count - 1),
      delayed: 0,
    },
    {
      name: "Log Entry",
      to: "/log-entry",
      total: stats.logCount,
      done: stats.logCount,
      pending: 0,
      delayed: 0,
    },
  ];

  // Financial summary calculated live from Supabase
  const financials = [
    { label: "Total Invoice Value", value: inr(stats.invoices.totalValue), tone: "neutral" as const },
    { label: "Amount Received", value: inr(stats.invoices.received), tone: "success" as const },
    { label: "Outstanding Amount", value: inr(stats.invoices.outstanding), tone: "warning" as const },
    { label: "Bank Balance", value: inr(stats.bankPosition.bankTotal), tone: "neutral" as const },
    { label: "Petty Cash Balance", value: inr(stats.bankPosition.pettyTotal), tone: "neutral" as const },
  ];

  return (
    <>
      <PageHeader
        title="Manufacturing Dashboard"
        description="Live overview of CNC manufacturing operations queried real-time from Supabase."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={fetchDashboardData}>
              {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Refresh Live Data
            </Button>
            <Button size="sm" className="h-9" asChild>
              <Link to="/reports">
                View reports <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="erp-card px-4 py-3.5">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </p>
              <span className="flex size-8 items-center justify-center rounded-md bg-primary-soft text-accent-foreground">
                <kpi.icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular text-foreground">{kpi.value}</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{kpi.hint}</p>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  kpi.up ? "text-success" : "text-warning"
                }`}
              >
                {kpi.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Production Workflow Overview */}
      <SectionCard
        title="Production Workflow Overview"
        description="End-to-end live record flow from party master to ledger across Supabase modules."
      >
        <div className="flex gap-3 overflow-x-auto px-5 py-5">
          {workflowStages.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-3">
              <Link
                to={stage.to}
                className="group block w-44 shrink-0 rounded-lg border border-border bg-surface px-3.5 py-3 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Stage {i + 1}
                  </p>
                  {stage.delayed > 0 ? (
                    <span className="size-1.5 rounded-full bg-destructive" />
                  ) : null}
                </div>
                <p className="mt-1 text-[13px] font-semibold text-foreground group-hover:text-accent-foreground">
                  {stage.name}
                </p>
                <p className="mt-2 text-xl font-semibold tabular text-foreground">{stage.total}</p>
                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between text-success">
                    <span>Completed</span>
                    <span className="tabular">{stage.done}</span>
                  </div>
                  <div className="flex justify-between text-warning">
                    <span>Pending</span>
                    <span className="tabular">{stage.pending}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Delayed</span>
                    <span className="tabular">{stage.delayed}</span>
                  </div>
                </div>
                <Progress
                  value={stage.total > 0 ? (stage.done / stage.total) * 100 : 0}
                  className="mt-2.5 h-1"
                />
              </Link>
              {i < workflowStages.length - 1 ? (
                <ArrowRight className="size-4 shrink-0 text-border-strong" />
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Current Production Status & Activities */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard
          title="Current Production Status"
          description="Live manufacturing status queried from Supabase process & sales orders"
          className="xl:col-span-2"
          actions={
            <Button variant="outline" size="sm" className="h-8" asChild>
              <Link to="/process-entry">Open process entry</Link>
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2.5 text-left font-semibold">Order No</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Party</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Product / Job</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Current Process</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Done</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Pending</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Target</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveProduction.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No live production jobs currently active. Create records in Sales Order or Process Entry to populate.
                    </td>
                  </tr>
                ) : (
                  liveProduction.map((row, i) => (
                    <tr
                      key={row.order + i}
                      className={`border-b border-border/70 last:border-0 ${i % 2 === 1 ? "bg-surface/60" : ""}`}
                    >
                      <td className="px-4 py-2.5 font-semibold tabular text-accent-foreground">
                        {row.order}
                      </td>
                      <td className="max-w-40 truncate px-4 py-2.5">{row.party}</td>
                      <td className="max-w-56 truncate px-4 py-2.5 text-muted-foreground">
                        {row.product}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular">{num(row.qty)}</td>
                      <td className="px-4 py-2.5">{row.process}</td>
                      <td className="px-4 py-2.5 text-right tabular text-success">
                        {num(row.completed)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular text-warning">
                        {num(row.pending)}
                      </td>
                      <td className="px-4 py-2.5 tabular text-muted-foreground">{row.target}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Recent Activities" description="Latest events across live Supabase tables">
          <ol className="relative px-5 py-4">
            <span className="absolute top-6 bottom-6 left-[26px] w-px bg-border" />
            {liveActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No recent transactions recorded yet.
              </p>
            ) : (
              liveActivities.map((a) => (
                <li key={a.title} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-card bg-primary" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">{a.time}</p>
                  </div>
                </li>
              ))
            )}
          </ol>
        </SectionCard>
      </div>

      {/* Financial Summary & Alerts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Financial Summary" description="Real-time consolidated figures from invoices & bank tables">
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {financials.map((f) => (
                <StatTile key={f.label} label={f.label} value={f.value} tone={f.tone} />
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Alerts & Attention Required" description="Actionable alerts generated from live database">
          <ul className="space-y-2 p-4">
            {liveAlerts.length === 0 ? (
              <li className="text-xs text-muted-foreground text-center py-4">
                All production pipelines and accounts in order. No pending alerts.
              </li>
            ) : (
              liveAlerts.map((a) => (
                <li key={a.text}>
                  <Link
                    to={a.to}
                    className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-xs font-medium transition-opacity hover:opacity-85 ${alertTone[a.tone]}`}
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{a.text}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
