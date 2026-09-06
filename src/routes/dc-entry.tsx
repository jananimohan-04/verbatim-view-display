import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, RefreshCw, Save, Trash2, PenTool } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export const Route = createFileRoute("/dc-entry")({
  head: () => ({
    meta: [{ title: "Delivery Challan | Argus" }],
  }),
  component: DCEntryPage,
});

function DCEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");

  const [editingId, setEditingId] = useState<string | null>(null);

  const initialEntryState = {
    dcNo: "",
    date: new Date().toISOString().split("T")[0],
    partyName: "",
    partyAddress: "",
    partyGstin: "",
    partyCode: "",
    ewayBillNo: "",
    poNumber: "",
    placeOfSupply: "",
    packagingDetails: "",
    enquiryNo: "",
    vehicleNo: "",
    phoneNo: "",
    category: "",
    process: "",
    receiverName: "",
    senderName: "",
  };

  const initialPartState = { partName: "", hsn: "", quantity: "", unit: "NOS", price: "", amount: "" };

  const [newEntry, setNewEntry] = useState(initialEntryState);
  const [parts, setParts] = useState([{ ...initialPartState }]);

  // Modal data states
  const [categories, setCategories] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [enquiryNumbers, setEnquiryNumbers] = useState<any[]>([]);
  const [partsList, setPartsList] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newProcess, setNewProcess] = useState("");
  const [currentEnquiry, setCurrentEnquiry] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dc_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching DC entries:", error);
      toast.error("Failed to load DC data.");
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await supabase.from("dc_categories").insert([{ name: newCategory.trim() }]);
      toast.success("Category added");
      setNewCategory("");
      fetchModalData("dc_categories", setCategories);
    } catch (e) { toast.error("Failed to add category"); }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await supabase.from("dc_categories").delete().eq("id", id);
      toast.success("Category deleted");
      fetchModalData("dc_categories", setCategories);
    } catch (e) { toast.error("Failed to delete category"); }
  };

  const handleAddProcess = async () => {
    if (!newProcess.trim()) return;
    try {
      await supabase.from("dc_processes").insert([{ name: newProcess.trim() }]);
      toast.success("Process added");
      setNewProcess("");
      fetchModalData("dc_processes", setProcesses);
    } catch (e) { toast.error("Failed to add process"); }
  };

  const handleDeleteProcess = async (id: string) => {
    try {
      await supabase.from("dc_processes").delete().eq("id", id);
      toast.success("Process deleted");
      fetchModalData("dc_processes", setProcesses);
    } catch (e) { toast.error("Failed to delete process"); }
  };

  const handleSaveEnquiry = async () => {
    if (!currentEnquiry.trim()) return;
    try {
      await supabase.from("dc_enquiry_numbers").insert([{ number: currentEnquiry.trim() }]);
      toast.success("Enquiry number saved");
      setNewEntry({...newEntry, enquiryNo: currentEnquiry.trim()});
    } catch (e) { toast.error("Failed to save enquiry number"); }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setNewEntry({
      dcNo: row.dc_no || "",
      date: row.date,
      partyName: row.party_name,
      partyAddress: row.party_address || "",
      partyGstin: row.party_gstin || "",
      partyCode: row.party_code || "",
      ewayBillNo: row.eway_bill_no || "",
      poNumber: row.po_number || "",
      placeOfSupply: row.place_of_supply || "",
      packagingDetails: row.packaging_details || "",
      enquiryNo: row.enquiry_no || "",
      vehicleNo: row.vehicle_no || "",
      phoneNo: row.phone_no || "",
      category: row.category || "",
      process: row.process || "",
      receiverName: row.receiver_name || "",
      senderName: row.sender_name || "",
    });
    setParts(row.parts && row.parts.length > 0 ? row.parts : [{ ...initialPartState }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this DC?")) return;
    try {
      const { error } = await supabase.from("dc_entries").delete().eq("id", id);
      if (error) throw error;
      toast.success("DC deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete DC");
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
    // Auto calculate amount
    if (field === 'quantity' || field === 'price') {
      const qty = parseFloat(field === 'quantity' ? value : newParts[index].quantity) || 0;
      const price = parseFloat(field === 'price' ? value : newParts[index].price) || 0;
      newParts[index].amount = (qty * price).toString();
    }
    setParts(newParts);
  };

  const handleReset = () => {
    setNewEntry(initialEntryState);
    setParts([{ ...initialPartState }]);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!newEntry.dcNo || !newEntry.date || !newEntry.partyName) {
      toast.error("DC No, Date, and Party Name are required.");
      return;
    }
    
    if (parts.some(p => !p.partName)) {
      toast.error("Part Name is required for all parts.");
      return;
    }

    try {
      setSubmitting(true);

      const parsedParts = parts.map(p => ({
        partName: p.partName,
        hsn: p.hsn,
        quantity: parseInt(p.quantity) || 0,
        unit: p.unit,
        price: parseFloat(p.price) || 0,
        amount: parseFloat(p.amount) || 0,
      }));

      const payload = {
        dc_no: newEntry.dcNo,
        date: newEntry.date,
        party_name: newEntry.partyName,
        party_address: newEntry.partyAddress,
        party_gstin: newEntry.partyGstin,
        party_code: newEntry.partyCode,
        eway_bill_no: newEntry.ewayBillNo,
        po_number: newEntry.poNumber,
        place_of_supply: newEntry.placeOfSupply,
        packaging_details: newEntry.packagingDetails,
        enquiry_no: newEntry.enquiryNo,
        vehicle_no: newEntry.vehicleNo,
        phone_no: newEntry.phoneNo,
        category: newEntry.category,
        process: newEntry.process,
        parts: parsedParts,
        receiver_name: newEntry.receiverName,
        sender_name: newEntry.senderName,
      };

      let error;
      if (editingId) {
        const res = await supabase.from("dc_entries").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("dc_entries").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      
      toast.success(editingId ? "DC updated" : "DC saved");
      handleReset();
      fetchData();
    } catch (error: any) {
      console.error("Error saving entry:", error);
      toast.error(error.message || "Failed to save DC");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-black tracking-tight text-[#0f172a] uppercase font-sans">DELIVERY CHALLAN FORM</h1>
        <div className="flex flex-wrap gap-2">
          
          {/* Manage Categories Modal */}
          <Dialog onOpenChange={(open) => open && fetchModalData("dc_categories", setCategories)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm font-semibold text-slate-700 bg-[#f8fafc] hover:bg-slate-100 rounded-md shadow-sm border-gray-300">Manage Categories</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="text-xl font-bold text-[#0f172a]">Manage Categories</DialogTitle></DialogHeader>
              <div className="mt-2">
                <Input placeholder="Enter new category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="mb-2" />
                <Button variant="secondary" className="bg-[#f1f5f9] hover:bg-slate-200 text-slate-800 font-semibold mb-4" onClick={handleAddCategory}>Add</Button>
                <div className="border rounded-sm max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-white sticky top-0">
                      <tr><th className="p-3 border font-bold text-[#0f172a] text-center">Category</th><th className="p-3 border font-bold text-[#0f172a] text-center w-40">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {modalLoading ? <tr><td colSpan={2} className="p-4 text-center">Loading...</td></tr> : categories.map(row => (
                        <tr key={row.id}>
                          <td className="p-3 border text-[15px]">{row.name}</td>
                          <td className="p-2 border text-center">
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="outline" className="h-7 bg-[#f8fafc] text-[#4f46e5] border-gray-300"><Save className="w-3 h-3 mr-1" /> Save</Button>
                              <Button size="sm" variant="outline" className="h-7 bg-[#f8fafc] text-slate-700 border-gray-300" onClick={() => handleDeleteCategory(row.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-start">
                <DialogClose asChild><Button variant="outline" className="font-semibold text-slate-800 bg-[#f8fafc]">Close</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manage Processes Modal */}
          <Dialog onOpenChange={(open) => open && fetchModalData("dc_processes", setProcesses)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm font-semibold text-slate-700 bg-[#f8fafc] hover:bg-slate-100 rounded-md shadow-sm border-gray-300">Manage Processes</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="text-xl font-bold text-[#0f172a]">Manage Processes</DialogTitle></DialogHeader>
              <div className="mt-2">
                <Input placeholder="Enter new process" value={newProcess} onChange={e => setNewProcess(e.target.value)} className="mb-2" />
                <Button variant="secondary" className="bg-[#f1f5f9] hover:bg-slate-200 text-slate-800 font-semibold mb-4" onClick={handleAddProcess}>Add</Button>
                <div className="border rounded-sm max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-white sticky top-0">
                      <tr><th className="p-3 border font-bold text-[#0f172a] text-center">Process</th><th className="p-3 border font-bold text-[#0f172a] text-center w-40">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {modalLoading ? <tr><td colSpan={2} className="p-4 text-center">Loading...</td></tr> : processes.map(row => (
                        <tr key={row.id}>
                          <td className="p-3 border text-[15px]">{row.name}</td>
                          <td className="p-2 border text-center">
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="outline" className="h-7 bg-[#f8fafc] text-[#4f46e5] border-gray-300"><Save className="w-3 h-3 mr-1" /> Save</Button>
                              <Button size="sm" variant="outline" className="h-7 bg-[#f8fafc] text-slate-700 border-gray-300" onClick={() => handleDeleteProcess(row.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-start">
                <DialogClose asChild><Button variant="outline" className="font-semibold text-slate-800 bg-[#f8fafc]">Close</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Enquiry Number Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm font-semibold text-slate-700 bg-[#f8fafc] hover:bg-slate-100 rounded-md shadow-sm border-gray-300">Enquiry Number</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="text-2xl font-bold text-[#0f172a]">Enquiry Number</DialogTitle></DialogHeader>
              <div className="mt-4">
                <label className="text-lg text-slate-800 mb-2 block">Current Enquiry Number:</label>
                <Input value={currentEnquiry} onChange={e => setCurrentEnquiry(e.target.value)} className="h-12 text-2xl font-bold text-center border-gray-400 rounded-md" />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" className="bg-[#f8fafc] font-semibold text-blue-600"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
                <Button className="bg-[#2563eb] hover:bg-blue-700 font-semibold" onClick={handleSaveEnquiry}><Save className="w-4 h-4 mr-2" /> Save</Button>
                <DialogClose asChild><Button variant="outline" className="font-semibold text-slate-800 bg-[#f8fafc]">Close</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Part Name List Modal */}
          <Dialog onOpenChange={(open) => open && fetchModalData("dc_parts_list", setPartsList)}>
            <DialogTrigger asChild>
              <Button className="h-9 px-6 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-sm">Part Name List</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-xl font-bold text-center text-[#0f172a] mb-4">Part Name List</DialogTitle></DialogHeader>
              
              <div className="bg-[#fef9c3] border border-[#fef08a] rounded-sm p-3 mb-4 font-bold text-slate-800 uppercase text-sm">
                PROJECT NAME FROM FINISHED GOODS
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Show</span>
                  <Select defaultValue="10"><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem></SelectContent></Select>
                  <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Search:</span>
                  <Input className="h-8 w-64" />
                </div>
              </div>

              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 font-semibold">Part Name</th>
                    <th className="p-3 font-semibold text-center">Sum Quantity</th>
                    <th className="p-3 font-semibold text-center">Sent By DC</th>
                    <th className="p-3 font-semibold text-center">Balance Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {modalLoading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> : partsList.length === 0 ? <tr><td colSpan={4} className="p-4 text-center">No data found in Supabase (add to dc_parts_list table)</td></tr> : partsList.map((row, i) => (
                    <tr key={row.id} className={i % 2 === 0 ? "bg-[#fef9c3]/40" : "bg-[#fef9c3]/70"}>
                      <td className="p-3 border-r border-[#fef08a]">{row.part_name}</td>
                      <td className="p-3 border-r border-[#fef08a] text-center">{row.sum_quantity}</td>
                      <td className="p-3 border-r border-[#fef08a] text-center">{row.sent_by_dc}</td>
                      <td className="p-3 text-center">{row.balance_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 flex justify-between items-center text-sm text-slate-600">
                <span>Showing 1 to {partsList.length} of {partsList.length} entries</span>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild><Button variant="outline" className="bg-[#f8fafc] font-semibold text-slate-800">Close</Button></DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Entry Form Card */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8 shadow-sm">
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-4 mb-4">
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">DC No</label>
            <Input className="h-9" value={newEntry.dcNo} onChange={(e) => setNewEntry({ ...newEntry, dcNo: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Date<span className="text-red-500">*</span></label>
            <Input type="date" className="h-9" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Party Name<span className="text-red-500">*</span></label>
            <Select value={newEntry.partyName} onValueChange={(v) => setNewEntry({ ...newEntry, partyName: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select or type to search" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sundaram Auto Components">Sundaram Auto Components</SelectItem>
                <SelectItem value="Vantage Hydraulics">Vantage Hydraulics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Party Address</label>
            <Input className="h-9" value={newEntry.partyAddress} onChange={(e) => setNewEntry({ ...newEntry, partyAddress: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Party GSTIN</label>
            <Input className="h-9" value={newEntry.partyGstin} onChange={(e) => setNewEntry({ ...newEntry, partyGstin: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-4 mb-4">
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Party Code</label>
            <Input className="h-9" value={newEntry.partyCode} onChange={(e) => setNewEntry({ ...newEntry, partyCode: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">E-Way Bill No</label>
            <Input className="h-9" value={newEntry.ewayBillNo} onChange={(e) => setNewEntry({ ...newEntry, ewayBillNo: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">PO Number</label>
            <Input className="h-9" value={newEntry.poNumber} onChange={(e) => setNewEntry({ ...newEntry, poNumber: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Place of Supply</label>
            <Input className="h-9" value={newEntry.placeOfSupply} onChange={(e) => setNewEntry({ ...newEntry, placeOfSupply: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Packaging Details</label>
            <Input className="h-9" value={newEntry.packagingDetails} onChange={(e) => setNewEntry({ ...newEntry, packagingDetails: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-4 mb-6">
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Enquiry No</label>
            <Input className="h-9" value={newEntry.enquiryNo} onChange={(e) => setNewEntry({ ...newEntry, enquiryNo: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Vehicle No</label>
            <Input className="h-9" value={newEntry.vehicleNo} onChange={(e) => setNewEntry({ ...newEntry, vehicleNo: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Phone No</label>
            <Input className="h-9" value={newEntry.phoneNo} onChange={(e) => setNewEntry({ ...newEntry, phoneNo: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
            <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="JOBWORK">JOBWORK</SelectItem>
                <SelectItem value="SALES">SALES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Process</label>
            <Select value={newEntry.process} onValueChange={(v) => setNewEntry({ ...newEntry, process: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select Process" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Hardening">Hardening</SelectItem>
                <SelectItem value="Polishing">Polishing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Parts Section */}
        <div className="space-y-4 mb-4">
          {parts.map((part, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-x-4 items-end">
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Part Name {index + 1}<span className="text-red-500">*</span></label>
                <Select value={part.partName} onValueChange={(v) => updatePart(index, 'partName', v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select or type to search" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OVAL SHAFT">OVAL SHAFT</SelectItem>
                    <SelectItem value="CONNECTING NUT">CONNECTING NUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">HSN</label>
                <Input className="h-9" value={part.hsn} onChange={(e) => updatePart(index, 'hsn', e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Quantity</label>
                <Input type="number" className="h-9" value={part.quantity} onChange={(e) => updatePart(index, 'quantity', e.target.value)} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Unit</label>
                <Select value={part.unit} onValueChange={(v) => updatePart(index, 'unit', v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="NOS" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOS">NOS</SelectItem>
                    <SelectItem value="KGS">KGS</SelectItem>
                    <SelectItem value="PCS">PCS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Price</label>
                <Input type="number" className="h-9" value={part.price} onChange={(e) => updatePart(index, 'price', e.target.value)} />
              </div>
              <div className="col-span-1 flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Amount</label>
                  <Input type="number" className="h-9 bg-gray-50" value={part.amount} readOnly />
                </div>
                {parts.length > 1 && (
                  <Button variant="outline" size="icon" className="h-9 w-9 text-red-500 mt-6" onClick={() => handleRemovePart(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-8">
          <Button variant="outline" className="h-9 px-4 bg-[#f8fafc] text-slate-700 font-semibold border-gray-300 rounded-md" onClick={handleAddPart}>
            Add Part
          </Button>
          <Button variant="outline" className="h-9 px-4 bg-[#f8fafc] text-slate-700 font-semibold border-gray-300 rounded-md">
            <RefreshCw className="h-4 w-4 mr-2 text-blue-500" /> Refresh Parts
          </Button>
        </div>

        {/* Signature Section */}
        <div className="flex flex-col lg:flex-row items-center gap-6 mb-8 pt-4">
          <span className="text-[17px] font-normal text-slate-800">Signature:</span>
          
          <div className="flex flex-wrap items-center gap-2 border border-gray-200 rounded-md p-1 bg-[#fafafa]">
            <Input placeholder="Receiver Name" className="h-9 w-40 bg-white" value={newEntry.receiverName} onChange={(e) => setNewEntry({...newEntry, receiverName: e.target.value})} />
            <Button variant="outline" className="h-9 bg-[#f1f5f9] text-slate-800 font-semibold text-xs border-gray-300"><PenTool className="w-3 h-3 mr-1 text-orange-500" /> Customer</Button>
            <Button variant="outline" className="h-9 bg-white text-slate-700 font-semibold text-xs border-gray-300">Clear</Button>
            <Button variant="outline" className="h-9 bg-transparent border-transparent text-gray-400 text-xs shadow-none hover:bg-transparent" disabled>No signature</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border border-gray-200 rounded-md p-1 bg-[#fafafa]">
            <Input placeholder="Sender Name" className="h-9 w-40 bg-white" value={newEntry.senderName} onChange={(e) => setNewEntry({...newEntry, senderName: e.target.value})} />
            <Button variant="outline" className="h-9 bg-[#f1f5f9] text-slate-800 font-semibold text-xs border-gray-300"><PenTool className="w-3 h-3 mr-1 text-orange-500" /> Authorized</Button>
            <Button variant="outline" className="h-9 bg-white text-slate-700 font-semibold text-xs border-gray-300">Clear</Button>
            <Button variant="outline" className="h-9 bg-transparent border-transparent text-gray-400 text-xs shadow-none hover:bg-transparent" disabled>No signature</Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button className="h-10 px-6 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm" onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Update" : "Save"}
          </Button>
          <Button variant="outline" className="h-10 px-6 bg-white text-slate-800 font-bold border-gray-300 rounded-lg shadow-sm" onClick={handleReset}>
            Clear
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800">Category</span>
          <Select defaultValue="All">
            <SelectTrigger className="h-9 w-40 text-sm bg-white"><SelectValue placeholder="Select Categories" /></SelectTrigger>
            <SelectContent><SelectItem value="All">All Categories</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800">DC No</span>
          <Input placeholder="Search DC No" className="h-9 w-40 text-sm bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800">Party Name</span>
          <Select defaultValue="All">
            <SelectTrigger className="h-9 w-24 text-sm bg-white"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent><SelectItem value="All">All</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800">Status</span>
          <Select defaultValue="All">
            <SelectTrigger className="h-9 w-24 text-sm bg-white"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent><SelectItem value="All">All</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800">From</span>
          <Input type="date" className="h-9 w-36 text-sm bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-800">To</span>
          <Input type="date" className="h-9 w-36 text-sm bg-white" />
        </div>
        
        <Button variant="outline" className="h-9 px-6 bg-white text-slate-800 font-bold border-gray-300 rounded-md">Filter</Button>
        <Button variant="outline" className="h-9 px-6 bg-white text-slate-800 font-bold border-gray-300 rounded-md">Reset</Button>
      </div>

      {/* Table Section */}
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
            <thead className="bg-[#007bff] text-white">
              <tr>
                {["Timestamp", "DC No", "Date", "Party Name", "Category", "Part Name 1", "Qty 1", "Status", "Actions"].map((col) => (
                  <th key={col} className="px-3 py-3 font-bold text-xs border-r border-[#3b82f6] last:border-r-0 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {col}
                      <div className="flex flex-col text-[8px] leading-[8px] opacity-70">
                        <span>▲</span><span>▼</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700 bg-white">
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row) => {
                  const firstPart = row.parts && row.parts.length > 0 ? row.parts[0] : null;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 text-center">
                      <td className="px-3 py-3 border-r border-gray-200">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-3 py-3 border-r border-gray-200">{row.dc_no}</td>
                      <td className="px-3 py-3 border-r border-gray-200">{row.date}</td>
                      <td className="px-3 py-3 border-r border-gray-200 uppercase">{row.party_name}</td>
                      <td className="px-3 py-3 border-r border-gray-200">{row.category}</td>
                      <td className="px-3 py-3 border-r border-gray-200 uppercase">{firstPart ? firstPart.partName : '-'}</td>
                      <td className="px-3 py-3 border-r border-gray-200">{firstPart ? firstPart.quantity : '-'}</td>
                      <td className="px-3 py-3 border-r border-gray-200"></td>
                      <td className="px-3 py-2 border-r border-gray-200">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-full bg-[#f8fafc] border-gray-300 text-red-800">
                            <span className="text-[10px] font-black tracking-tighter">O</span>
                          </Button>
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-full bg-[#f8fafc] border-gray-300 text-orange-500" onClick={() => handleEdit(row)}>
                            <PenTool className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-full bg-[#f8fafc] border-gray-300 text-gray-500" onClick={() => handleDelete(row.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
