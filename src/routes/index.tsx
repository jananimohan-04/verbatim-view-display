import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";

import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  activities,
  alerts,
  inr,
  num,
  productionStatus,
  workflowStages,
} from "@/data/erp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Manufacturing Dashboard | Engineering ERP" },
      {
        name: "description",
        content:
          "Live overview of CNC production: planned workings, sales orders, process status, dispatch readiness and cash position.",
      },
      { property: "og:title", content: "Manufacturing Dashboard | Engineering ERP" },
      {
        property: "og:description",
        content:
          "Track planning, production, dispatch and receivables across your CNC engineering plant in real time.",
      },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Active Planned Workings", value: "7", hint: "3 awaiting approval", icon: ClipboardList, trend: "+2 vs last week", up: true },
  { label: "Open Sales Orders", value: "5", hint: "₹62.2 L order book", icon: FileSpreadsheet, trend: "+1 this week", up: true },
  { label: "Materials in Inward", value: "1,550", hint: "1 lot under inspection", icon: Boxes, trend: "98.4% acceptance", up: true },
  { label: "Production In Progress", value: "2,900", hint: "Across 4 job cards", icon: Cpu, trend: "-6% throughput", up: false },
  { label: "Finished Goods Ready", value: "1,304", hint: "620 reserved for export", icon: PackageCheck, trend: "+420 today", up: true },
  { label: "Pending Dispatch", value: "1,000", hint: "2 DCs awaiting vehicle", icon: Truck, trend: "1 draft DC", up: false },
  { label: "Outstanding Receivables", value: inr(2437300, true), hint: "₹12.4 L overdue", icon: IndianRupee, trend: "-8% vs Aug", up: false },
  { label: "Cash & Bank Position", value: inr(4186420, true), hint: "Petty cash ₹38,420", icon: Banknote, trend: "+₹7.8 L today", up: true },
];

const financials = [
  { label: "Total Invoice Value", value: inr(3725534), tone: "neutral" as const },
  { label: "Amount Received", value: inr(1087674), tone: "success" as const },
  { label: "Outstanding Amount", value: inr(2437860), tone: "warning" as const },
  { label: "Bank Balance", value: inr(4148000), tone: "neutral" as const },
  { label: "Petty Cash Balance", value: inr(38420), tone: "neutral" as const },
];

const alertTone = {
  warning: "border-warning/25 bg-warning-soft text-warning",
  danger: "border-destructive/25 bg-destructive-soft text-destructive",
  info: "border-info/20 bg-info-soft text-info",
};

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Good Morning, Janani"
        description="Here is an overview of your manufacturing operations."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9">
              Shift A · 03 Sep 2026
            </Button>
            <Button size="sm" className="h-9" asChild>
              <Link to="/reports">
                View reports <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

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

      <SectionCard
        title="Production Workflow Overview"
        description="End-to-end record flow from party master to ledger. Select a stage to open the module."
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
                  value={(stage.done / stage.total) * 100}
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard
          title="Current Production Status"
          description="Live job progress against target delivery dates"
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
                {productionStatus.map((row, i) => (
                  <tr
                    key={row.order}
                    className={`border-b border-border/70 last:border-0 ${i % 2 === 1 ? "bg-surface/60" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to="/sales-orders/$orderId"
                        params={{ orderId: row.order }}
                        className="font-semibold tabular text-accent-foreground hover:underline"
                      >
                        {row.order}
                      </Link>
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
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Recent Activities" description="Latest events across modules">
          <ol className="relative px-5 py-4">
            <span className="absolute top-6 bottom-6 left-[26px] w-px bg-border" />
            {activities.map((a) => (
              <li key={a.title} className="relative flex gap-3 pb-4 last:pb-0">
                <span className="z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-card bg-primary" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">{a.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard title="Financial Summary" description="Consolidated position for FY 2026–27">
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {financials.map((f) => (
                <StatTile key={f.label} label={f.label} value={f.value} tone={f.tone} />
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Alerts & Attention Required" description="5 items need action today">
          <ul className="space-y-2 p-4">
            {alerts.map((a) => (
              <li key={a.text}>
                <Link
                  to={a.to}
                  className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-xs font-medium transition-opacity hover:opacity-85 ${alertTone[a.tone]}`}
                >
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{a.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
