import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/erp/page-header";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/sales-orders/")({
  head: () => ({
    meta: [{ title: "Sales Orders | Argus" }],
  }),
  component: SalesOrdersPage,
});

function SalesOrdersPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    partyName: "",
    date: new Date().toISOString().split("T")[0],
    projectName: "",
    quantity: "",
    rejectionQty: "0",
    status: "Open",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching sales orders:", error);
      toast.error("Failed to load data. Make sure Supabase is connected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setNewEntry({
      partyName: row.party_name,
      date: row.date,
      projectName: row.project_name_so || "",
      quantity: row.quantity?.toString() || "",
      rejectionQty: row.rejection_qty?.toString() || "0",
      status: row.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const { error } = await supabase.from("sales_orders").delete().eq("id", id);
      if (error) throw error;
      toast.success("Order deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete order");
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.partyName || !newEntry.date) {
      toast.error("Party Name and Date are required.");
      return;
    }
    
    try {
      setSubmitting(true);
            const payload = {
        party_name: newEntry.partyName,
        date: newEntry.date,
        project_name_so: newEntry.projectName,
        quantity: parseInt(newEntry.quantity) || 0,
        rejection_qty: parseInt(newEntry.rejectionQty) || 0,
        status: newEntry.status
      };
      
      let error;
      if (editingId) {
        const res = await supabase.from("sales_orders").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("sales_orders").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      toast.success(editingId ? "Sales order updated" : "Sales order added");
      setEditingId(null);
      setNewEntry({
        partyName: "",
        date: new Date().toISOString().split("T")[0],
        projectName: "",
        quantity: "",
        rejectionQty: "0",
        status: "Open",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error adding entry:", error);
      toast.error(error.message || (editingId ? "Failed to update entry" : "Failed to add entry"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEntries = entries.filter((e) =>
    Object.values(e).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <>
      <PageHeader
        title="Sales Order"
      />

      <div className="mb-6 rounded-md border bg-white shadow-sm mt-4">
        <h3 className="text-lg font-bold text-slate-700 border-b p-4 pb-2 bg-slate-50 rounded-t-md">Sales Order Entry</h3>
        <div className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-bold text-slate-800">Party Name:</label>
            <Input className="h-9 text-sm" placeholder="Enter Party Name" value={newEntry.partyName} onChange={(e) => setNewEntry({ ...newEntry, partyName: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-bold text-slate-800">Date:</label>
            <Input type="date" className="h-9 text-sm" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs font-bold text-slate-800">Project Name:</label>
            <Input className="h-9 text-sm" value={newEntry.projectName} onChange={(e) => setNewEntry({ ...newEntry, projectName: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="mb-1 block text-xs font-bold text-slate-800">Quantity:</label>
            <Input type="number" className="h-9 text-sm" value={newEntry.quantity} onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="mb-1 block text-xs font-bold text-slate-800">Rejection Qty:</label>
            <Input type="number" className="h-9 text-sm" value={newEntry.rejectionQty} onChange={(e) => setNewEntry({ ...newEntry, rejectionQty: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-xs font-bold text-slate-800">Status:</label>
            <Select value={newEntry.status} onValueChange={(v) => setNewEntry({ ...newEntry, status: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 font-semibold px-6" onClick={handleAddEntry} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update Entry" : "Add Entry"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 border-b border-t py-3 bg-slate-50 px-4 rounded-md items-center shadow-sm">
        <Button variant="outline" className="bg-gray-100 font-bold text-slate-700" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        
        {showFilters && (
          <div className="flex flex-1 flex-wrap items-center gap-3 bg-white p-2 px-4 rounded-md border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Status</span>
              <Select defaultValue="All"><SelectTrigger className="h-8 w-24 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Pending</span>
              <Select defaultValue="All"><SelectTrigger className="h-8 w-24 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Party</span>
              <Select defaultValue="All"><SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Start Date</span>
              <Input type="date" className="h-8 w-32 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">End Date</span>
              <Input type="date" className="h-8 w-32 text-sm" />
            </div>
            <div className="ml-auto flex gap-2">
              <Button className="h-8 bg-blue-600 hover:bg-blue-700 font-semibold px-4">Filter</Button>
              <Button variant="secondary" className="h-8 bg-slate-500 text-white hover:bg-slate-600 font-semibold px-4">Clear</Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-slate-50">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="h-8 w-20 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Search:</span>
            <Input className="h-8 w-64 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-t">
            <thead className="bg-[#4a5568] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] align-middle">Timestamp</th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] align-middle">Party Name</th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] align-middle cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col text-[10px] leading-none opacity-50"><span className="opacity-100">▲</span><span>▼</span></div>
                    <span>Date</span>
                    <div className="flex flex-col text-[10px] leading-none opacity-50"><span>▲</span><span>▼</span></div>
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] text-center align-middle">Project Name<br/><span className="text-[11px] font-normal">(For sales Order only)</span></th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] align-middle">Quantity</th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] text-center align-middle">Project Name<br/><span className="text-[11px] font-normal">(For Tracking)</span></th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] text-center align-middle">Pending<br/>Qty</th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] text-center align-middle">Rejection<br/>Qty</th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] align-middle">Status</th>
                <th className="px-4 py-3 font-semibold border-x border-[#3b4453] align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-800">
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-gray-500"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={10} className="p-4 text-center text-gray-500">No matching entries found</td></tr>
              ) : (
                filteredEntries.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-slate-50 border-b">
                    <td className="px-4 py-3 whitespace-nowrap">{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</td>
                    <td className="px-4 py-3">{row.party_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3">{row.project_name_so}</td>
                    <td className="px-4 py-3">{row.quantity}</td>
                    <td className="px-4 py-3">{row.project_name_so}</td>
                    <td className="px-4 py-3">{row.quantity}</td>
                    <td className="px-4 py-3">{row.rejection_qty}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
  <div className="flex gap-2">
    <Button size="sm" className="h-7 px-3 bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-semibold" onClick={() => handleEdit(row)}>Edit</Button>
    <Button size="sm" className="h-7 px-3 bg-[#ef4444] hover:bg-red-700 text-white text-xs font-semibold" onClick={() => handleDelete(row.id)}>Delete</Button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

