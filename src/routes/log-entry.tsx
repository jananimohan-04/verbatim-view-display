import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";

export const Route = createFileRoute("/log-entry")({
  head: () => ({
    meta: [{ title: "Log Entry | Argus" }],
  }),
  component: LogEntryPage,
});

function LogEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");

  const [isOperatorsModalOpen, setIsOperatorsModalOpen] = useState(false);
  const [newOperatorName, setNewOperatorName] = useState("");
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [operatorSearch, setOperatorSearch] = useState("");

  const initialFormState = {
    id: null as string | null,
    part_name: "",
    project_name: "",
    process_name: "",
    start_time: "",
    end_time: "",
    quantity: "",
    operator_name: "",
    remarks: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, opsRes] = await Promise.all([
        supabase.from("log_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("operators").select("*").order("name")
      ]);

      if (logsRes.error) throw logsRes.error;
      if (opsRes.error) throw opsRes.error;

      setEntries(logsRes.data || []);
      setOperators(opsRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return 0;
    return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  };

  const handleSave = async () => {
    if (!formData.part_name || !formData.project_name || !formData.process_name || !formData.start_time || !formData.end_time || !formData.operator_name) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      const hours = calculateHours(formData.start_time, formData.end_time);
      const payload = {
        part_name: formData.part_name,
        project_name: formData.project_name,
        process_name: formData.process_name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        hours: hours,
        quantity: parseInt(formData.quantity) || 0,
        operator_name: formData.operator_name,
        remarks: formData.remarks,
      };

      if (formData.id) {
        const { error } = await supabase.from("log_entries").update(payload).eq("id", formData.id);
        if (error) throw error;
        toast.success("Log entry updated");
      } else {
        const { error } = await supabase.from("log_entries").insert([payload]);
        if (error) throw error;
        toast.success("Log entry saved");
      }
      
      setFormData(initialFormState);
      fetchData();
    } catch (error: any) {
      console.error("Error saving log:", error);
      toast.error(error.message || "Failed to save log");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLog = (log: any) => {
    // Format timestamp for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForInput = (isoString: string) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setFormData({
      id: log.id,
      part_name: log.part_name,
      project_name: log.project_name,
      process_name: log.process_name,
      start_time: formatForInput(log.start_time),
      end_time: formatForInput(log.end_time),
      quantity: log.quantity?.toString() || "",
      operator_name: log.operator_name,
      remarks: log.remarks || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;
    try {
      const { error } = await supabase.from("log_entries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Log entry deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete log entry");
    }
  };

  const handleEditOperator = (op: any) => {
    setEditingOperatorId(op.id);
    setNewOperatorName(op.name);
  };

  const handleAddOperator = async () => {
    if (!newOperatorName.trim()) return;
    try {
            let error;
      if (editingOperatorId) {
        const res = await supabase.from("operators").update({ name: newOperatorName.trim() }).eq("id", editingOperatorId);
        error = res.error;
      } else {
        const res = await supabase.from("operators").insert([{ name: newOperatorName.trim() }]);
        error = res.error;
      }
      if (error) throw error;
      toast.success(editingOperatorId ? "Operator updated" : "Operator added");
      setEditingOperatorId(null);
      setNewOperatorName("");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add operator");
    }
  };

  const handleDeleteOperator = async (id: string) => {
    if (!window.confirm("Delete this operator?")) return;
    try {
      const { error } = await supabase.from("operators").delete().eq("id", id);
      if (error) throw error;
      toast.success("Operator deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete operator");
    }
  };

  const filteredEntries = entries.filter((e) =>
    Object.values(e).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredOperators = operators.filter(o => 
    o.name.toLowerCase().includes(operatorSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 mx-auto max-w-[1400px]">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">LOG ENTRY</h1>
        <Button 
          className="bg-[#3b82f6] hover:bg-blue-700 text-white font-medium h-9 px-4 gap-2 rounded shadow-sm"
          onClick={() => setIsOperatorsModalOpen(true)}
        >
          <User className="size-4" /> Operators
        </Button>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <Select value={formData.part_name} onValueChange={(v) => setFormData({ ...formData, part_name: v })}>
            <SelectTrigger className="h-10 text-sm border-gray-200 text-gray-500"><SelectValue placeholder="Select Part" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Part A">Part A</SelectItem>
              <SelectItem value="Part B">Part B</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formData.project_name} onValueChange={(v) => setFormData({ ...formData, project_name: v })}>
            <SelectTrigger className="h-10 text-sm border-gray-200 text-gray-500"><SelectValue placeholder="Select Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Project X">Project X</SelectItem>
              <SelectItem value="Project Y">Project Y</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formData.process_name} onValueChange={(v) => setFormData({ ...formData, process_name: v })}>
            <SelectTrigger className="h-10 text-sm border-gray-200 text-gray-500"><SelectValue placeholder="Select Process" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Milling">Milling</SelectItem>
              <SelectItem value="Turning">Turning</SelectItem>
            </SelectContent>
          </Select>

          <Input 
            type="datetime-local" 
            className="h-10 text-sm border-gray-200 text-gray-500" 
            value={formData.start_time} 
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} 
          />
          
          <Input 
            type="datetime-local" 
            className="h-10 text-sm border-gray-200 text-gray-500" 
            value={formData.end_time} 
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} 
          />
          
          <Input 
            type="number" 
            placeholder="Quantity" 
            className="h-10 text-sm border-gray-200 placeholder:text-gray-400" 
            value={formData.quantity} 
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Select value={formData.operator_name} onValueChange={(v) => setFormData({ ...formData, operator_name: v })}>
            <SelectTrigger className="h-10 text-sm border-gray-200 text-gray-500 lg:col-span-1"><SelectValue placeholder="Operator" /></SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.id} value={op.name}>{op.name}</SelectItem>
              ))}
              {operators.length === 0 && <SelectItem value="none" disabled>No operators found</SelectItem>}
            </SelectContent>
          </Select>

          <Input 
            placeholder="Remarks" 
            className="h-10 text-sm border-gray-200 placeholder:text-gray-400 lg:col-span-2" 
            value={formData.remarks} 
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
          />
          
          <Button 
            className="h-10 bg-[#f3f4f6] hover:bg-gray-200 text-black border border-gray-300 font-medium lg:col-span-1" 
            onClick={handleSave} 
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>

          <Button 
            className="h-10 bg-[#ef4444] hover:bg-red-600 text-white font-medium lg:col-span-1" 
            onClick={() => setFormData(initialFormState)}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button className="bg-[#64748b] hover:bg-slate-600 text-white h-9 px-4 text-sm font-medium">
          Show Filters
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-md">
        <div className="flex flex-wrap items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Show</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="h-8 w-[70px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>

          <div className="flex gap-1.5 flex-wrap my-2 sm:my-0 mx-auto sm:mx-4">
            {["Copy", "Excel", "PDF", "Print"].map(btn => (
              <Button key={btn} variant="outline" className="h-8 px-3 text-xs font-medium text-slate-700 bg-white border-gray-300 shadow-sm">
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
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] border-b text-slate-700">
              <tr>
                {["Timestamp", "Part Name", "Project Name", "Process", "Start Time", "End Time", "Hours", "Qty", "Incharge", "Remarks", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3 font-semibold text-xs border-r border-gray-200 last:border-r-0 align-middle">
                    <div className="flex items-center justify-between gap-1">
                      {col}
                      {col !== "Actions" && (
                        <div className="flex flex-col text-[8px] leading-[8px] opacity-30">
                          <span>▲</span><span>▼</span>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {loading ? (
                <tr><td colSpan={11} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={11} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 border-b border-gray-100">
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.part_name}</td>
                    <td className="px-4 py-3">{row.project_name}</td>
                    <td className="px-4 py-3">{row.process_name}</td>
                    <td className="px-4 py-3">{new Date(row.start_time).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(row.end_time).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.hours}</td>
                    <td className="px-4 py-3">{row.quantity}</td>
                    <td className="px-4 py-3">{row.operator_name}</td>
                    <td className="px-4 py-3">{row.remarks}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col sm:flex-row gap-1">
                        <Button size="sm" className="h-7 px-3 bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-medium rounded shadow-none" onClick={() => handleEditLog(row)}>Edit</Button>
                        <Button size="sm" className="h-7 px-3 bg-[#ef4444] hover:bg-red-700 text-white text-xs font-medium rounded shadow-none" onClick={() => handleDeleteLog(row.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operators Modal */}
      <Dialog open={isOperatorsModalOpen} onOpenChange={setIsOperatorsModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 border border-gray-200 overflow-hidden shadow-xl rounded">
          <DialogHeader className="p-4 border-b bg-white relative flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-normal text-slate-800">Operators Name List</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4 bg-white min-h-[400px] flex flex-col">
            <div className="flex gap-2">
              <Input 
                placeholder="New operator name" 
                className="h-10 text-sm border-gray-300"
                value={newOperatorName}
                onChange={(e) => setNewOperatorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddOperator()}
              />
              <Button className="h-10 px-6 bg-[#10b981] hover:bg-emerald-600 text-white font-medium" onClick={handleAddOperator}>{editingOperatorId ? "Update" : "Add"}</Button>
            </div>
            
            <div className="flex gap-2 pb-4 border-b">
              <Input 
                placeholder="Operator..." 
                className="h-10 text-sm border-gray-300"
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
              />
              <Button variant="outline" className="h-10 px-6 bg-white border-gray-300 font-medium" onClick={() => setOperatorSearch("")}>
                Clear
              </Button>
            </div>

            <div className="flex-1 overflow-auto max-h-[350px]">
              {filteredOperators.map(op => (
                <div key={op.id} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100 hover:bg-gray-50 px-2">
                  <span className="text-sm text-slate-700">{op.name}</span>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 px-4 bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-medium rounded-sm" onClick={() => handleEditOperator(op)}>Edit</Button>
                    <Button size="sm" className="h-8 px-4 bg-[#ef4444] hover:bg-red-700 text-white text-xs font-medium rounded-sm" onClick={() => handleDeleteOperator(op.id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {filteredOperators.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">No operators found. Add one above.</div>
              )}
            </div>
          </div>
          <div className="p-4 bg-white border-t flex justify-end">
             <Button className="h-10 px-6 bg-[#64748b] hover:bg-slate-600 text-white font-medium" onClick={() => setIsOperatorsModalOpen(false)}>
               Close
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

