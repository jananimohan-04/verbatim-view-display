import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/process-entry")({
  head: () => ({
    meta: [{ title: "Process Entry | Argus" }],
  }),
  component: ProcessEntryPage,
});

function ProcessEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("25");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    process_name: "",
    description: "",
    cost_per_hour: "",
    cost_per_component: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("process_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching process entries:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (entry?: any) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        process_name: entry.process_name,
        description: entry.description || "",
        cost_per_hour: entry.cost_per_hour?.toString() || "0",
        cost_per_component: entry.cost_per_component?.toString() || "0",
      });
    } else {
      setEditingId(null);
      setFormData({
        process_name: "",
        description: "",
        cost_per_hour: "",
        cost_per_component: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.process_name) {
      toast.error("Process Name is required.");
      return;
    }

    try {
      setSubmitting(true);
      
      const cost_per_hour = parseFloat(formData.cost_per_hour) || 0;
      const cost_per_component = parseFloat(formData.cost_per_component) || 0;
      const total_cost = cost_per_hour + cost_per_component;

      const payload = {
        process_name: formData.process_name,
        description: formData.description,
        cost_per_hour,
        cost_per_component,
        total_cost,
      };

      if (editingId) {
        const { error } = await supabase.from("process_entries").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Process updated successfully");
      } else {
        const { error } = await supabase.from("process_entries").insert([payload]);
        if (error) throw error;
        toast.success("Process added successfully");
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving process:", error);
      toast.error(error.message || "Failed to save process");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this process?")) return;
    try {
      const { error } = await supabase.from("process_entries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Process deleted successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting process:", error);
      toast.error("Failed to delete process");
    }
  };

  const filteredEntries = entries.filter((e) =>
    Object.values(e).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-4 sm:p-6 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">PROCESS ENTRY</h1>
        <Button 
          variant="outline" 
          className="border-[#dc2626] text-[#dc2626] hover:bg-red-50 hover:text-red-700 font-semibold h-9 px-4 gap-1.5 rounded-md"
          onClick={() => handleOpenModal()}
        >
          <Plus className="size-4" /> Add Process
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-4 bg-[#f8f9fa] border-b">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Show</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="h-8 w-20 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="flex gap-1.5 flex-wrap my-2 sm:my-0 mx-auto sm:mx-4">
            {["Copy", "CSV", "Excel", "PDF", "Print"].map(btn => (
              <Button key={btn} variant="outline" className="h-8 px-3 text-xs font-medium text-slate-700 bg-gray-50 hover:bg-gray-100 border-gray-300">
                {btn}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Search:</span>
            <Input className="h-8 w-48 bg-white border-gray-300" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#1e293b] text-white">
              <tr>
                {["Timestamp", "Process", "Description", "Cost Per Hour", "Cost Per Component", "Total Cost", "Edit", "Delete"].map((col) => (
                  <th key={col} className="px-4 py-3 font-semibold text-xs border-r border-[#334155] last:border-r-0 align-middle">
                    <div className="flex items-center justify-between gap-2">
                      {col}
                      <div className="flex flex-col text-[8px] leading-[8px] opacity-40">
                        <span>▲</span><span>▼</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 border-b border-gray-100 even:bg-[#f8fafc]">
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.process_name}</td>
                    <td className="px-4 py-3">{row.description}</td>
                    <td className="px-4 py-3">{row.cost_per_hour}</td>
                    <td className="px-4 py-3">{row.cost_per_component}</td>
                    <td className="px-4 py-3">{row.total_cost}</td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" className="h-7 px-3 bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-semibold" onClick={() => handleOpenModal(row)}>Edit</Button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" className="h-7 px-3 bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-semibold" onClick={() => handleDelete(row.id)}>Delete</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 text-xs text-gray-500 bg-[#f8f9fa] border-t flex justify-between items-center">
          <span>Showing 1 to {filteredEntries.length} of {filteredEntries.length} entries</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-gray-500 h-7" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-gray-200 text-black">1</Button>
            <Button variant="ghost" size="sm" className="text-gray-500 h-7" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 border-0 overflow-hidden rounded-md">
          <DialogHeader className="p-4 border-b text-center relative">
            <DialogTitle className="text-lg font-bold text-center">Add Process Cost</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Input 
                placeholder="PROCESS NAME" 
                className="h-11 uppercase placeholder:text-gray-400" 
                value={formData.process_name} 
                onChange={(e) => setFormData({ ...formData, process_name: e.target.value })} 
              />
            </div>
            <div>
              <Input 
                placeholder="DESCRIPTION" 
                className="h-11 uppercase placeholder:text-gray-400" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
            <div>
              <Input 
                type="number"
                placeholder="COST PER HOUR" 
                className="h-11 uppercase placeholder:text-gray-400 font-medium" 
                value={formData.cost_per_hour} 
                onChange={(e) => setFormData({ ...formData, cost_per_hour: e.target.value })} 
              />
            </div>
            <div>
              <Input 
                type="number"
                placeholder="COST PER COMPONENT" 
                className="h-11 uppercase placeholder:text-gray-400 font-medium" 
                value={formData.cost_per_component} 
                onChange={(e) => setFormData({ ...formData, cost_per_component: e.target.value })} 
              />
            </div>
            <Button 
              className="w-full h-12 bg-[#dc2626] hover:bg-red-700 text-white text-base font-semibold mt-2" 
              onClick={handleSave} 
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
