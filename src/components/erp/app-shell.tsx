import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Boxes,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Cpu,
  FileSpreadsheet,
  FileText,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { breadcrumbFor, navGroups } from "./nav-config";

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-xs overflow-hidden border border-border/50">
          <img src="/argus-logo.png" alt="Argus" className="size-full object-contain" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-sidebar-foreground">
              Argus
            </p>
            <p className="truncate text-[11px] font-medium text-sidebar-muted">
              Manufacturing Management
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed ? (
              <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-sidebar-muted uppercase">
                {group.title}
              </p>
            ) : (
              <div className="mx-3 mb-2 border-t border-sidebar-border" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      {active ? (
                        <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-r bg-sidebar-primary" />
                      ) : null}
                      <item.icon className="size-4 shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[11px] font-semibold text-sidebar-foreground">Argus Technologies</p>
          <p className="mt-0.5 text-[10px] text-sidebar-muted">Manufacturing ERP</p>
        </div>
      ) : null}
    </div>
  );
}

const quickAdd = [
  { label: "New Task", icon: FileText, to: "/tasks" },
  { label: "New Party", icon: Users, to: "/parties" },
  { label: "New Sales Order", icon: FileText, to: "/sales-orders" },
  { label: "New Inward Entry", icon: Boxes, to: "/inward-entry" },
  { label: "New Process Entry", icon: Cpu, to: "/process-entry" },
  { label: "New Invoice", icon: FileSpreadsheet, to: "/invoices" },
  { label: "Bank Entry", icon: Truck, to: "/bank-entry" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const trail = breadcrumbFor(pathname);

  // If on login route, render children full-screen without sidebar/navbar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out successfully", {
      description: "Your session has been securely closed.",
    });
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBody collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <ChevronsLeft className="size-4" />
              )}
            </Button>

            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs md:flex">
              {trail.map((crumb, i) => (
                <span key={`${crumb}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 ? <span className="text-border-strong">/</span> : null}
                  <span
                    className={cn(
                      "truncate",
                      i === trail.length - 1
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>

            <div className="relative mx-auto hidden w-full max-w-md xl:block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, parties, invoices..."
                className="h-9 bg-surface pl-8.5 text-sm"
              />
            </div>

            <div className="ml-auto flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="size-3.5" />
                    <span className="hidden sm:inline">Quick Add</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Create new record</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quickAdd.map((q) => (
                    <DropdownMenuItem key={q.label} onSelect={() => navigate({ to: q.to })}>
                      <q.icon className="size-4" /> {q.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-4.5" />
                    <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      6
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="text-xs font-semibold">INV-2026-0690 overdue</span>
                    <span className="text-[11px] text-muted-foreground">
                      Kirloskar Pumps · ₹12,40,180 pending 13 days
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="text-xs font-semibold">SO-2026-003 delayed</span>
                    <span className="text-[11px] text-muted-foreground">
                      Heat treatment slot not confirmed
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="text-xs font-semibold">PW-2026-0146 awaiting approval</span>
                    <span className="text-[11px] text-muted-foreground">Urgent · due today</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => toast.info("Support desk", { description: "help@engineering-erp.in" })}
              >
                <CircleHelp className="size-4.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent cursor-pointer">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-accent-foreground uppercase">
                      {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "JM")}
                    </span>
                    <span className="hidden text-left leading-tight md:block">
                      <span className="block text-xs font-semibold text-foreground">
                        {user?.name || "Janani Mohan"}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {user?.role || "Plant Administrator"}
                      </span>
                    </span>
                    <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-semibold text-xs">
                    My Account
                    <span className="block font-normal text-[10px] text-muted-foreground truncate">
                      {user?.email || "janani.m@argus.com"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                    <UserRound className="size-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPreferencesOpen(true)} className="cursor-pointer">
                    <Settings className="size-4" /> Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer font-medium"
                  >
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Profile Dialog */}
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="max-w-md p-6 bg-card text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">User Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="size-14 rounded-full bg-primary-soft flex items-center justify-center text-xl font-bold text-accent-foreground">
                  {user?.avatar || "JM"}
                </div>
                <div>
                  <h4 className="font-bold text-base">{user?.name || "Janani Mohan"}</h4>
                  <p className="text-xs text-muted-foreground">{user?.email || "janani.m@argus.com"}</p>
                  <span className="inline-block mt-1 text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                    {user?.role || "Plant Administrator"}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Assigned Facility:</span>
                  <span className="font-semibold">{user?.plant || "Hosur Unit II"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Access Level:</span>
                  <span className="font-semibold text-emerald-600">Full Enterprise Admin</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Session Status:</span>
                  <span className="font-semibold text-blue-600">Active (Secure SSL)</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setProfileOpen(false)}>Done</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preferences Dialog */}
        <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
          <DialogContent className="max-w-md p-6 bg-card text-foreground">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Workstation Preferences</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-muted-foreground">Manage your CNC workstation and telemetry preferences.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-md border border-border">
                  <div>
                    <p className="font-semibold">Live Machine Telemetry</p>
                    <p className="text-[11px] text-muted-foreground">Stream real-time 5-axis OEE and spindle data</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">Enabled</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-md border border-border">
                  <div>
                    <p className="font-semibold">Notification Chimes</p>
                    <p className="text-[11px] text-muted-foreground">Alert on critical tool wear or delayed shipments</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">Enabled</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setPreferencesOpen(false)}>Save Settings</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
