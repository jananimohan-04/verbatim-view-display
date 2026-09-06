import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/inward-entry")({
  head: () => ({
    meta: [{ title: "Inward Entry | Argus" }],
  }),
  component: InwardEntryPage,
});

function InwardEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");

  const initialEntryState = {
    category: "",
    projectName: "",
    referenceNo: "",
    date: new Date().toISOString().split("T")[0],
    partyName: "",
    file: null as File | null,
  };

  const initialPartState = { name: "", quantity: "", price: "", discount: "", gst: "" };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState(initialEntryState);
  const [parts, setParts] = useState([{ ...initialPartState }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inward_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching inward entries:", error);
      toast.error("Failed to load data.");
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
      category: row.category,
      projectName: row.project_name || "",
      referenceNo: row.reference_no || "",
      date: row.date,
      partyName: row.party_name,
      file: null,
    });
    setParts(row.parts && row.parts.length > 0 ? row.parts : [{ ...initialPartState }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const { error } = await supabase.from("inward_entries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete entry");
    }
  };

  const handleAddPart = () => {
    if (parts.length < 5) {
      setParts([...parts, { ...initialPartState }]);
    } else {
      toast.error("Maximum 5 parts allowed");
    }
  };

  const updatePart = (index: number, field: string, value: string) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const handleReset = () => {
    setNewEntry(initialEntryState);
    setParts([{ ...initialPartState }]);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!newEntry.category || !newEntry.projectName || !newEntry.date || !newEntry.partyName) {
      toast.error("Please fill all required (*) fields in the entry details.");
      return;
    }
    
    if (parts.some(p => !p.name || !p.quantity)) {
      toast.error("Please provide a name and quantity for all parts.");
      return;
    }

    try {
      setSubmitting(true);

      let totalAmount = 0;
      const parsedParts = parts.map(p => {
        const qty = parseFloat(p.quantity) || 0;
        const price = parseFloat(p.price) || 0;
        const disc = parseFloat(p.discount) || 0;
        const gst = parseFloat(p.gst) || 0;
        
        const basePrice = qty * price;
        const discounted = basePrice - (basePrice * disc / 100);
        const finalPrice = discounted + (discounted * gst / 100);
        
        totalAmount += finalPrice;
        return { name: p.name, quantity: qty, price, discount: disc, gst };
      });

      const payload = {
        category: newEntry.category,
        project_name: newEntry.projectName,
        reference_no: newEntry.referenceNo,
        date: newEntry.date,
        party_name: newEntry.partyName,
        parts: parsedParts,
        total_amount: totalAmount,
        image_url: newEntry.file ? newEntry.file.name : null,
      };

      let error;
      if (editingId) {
        const res = await supabase.from("inward_entries").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("inward_entries").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      
      toast.success(editingId ? "Inward entry updated" : "Inward entry saved");
      handleReset();
      fetchData();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast.error(error.message || "Failed to save entry");
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
    <div className="p-4 sm:p-6 mx-auto max-w-7xl">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-6 uppercase">INWARD ENTRY</h1>

      {/* Entry Form */}
      <div className="bg-[#f5f6f8] rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Category <span className="text-red-500">*</span></label>
            <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
              <SelectTrigger className="bg-white h-9 text-sm"><SelectValue placeholder="-- Select Category --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Raw Material">Raw Material</SelectItem>
                <SelectItem value="Consumables">Consumables</SelectItem>
                <SelectItem value="Machinery">Machinery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Project Name <span className="text-red-500">*</span></label>
            <Select value={newEntry.projectName} onValueChange={(v) => setNewEntry({ ...newEntry, projectName: v })}>
              <SelectTrigger className="bg-white h-9 text-sm"><SelectValue placeholder="-- Select Project --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Project Alpha">Project Alpha</SelectItem>
                <SelectItem value="Project Beta">Project Beta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Upload Reference Image(JPG/PNG)</label>
            <Input 
              type="file" 
              accept=".jpg,.jpeg,.png" 
              className="bg-white h-9 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer p-1" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewEntry({ ...newEntry, file });
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Reference No</label>
            <Input className="bg-white h-9 text-sm" placeholder="Ref no" value={newEntry.referenceNo} onChange={(e) => setNewEntry({ ...newEntry, referenceNo: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Date <span className="text-red-500">*</span></label>
            <Input type="date" className="bg-white h-9 text-sm" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Party Name <span className="text-red-500">*</span></label>
            <Select value={newEntry.partyName} onValueChange={(v) => setNewEntry({ ...newEntry, partyName: v })}>
              <SelectTrigger className="bg-white h-9 text-sm"><SelectValue placeholder="-- Select Party --" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bharat Alloy Steels">Bharat Alloy Steels</SelectItem>
                <SelectItem value="Global Supply Co.">Global Supply Co.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border border-dashed border-gray-300 rounded-lg p-5 mb-6 bg-[#f8f9fb]">
          {parts.map((part, index) => (
            <div key={index} className="flex flex-wrap items-end gap-4 mb-4">
              <div className="flex items-center w-24 mb-2">
                <span className="font-bold text-lg mr-2">Part {index + 1}</span>
                <span className="text-[9px] text-gray-500 leading-tight">Amount auto-<br/>calculated on<br/>save</span>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Part Name <span className="text-red-500">*</span></label>
                <Input className="bg-white h-9 text-sm" value={part.name} onChange={(e) => updatePart(index, 'name', e.target.value)} />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Quantity <span className="text-red-500">*</span></label>
                <Input type="number" className="bg-white h-9 text-sm" value={part.quantity} onChange={(e) => updatePart(index, 'quantity', e.target.value)} />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Price</label>
                <Input type="number" className="bg-white h-9 text-sm" value={part.price} onChange={(e) => updatePart(index, 'price', e.target.value)} />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Discount (%)</label>
                <Input type="number" className="bg-white h-9 text-sm" value={part.discount} onChange={(e) => updatePart(index, 'discount', e.target.value)} />
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">GST (%)</label>
                <Input type="number" className="bg-white h-9 text-sm" value={part.gst} onChange={(e) => updatePart(index, 'gst', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="bg-white text-slate-700 font-semibold h-9 px-4" onClick={handleAddPart}>
            + Add Part (max 5)
          </Button>
          <Button className="bg-[#2563eb] hover:bg-blue-700 text-white font-semibold h-9 px-8" onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Update" : "Save"}
          </Button>
          <Button variant="outline" className="bg-white text-slate-700 font-semibold h-9 px-6" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#f5f6f8] rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">Category</span>
          <Select defaultValue="All">
            <SelectTrigger className="bg-white h-9 w-40 text-sm"><SelectValue placeholder="-- All Categories --" /></SelectTrigger>
            <SelectContent><SelectItem value="All">-- All Categories --</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">Project</span>
          <Select defaultValue="All">
            <SelectTrigger className="bg-white h-9 w-40 text-sm"><SelectValue placeholder="-- All Projects --" /></SelectTrigger>
            <SelectContent><SelectItem value="All">-- All Projects --</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">From</span>
          <Input type="date" className="bg-white h-9 w-36 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">To</span>
          <Input type="date" className="bg-white h-9 w-36 text-sm" />
        </div>
        <div className="ml-auto flex gap-2">
          <Button className="bg-[#2563eb] hover:bg-blue-700 text-white font-semibold h-9 px-6">Filter</Button>
          <Button variant="outline" className="bg-white text-slate-700 font-semibold h-9 px-6">Clear</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Show</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="h-8 w-20 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Search:</span>
            <Input className="h-8 w-64 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fa] border-b text-slate-700">
              <tr>
                {["Timestamp", "Category", "Project", "Image", "No", "Date", "Party", "Part 1", "Qty 1", "Total Amount", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3 font-semibold text-xs border-r last:border-r-0 border-gray-200 cursor-pointer group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      {col}
                      <div className="flex flex-col text-[8px] leading-[8px] opacity-30 group-hover:opacity-100">
                        <span>▲</span><span>▼</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-slate-600">
              {loading ? (
                <tr><td colSpan={11} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={11} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row) => {
                  const firstPart = row.parts && row.parts.length > 0 ? row.parts[0] : null;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 border-b border-gray-100">
                      <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.category}</td>
                      <td className="px-4 py-3">{row.project_name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs italic">{row.image_url || 'No Image'}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.reference_no || '-'}</td>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3 font-medium">{row.party_name}</td>
                      <td className="px-4 py-3">{firstPart ? firstPart.name : '-'}</td>
                      <td className="px-4 py-3">{firstPart ? firstPart.quantity : '-'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">₹{row.total_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 sm:flex-row">
                          <Button size="sm" className="h-6 px-2 bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-medium rounded shadow-none" onClick={() => handleEdit(row)}>Edit</Button>
                          <Button size="sm" className="h-6 px-2 bg-[#ef4444] hover:bg-red-700 text-white text-xs font-medium rounded shadow-none" onClick={() => handleDelete(row.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
