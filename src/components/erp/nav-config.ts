import {
  Banknote,
  BookOpenCheck,
  Boxes,
  ClipboardList,
  Coins,
  Cpu,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers,
  ListChecks,
  PackageCheck,
  ScrollText,
  Tags,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: typeof Gauge;
  group: string;
};

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Dashboard",
    items: [{ label: "Dashboard", to: "/", icon: Gauge, group: "Dashboard" }],
  },
  {
    title: "Operations",
    items: [
      { label: "Task Management", to: "/tasks", icon: ListChecks, group: "Operations" },
      { label: "Party Entry", to: "/parties", icon: Users, group: "Operations" },
      { label: "Planned Workings", to: "/planned-workings", icon: ClipboardList, group: "Operations" },
      { label: "Sales Order", to: "/sales-orders", icon: FileText, group: "Operations" },
      { label: "Inward Entry", to: "/inward-entry", icon: Boxes, group: "Operations" },
      { label: "Process Entry", to: "/process-entry", icon: Cpu, group: "Operations" },
      { label: "Log Entry", to: "/log-entry", icon: ScrollText, group: "Operations" },
      { label: "Finished Goods", to: "/finished-goods", icon: PackageCheck, group: "Operations" },
      { label: "DC Entry", to: "/dc-entry", icon: Truck, group: "Operations" },
    ],
  },
  {
    title: "Costing & Commercial",
    items: [
      { label: "Process Costing", to: "/process-costing", icon: Layers, group: "Costing & Commercial" },
      { label: "Product Costing", to: "/product-costing", icon: Coins, group: "Costing & Commercial" },
      { label: "Price List", to: "/price-list", icon: Tags, group: "Costing & Commercial" },
      { label: "Invoices", to: "/invoices", icon: FileSpreadsheet, group: "Costing & Commercial" },
    ],
  },
  {
    title: "Accounts",
    items: [
      { label: "Bank Entry", to: "/bank-entry", icon: Banknote, group: "Accounts" },
      { label: "Ledger Statement", to: "/ledger", icon: BookOpenCheck, group: "Accounts" },
      { label: "Petty Cash Entry", to: "/petty-cash", icon: Wallet, group: "Accounts" },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Reports", to: "/reports", icon: FileSpreadsheet, group: "Insights" }],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

export function breadcrumbFor(pathname: string): string[] {
  const match = allNavItems
    .filter((i) => i.to !== "/")
    .find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  if (!match) return ["Dashboard"];
  const trail = ["Dashboard", match.group, match.label];
  if (pathname !== match.to) {
    trail.push(decodeURIComponent(pathname.split("/").filter(Boolean).slice(-1)[0] ?? ""));
  }
  return trail;
}
