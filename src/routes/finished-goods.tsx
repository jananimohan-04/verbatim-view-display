import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export const Route = createFileRoute("/finished-goods")({
  head: () => ({
    meta: [{ title: "Finished Goods | Argus" }],
  }),
  component: FinishedGoodsPage,
});

function FinishedGoodsPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");

  const [editingId, setEditingId] = useState<string | null>(null);

  const initialEntryState = {
    category: "",
    date: new Date().toISOString().split("T")[0],
    projectName: "",
    quantity: "",
  };

  const initialPartState = { partName: "", quantity: "" };

  const [newEntry, setNewEntry] = useState(initialEntryState);
  const [parts, setParts] = useState([{ ...initialPartState }]);

  // Modal data states
  const [priceList, setPriceList] = useState<any[]>([]);
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  const [pendingParts, setPendingParts] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("finished_goods")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching finished goods:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchModalData = async (table: string, setter: any) => {
    try {
      setModalLoading(true);
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setter(data || []);
    } catch (error) {
      toast.error(`Failed to load ${table}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setNewEntry({
      category: row.category,
      date: row.date,
      projectName: row.project_name || "",
      quantity: row.quantity?.toString() || "",
    });
    setParts(row.parts && row.parts.length > 0 ? row.parts : [{ ...initialPartState }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const { error } = await supabase.from("finished_goods").delete().eq("id", id);
      if (error) throw error;
      toast.success("Entry deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete entry");
    }
  };

  const handleAddPart = () => {
    setParts([...parts, { ...initialPartState }]);
  };

  const handleRemovePart = (index: number) => {
    if (parts.length > 1) {
      const newParts = parts.filter((_, i) => i !== index);
      setParts(newParts);
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
    if (!newEntry.category || !newEntry.projectName || !newEntry.date) {
      toast.error("Please fill all required fields in the main form.");
      return;
    }
    
    if (parts.some(p => !p.partName || !p.quantity)) {
      toast.error("Please provide a name and quantity for all parts.");
      return;
    }

    try {
      setSubmitting(true);

      const parsedParts = parts.map(p => ({
        partName: p.partName,
        quantity: parseInt(p.quantity) || 0,
      }));

      const payload = {
        category: newEntry.category,
        date: newEntry.date,
        project_name: newEntry.projectName,
        quantity: parseInt(newEntry.quantity) || 0,
        parts: parsedParts,
      };

      let error;
      if (editingId) {
        const res = await supabase.from("finished_goods").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("finished_goods").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      
      toast.success(editingId ? "Finished goods updated" : "Finished goods saved");
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
    <div className="p-4 sm:p-6 mx-auto max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-2 gap-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Finished Goods Entry</h1>
        <div className="flex flex-wrap gap-2">
          <Dialog onOpenChange={(open) => open && fetchModalData("price_list", setPriceList)}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 bg-[#06b6d4] hover:bg-cyan-600 text-white text-xs font-bold uppercase rounded-sm shadow-sm">Price List</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-xl font-normal text-gray-700 pb-2 border-b">Price List</DialogTitle></DialogHeader>
              <Input placeholder="Search Project..." className="mb-4" />
              <table className="w-full text-left text-sm border">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-3 border-r font-bold">Project Name</th><th className="p-3 border-r font-bold w-24">MRP</th><th className="p-3 font-bold w-32">Sale Price</th></tr>
                </thead>
                <tbody className="divide-y">
                  {modalLoading ? <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr> : priceList.length === 0 ? <tr><td colSpan={3} className="p-4 text-center">No data found in Supabase (add to price_list table)</td></tr> : priceList.map(row => (
                    <tr key={row.id}><td className="p-3 border-r">{row.project_name}</td><td className="p-3 border-r">{row.mrp || ''}</td><td className="p-3">{row.sale_price || ''}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end"><DialogClose asChild><Button className="bg-[#6b7280] hover:bg-gray-700 text-white">Close</Button></DialogClose></div>
            </DialogContent>
          </Dialog>

          <Dialog onOpenChange={(open) => open && fetchModalData("stock_details", setStockDetails)}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 bg-[#6b7280] hover:bg-gray-600 text-white text-xs font-bold uppercase rounded-sm shadow-sm">Store</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-xl font-normal text-gray-700 uppercase pb-2 border-b">Stock Details</DialogTitle></DialogHeader>
              <Input placeholder="Search Project..." className="mb-4" />
              <table className="w-full text-left text-sm border">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-3 border-r font-bold">Project Name<br/><span className="text-xs font-normal">(Manufactured Goods Only)</span></th><th className="p-3 border-r font-bold">Finished Quantity<br/><span className="text-xs font-normal">(From Finished Goods)</span></th><th className="p-3 border-r font-bold">Send Quantity<br/><span className="text-xs font-normal">(From DC)</span></th><th className="p-3 font-bold">Balance Stock<br/><span className="text-xs font-normal">(In Finished Goods)</span></th></tr>
                </thead>
                <tbody className="divide-y">
                  {modalLoading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> : stockDetails.length === 0 ? <tr><td colSpan={4} className="p-4 text-center">No data found in Supabase (add to stock_details table)</td></tr> : stockDetails.map(row => (
                    <tr key={row.id}><td className="p-3 border-r">{row.project_name}</td><td className="p-3 border-r">{row.finished_quantity}</td><td className="p-3 border-r">{row.send_quantity || ''}</td><td className="p-3">{row.balance_stock}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end"><DialogClose asChild><Button className="bg-[#6b7280] hover:bg-gray-700 text-white">Close</Button></DialogClose></div>
            </DialogContent>
          </Dialog>

          <Dialog onOpenChange={(open) => open && fetchModalData("pending_parts", setPendingParts)}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 bg-[#eab308] hover:bg-yellow-600 text-white text-xs font-bold uppercase rounded-sm shadow-sm">Pending Parts</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-xl font-normal text-gray-700 pb-2 border-b">Pending Parts</DialogTitle></DialogHeader>
              <Input placeholder="Search Project / Part" className="mb-4" />
              <table className="w-full text-left text-sm border">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-3 border-r font-bold">Project Name</th><th className="p-3 border-r font-bold">Part Name</th><th className="p-3 font-bold w-32">Pending Quantity</th></tr>
                </thead>
                <tbody className="divide-y">
                  {modalLoading ? <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr> : pendingParts.length === 0 ? <tr><td colSpan={3} className="p-4 text-center">No data found in Supabase (add to pending_parts table)</td></tr> : pendingParts.map(row => (
                    <tr key={row.id}><td className="p-3 border-r">{row.project_name}</td><td className="p-3 border-r">{row.part_name}</td><td className="p-3">{row.pending_quantity}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end"><DialogClose asChild><Button className="bg-[#6b7280] hover:bg-gray-700 text-white">Close</Button></DialogClose></div>
            </DialogContent>
          </Dialog>

          <Dialog onOpenChange={(open) => open && fetchModalData("pending_projects", setPendingProjects)}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 bg-[#1f2937] hover:bg-gray-800 text-white text-xs font-bold uppercase rounded-sm shadow-sm">Pending Project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-xl font-normal text-gray-700 pb-2 border-b">Pending Projects</DialogTitle></DialogHeader>
              <Input placeholder="Search Project" className="mb-4" />
              <table className="w-full text-left text-sm border">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-3 border-r font-bold">Project Name</th><th className="p-3 font-bold w-48">Pending Quantity</th></tr>
                </thead>
                <tbody className="divide-y">
                  {modalLoading ? <tr><td colSpan={2} className="p-4 text-center">Loading...</td></tr> : pendingProjects.length === 0 ? <tr><td colSpan={2} className="p-4 text-center">No data found in Supabase (add to pending_projects table)</td></tr> : pendingProjects.map(row => (
                    <tr key={row.id}><td className="p-3 border-r">{row.project_name}</td><td className="p-3">{row.pending_quantity}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end"><DialogClose asChild><Button className="bg-[#6b7280] hover:bg-gray-700 text-white">Close</Button></DialogClose></div>
            </DialogContent>
          </Dialog>

          <Button className="h-8 px-4 bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-bold uppercase rounded-sm shadow-sm" onClick={() => navigate({ to: "/quotes" })}>Quote</Button>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Category:</span>
            <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
              <SelectTrigger className="h-9 w-48 text-sm"><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="JOBWORK GOODS">JOBWORK GOODS</SelectItem>
                <SelectItem value="STANDARD GOODS">STANDARD GOODS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Date:</span>
            <Input type="date" className="h-9 w-40 text-sm" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Project:</span>
            <Select value={newEntry.projectName} onValueChange={(v) => setNewEntry({ ...newEntry, projectName: v })}>
              <SelectTrigger className="h-9 w-48 text-sm"><SelectValue placeholder="Select Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Project Alpha">Project Alpha</SelectItem>
                <SelectItem value="Project Beta">Project Beta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Max: -</span>
            <span className="text-sm font-medium text-slate-700">Quantity:</span>
            <Input type="number" className="h-9 w-24 text-sm" value={newEntry.quantity} onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {parts.map((part, index) => (
            <div key={index} className="flex flex-wrap items-center gap-3">
              <Select value={part.partName} onValueChange={(v) => updatePart(index, 'partName', v)}>
                <SelectTrigger className="h-9 w-64 text-sm"><SelectValue placeholder="Select Part" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVAL SHAFT - 19/08/2026 - 3">OVAL SHAFT - 19/08/2026 - 3</SelectItem>
                  <SelectItem value="ROUND SHAFT - 10/05/2026 - 1">ROUND SHAFT - 10/05/2026 - 1</SelectItem>
                </SelectContent>
              </Select>
              
              <Input type="number" placeholder="Quantity" className="h-9 w-32 text-sm" value={part.quantity} onChange={(e) => updatePart(index, 'quantity', e.target.value)} />
              
              <span className="text-xs text-slate-500 mx-2">Max: -</span>
              
              <Button size="icon" variant="outline" className="h-8 w-8 bg-[#3b82f6] hover:bg-blue-700 text-white rounded-sm border-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button className="h-8 px-4 bg-[#ef4444] hover:bg-red-700 text-white text-xs font-semibold rounded-sm" onClick={() => handleRemovePart(index)}>
                Delete
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pb-6 border-b border-gray-200">
          <Button className="h-9 px-4 bg-[#6b7280] hover:bg-gray-700 text-white text-sm font-medium rounded-sm" onClick={handleAddPart}>
            Add Part
          </Button>
          <Button className="h-9 px-6 bg-[#eab308] hover:bg-yellow-600 text-white text-sm font-medium rounded-sm" onClick={handleReset}>
            Clear
          </Button>
          <Button className="h-9 px-6 bg-[#3b82f6] hover:bg-blue-700 text-white text-sm font-medium rounded-sm" onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select defaultValue="All">
          <SelectTrigger className="h-9 w-48 text-sm bg-white"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent><SelectItem value="All">All Categories</SelectItem></SelectContent>
        </Select>
        <Select defaultValue="All">
          <SelectTrigger className="h-9 w-48 text-sm bg-white"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent><SelectItem value="All">All Projects</SelectItem></SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Start Date</span>
          <Input type="date" className="h-9 w-36 text-sm bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">End Date</span>
          <Input type="date" className="h-9 w-36 text-sm bg-white" />
        </div>
        <div className="ml-auto flex gap-2">
          <Button className="h-9 px-6 bg-[#3b82f6] hover:bg-blue-700 text-white font-medium rounded-sm">Filter</Button>
          <Button className="h-9 px-6 bg-[#64748b] hover:bg-slate-700 text-white font-medium rounded-sm">Clear</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white">
        <div className="flex items-center justify-between pb-2">
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

        <div className="overflow-x-auto border border-gray-200">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#c2c4d6] text-slate-800">
              <tr>
                {["Timestamp", "Category", "Date", "Project Name", "Quantity", "Part Name with Quantity", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3 font-semibold text-xs border-r border-[#a6a8bf] last:border-r-0 align-middle">
                    <div className="flex items-center justify-between gap-1">
                      {col}
                      <div className="flex flex-col text-[8px] leading-[8px] opacity-40">
                        <span>▲</span><span>▼</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700 bg-white">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row) => {
                  const partsString = row.parts?.map((p: any) => `${p.partName} - ${p.quantity}`).join(", ") || "-";
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 border-r border-gray-100">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-gray-100 uppercase">{row.category}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{row.date}</td>
                      <td className="px-4 py-3 border-r border-gray-100 uppercase">{row.project_name}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{row.quantity}</td>
                      <td className="px-4 py-3 border-r border-gray-100 uppercase">{partsString}</td>
                      <td className="px-4 py-2 border-r border-gray-100">
                        <div className="flex flex-col gap-1 w-[70px]">
                          <Button size="sm" className="h-7 w-full bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-medium rounded-sm shadow-none" onClick={() => handleEdit(row)}>Edit</Button>
                          <Button size="sm" className="h-7 w-full bg-[#ef4444] hover:bg-red-700 text-white text-xs font-medium rounded-sm shadow-none" onClick={() => handleDelete(row.id)}>Delete</Button>
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

