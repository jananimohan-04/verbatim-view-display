import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [{ title: "Quote | Argus" }],
  }),
  component: QuotesPage,
});

function QuotesPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");

  const [editingId, setEditingId] = useState<string | null>(null);

  const initialEntryState = {
    partyName: "",
    date: new Date().toISOString().split("T")[0],
  };

  const initialProjectState = { projectName: "", quantity: "", amount: "" };

  const [newEntry, setNewEntry] = useState(initialEntryState);
  const [projects, setProjects] = useState([{ ...initialProjectState }]);

  // Modal data states
  const [priceList, setPriceList] = useState<any[]>([]);
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
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
      partyName: row.party_name,
      date: row.date,
    });
    setProjects(row.projects && row.projects.length > 0 ? row.projects : [{ ...initialProjectState }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quote?")) return;
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Quote deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete quote");
    }
  };

  const handleAddProject = () => {
    setProjects([...projects, { ...initialProjectState }]);
  };

  const updateProject = (index: number, field: string, value: string) => {
    const newProjects = [...projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setProjects(newProjects);
  };

  const handleReset = () => {
    setNewEntry(initialEntryState);
    setProjects([{ ...initialProjectState }]);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!newEntry.partyName || !newEntry.date) {
      toast.error("Please fill party name and date.");
      return;
    }
    
    if (projects.some(p => !p.projectName || !p.quantity || !p.amount)) {
      toast.error("Please provide name, quantity, and amount for all projects.");
      return;
    }

    try {
      setSubmitting(true);

      let totalAmount = 0;
      const parsedProjects = projects.map(p => {
        const qty = parseInt(p.quantity) || 0;
        const amt = parseFloat(p.amount) || 0;
        totalAmount += (qty * amt);
        return {
          projectName: p.projectName,
          quantity: qty,
          amount: amt,
        };
      });

      const payload = {
        party_name: newEntry.partyName,
        date: newEntry.date,
        projects: parsedProjects,
        total_amount: totalAmount
      };

      let error;
      if (editingId) {
        const res = await supabase.from("quotes").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("quotes").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      
      toast.success(editingId ? "Quote updated" : "Quote saved");
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
        <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Quote</h1>
        <div className="flex flex-wrap gap-2">
          
          {/* Price List Modal */}
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
              <div className="mt-4 flex justify-end">
                <DialogClose asChild><Button className="bg-[#6b7280] hover:bg-gray-700 text-white">Close</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stock Details Modal */}
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
              <div className="mt-4 flex justify-end">
                <DialogClose asChild><Button className="bg-[#6b7280] hover:bg-gray-700 text-white">Close</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="h-8 px-4 bg-[#64748b] hover:bg-slate-600 text-white text-xs font-bold rounded-sm shadow-sm" onClick={() => navigate({ to: "/finished-goods" })}>Back To Finished Projects</Button>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Party Name:</span>
            <Select value={newEntry.partyName} onValueChange={(v) => setNewEntry({ ...newEntry, partyName: v })}>
              <SelectTrigger className="h-9 w-64 text-sm"><SelectValue placeholder="Select Party" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AABEE POLY PRODUCTS">AABEE POLY PRODUCTS</SelectItem>
                <SelectItem value="TVS MOTORS">TVS MOTORS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Date:</span>
            <Input type="date" className="h-9 w-40 text-sm" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {projects.map((project, index) => (
            <div key={index} className="flex flex-wrap items-center gap-3">
              <Select value={project.projectName} onValueChange={(v) => updateProject(index, 'projectName', v)}>
                <SelectTrigger className="h-9 w-64 text-sm"><SelectValue placeholder="Select Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEDGE CLAMP - 03/04/2026 - 39">WEDGE CLAMP - 03/04/2026 - 39</SelectItem>
                  <SelectItem value="CYLINDER HEAD - 10/05/2026 - 1">CYLINDER HEAD - 10/05/2026 - 1</SelectItem>
                </SelectContent>
              </Select>
              
              <Input type="number" placeholder="Quantity" className="h-9 w-32 text-sm" value={project.quantity} onChange={(e) => updateProject(index, 'quantity', e.target.value)} />
              <Input type="number" placeholder="Amount" className="h-9 w-32 text-sm" value={project.amount} onChange={(e) => updateProject(index, 'amount', e.target.value)} />
              
              <span className="text-xs text-slate-500 mx-2">Max: -</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pb-6 border-b border-gray-200 items-center">
          <Button className="h-9 px-4 bg-[#6b7280] hover:bg-gray-700 text-white text-sm font-medium rounded-sm" onClick={handleAddProject}>
            Add Project
          </Button>
          <Button variant="ghost" className="h-9 px-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Projects
          </Button>
          <Button className="h-9 px-6 bg-[#eab308] hover:bg-yellow-600 text-white text-sm font-medium rounded-sm ml-2" onClick={handleReset}>
            Clear
          </Button>
          <Button className="h-9 px-6 bg-[#3b82f6] hover:bg-blue-700 text-white text-sm font-medium rounded-sm" onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Update" : "Save"}
          </Button>
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
                {["Timestamp", "Party", "Date", "Project", "Quantity", "Amount", "Total", "Actions"].map((col) => (
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
                <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row) => {
                  const firstProject = row.projects && row.projects.length > 0 ? row.projects[0] : null;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 border-r border-gray-100">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-gray-100 uppercase">{row.party_name}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{row.date}</td>
                      <td className="px-4 py-3 border-r border-gray-100 uppercase">{firstProject ? firstProject.projectName : '-'}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{firstProject ? firstProject.quantity : '-'}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{firstProject ? firstProject.amount : '-'}</td>
                      <td className="px-4 py-3 border-r border-gray-100 font-bold">{row.total_amount}</td>
                      <td className="px-4 py-2 border-r border-gray-100">
                        <div className="flex flex-col gap-1 w-[70px]">
                          <Button size="sm" className="h-6 w-full bg-[#06b6d4] hover:bg-cyan-700 text-white text-xs font-medium rounded-sm shadow-none">View</Button>
                          <Button size="sm" className="h-6 w-full bg-[#3b82f6] hover:bg-blue-700 text-white text-xs font-medium rounded-sm shadow-none" onClick={() => handleEdit(row)}>Edit</Button>
                          <Button size="sm" className="h-6 w-full bg-[#ef4444] hover:bg-red-700 text-white text-xs font-medium rounded-sm shadow-none" onClick={() => handleDelete(row.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="p-3 border-t text-sm text-slate-600 flex justify-between items-center bg-gray-50">
            <span>Showing 1 to {filteredEntries.length} of {filteredEntries.length} entries</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 rounded-sm bg-transparent border-transparent">Previous</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 rounded-sm bg-white">1</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-sm bg-transparent border-transparent">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
