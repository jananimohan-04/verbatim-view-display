import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, KanbanSquare, Plus, Rows3, UserRound, Loader2 } from "lucide-react";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, SectionCard, StatTile } from "@/components/erp/page-header";
import { PriorityTag, StatusBadge } from "@/components/erp/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Management | Argus" },
      {
        name: "description",
        content:
          "Assign, track and close plant tasks across planning, production, dispatch and accounts with list and Kanban views.",
      },
    ],
  }),
  component: TasksPage,
});

type Task = {
  id: string;
  title: string;
  description: string;
  module: string;
  related: string;
  assignee: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  due: string;
  status: "To Do" | "In Progress" | "Waiting" | "Completed" | "Cancelled";
};

const statuses = ["To Do", "In Progress", "Waiting", "Completed", "Cancelled"];

const columns: Column<Task>[] = [
  {
    key: "id",
    header: "Task ID",
    sortable: true,
    sortValue: (r) => r.id,
    cell: (r) => <span className="font-semibold tabular text-accent-foreground">{r.id}</span>,
  },
  {
    key: "title",
    header: "Task",
    cell: (r) => (
      <div className="max-w-80">
        <p className="truncate font-medium text-foreground">{r.title}</p>
        <p className="truncate text-xs text-muted-foreground">{r.description}</p>
      </div>
    ),
  },
  { key: "module", header: "Module", cell: (r) => <span className="text-muted-foreground">{r.module}</span> },
  {
    key: "related",
    header: "Linked Record",
    cell: (r) => <span className="tabular text-xs text-accent-foreground">{r.related}</span>,
  },
  { key: "assignee", header: "Assigned To", sortable: true, sortValue: (r) => r.assignee, cell: (r) => r.assignee },
  { key: "priority", header: "Priority", cell: (r) => <PriorityTag priority={r.priority} /> },
  {
    key: "due",
    header: "Due Date",
    sortable: true,
    sortValue: (r) => r.due,
    cell: (r) => <span className="tabular text-muted-foreground">{r.due}</span>,
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

function TasksPage() {
  const [view, setView] = useState<"list" | "kanban" | "mine">("list");
  // Kept empty - no hardcodes
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // New Task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    module: "Production",
    related: "",
    assignee: "",
    priority: "Medium" as const,
    due: new Date().toISOString().split("T")[0],
    status: "To Do" as const
  });

  const visible = view === "mine" ? tasks.filter((t) => t.assignee.includes("Janani")) : tasks;

  const openCount = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length;
  const overdueCount = tasks.filter((t) => {
    if (t.status === "Completed" || t.status === "Cancelled" || !t.due) return false;
    return new Date(t.due) < new Date();
  }).length;
  const dueTodayCount = tasks.filter((t) => {
    if (t.status === "Completed" || t.status === "Cancelled" || !t.due) return false;
    return t.due === new Date().toISOString().split("T")[0];
  }).length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  const handleCreateTask = () => {
    if (!newTask.title) {
      toast.error("Please provide a task title");
      return;
    }
    const createdTask: Task = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      ...newTask
    };
    setTasks((prev) => [createdTask, ...prev]);
    toast.success("Task created");
    setCreateOpen(false);
    setNewTask({
      title: "",
      description: "",
      module: "Production",
      related: "",
      assignee: "",
      priority: "Medium",
      due: new Date().toISOString().split("T")[0],
      status: "To Do"
    });
  };

  return (
    <>
      <PageHeader
        title="Task Management"
        description="Assign, follow up and close operational tasks linked to any ERP record."
        actions={
          <>
            <div className="flex rounded-md border border-border bg-card p-0.5">
              {[
                { id: "list", label: "List", icon: Rows3 },
                { id: "kanban", label: "Kanban", icon: KanbanSquare },
                { id: "mine", label: "My Tasks", icon: UserRound },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id as typeof view)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    view === v.id
                      ? "bg-primary-soft text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <v.icon className="size-3.5" />
                  {v.label}
                </button>
              ))}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5">
                  <Plus className="size-3.5" /> Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-6 bg-card text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Title *</label>
                    <Input
                      placeholder="Task summary..."
                      className="h-8 text-xs"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Description</label>
                    <Input
                      placeholder="Additional details..."
                      className="h-8 text-xs"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Module</label>
                      <Select value={newTask.module} onValueChange={(v) => setNewTask({ ...newTask, module: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Production">Production</SelectItem>
                          <SelectItem value="Inward">Inward</SelectItem>
                          <SelectItem value="DC Entry">DC Entry</SelectItem>
                          <SelectItem value="Invoices">Invoices</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Linked Record</label>
                      <Input
                        placeholder="e.g. SO-101, INV-202"
                        className="h-8 text-xs"
                        value={newTask.related}
                        onChange={(e) => setNewTask({ ...newTask, related: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Assigned To</label>
                      <Input
                        placeholder="Assignee name..."
                        className="h-8 text-xs"
                        value={newTask.assignee}
                        onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Priority</label>
                      <Select value={newTask.priority} onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Due Date</label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={newTask.due}
                      onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <DialogClose asChild>
                      <Button variant="outline" className="h-8 text-xs">Cancel</Button>
                    </DialogClose>
                    <Button className="h-8 text-xs" onClick={handleCreateTask}>Create Task</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Summary KPI Tiles - Dynamic (showing 0 when empty) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="My Open Tasks" value={openCount} hint="Active assigned tasks" />
        <StatTile label="Overdue Tasks" value={overdueCount} hint="Past target due date" tone="danger" />
        <StatTile label="Due Today" value={dueTodayCount} hint="Scheduled for today" tone="warning" />
        <StatTile label="Completed" value={completedCount} hint="Tasks closed" tone="success" />
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statuses.map((st) => {
            const inStatus = visible.filter((t) => t.status === st);
            return (
              <div key={st} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{st}</p>
                  <span className="flex size-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-muted-foreground">
                    {inStatus.length}
                  </span>
                </div>
                <div className="space-y-2 pt-2">
                  {inStatus.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    inStatus.map((t) => (
                      <div key={t.id} className="rounded-md border border-border bg-surface p-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-accent-foreground">{t.id}</span>
                          <PriorityTag priority={t.priority} />
                        </div>
                        <p className="mt-1 font-medium text-foreground">{t.title}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{t.assignee || "Unassigned"}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(r) => r.id}
          searchPlaceholder="Search tasks, assignees or linked records..."
          searchKeys={(r) => `${r.id} ${r.title} ${r.description} ${r.assignee} ${r.related}`}
          statusOptions={statuses}
          statusOf={(r) => r.status}
        />
      )}
    </>
  );
}
