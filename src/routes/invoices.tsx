import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [{ title: "Billing System | Argus" }],
  }),
  component: BillingSystemPage,
});

function BillingSystemPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialEntryState = {
    documentType: "Sales Invoice",
    documentNo: "",
    customer: "",
    dcNo: "",
    poNo: "",
    date: new Date().toISOString().split("T")[0],
    cgst: "0",
    sgst: "0",
    igst: "0",
  };
  const [newEntry, setNewEntry] = useState(initialEntryState);

  const initialPartState = { description: "", customDesc: "", hsn: "", qty: "", unit: "NOS", price: "" };
  const [items, setItems] = useState([{ ...initialPartState }]);

  // Modals Data State
  const [docNumbers, setDocNumbers] = useState<any[]>([]);
  const [hsnMaster, setHsnMaster] = useState<any[]>([]);
  const [dcDetails, setDcDetails] = useState<any[]>([]);
  const [salesPriceHistory, setSalesPriceHistory] = useState<any[]>([]);
  
  const fetchSalesPriceHistory = async () => {
    const { data } = await supabase.from("sales_price_history").select("*").order("created_at", { ascending: false });
    if (data) setSalesPriceHistory(data);
  };
  
  // We'll mock stock details using price_list or finished_goods data if needed, or just a dummy array for the UI perfect match
  const stockDetails = [
    { id: 1, desc: "1222641 - 04/08/2026 - 3", qty: 3 },
    { id: 2, desc: "8 CAM SAMPLE - 01/04/2026 - 11", qty: 11 },
    { id: 3, desc: "ADJUSTMENT BLOCK - 17/04/2026 - 500", qty: 144 },
    { id: 4, desc: "ADJUSTMENT BLOCK - 22/05/2026 - 500", qty: 500 },
  ];

  // HSN Master form
  const [newHsnCode, setNewHsnCode] = useState("");
  const [newHsnDetail, setNewHsnDetail] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDocNumbers = async () => {
    const { data } = await supabase.from("document_numbers").select("*").order("id");
    if (data) setDocNumbers(data);
  };

  const fetchHsnMaster = async () => {
    const { data } = await supabase.from("hsn_master").select("*").order("created_at", { ascending: false });
    if (data) setHsnMaster(data);
  };

  const fetchDcDetails = async () => {
    const { data } = await supabase.from("dc_details_billing").select("*").order("created_at", { ascending: false });
    if (data) setDcDetails(data);
  };

  const handleUpdateDocNumber = async (id: string, value: string) => {
    try {
      await supabase.from("document_numbers").update({ value }).eq("id", id);
      toast.success("Document number updated");
      fetchDocNumbers();
    } catch (e) { toast.error("Failed to update doc number"); }
  };

  const handleAddHsn = async () => {
    if (!newHsnCode.trim()) return;
    try {
      await supabase.from("hsn_master").insert([{ hsn_code: newHsnCode, detail: newHsnDetail }]);
      toast.success("HSN added");
      setNewHsnCode("");
      setNewHsnDetail("");
      fetchHsnMaster();
    } catch (e) { toast.error("Failed to add HSN"); }
  };

  const handleDeleteHsn = async (id: string) => {
    try {
      await supabase.from("hsn_master").delete().eq("id", id);
      toast.success("HSN deleted");
      fetchHsnMaster();
    } catch (e) { toast.error("Failed to delete HSN"); }
  };

  const handleUpdateDcInvoice = async (id: string, invoice_no: string) => {
    try {
      await supabase.from("dc_details_billing").update({ invoice_no }).eq("id", id);
      toast.success("DC Invoice No updated");
      fetchDcDetails();
    } catch (e) { toast.error("Failed to update DC"); }
  };

  const handleAddItem = () => {
    setItems([...items, { ...initialPartState }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleReset = () => {
    setNewEntry(initialEntryState);
    setItems([{ ...initialPartState }]);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!newEntry.documentNo || !newEntry.customer) {
      toast.error("Document Number and Customer are required");
      return;
    }

    try {
      setSubmitting(true);
      
      let basicValue = 0;
      const parsedItems = items.map(item => {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.price) || 0;
        basicValue += (qty * price);
        return { ...item, qty, price };
      });

      // Calculate total amount with taxes
      const cgstPct = parseFloat(newEntry.cgst) || 0;
      const sgstPct = parseFloat(newEntry.sgst) || 0;
      const igstPct = parseFloat(newEntry.igst) || 0;
      
      const taxAmount = basicValue * ((cgstPct + sgstPct + igstPct) / 100);
      const totalAmount = basicValue + taxAmount;

      const payload = {
        document_type: newEntry.documentType,
        document_no: newEntry.documentNo,
        customer: newEntry.customer,
        dc_no: newEntry.dcNo,
        po_no: newEntry.poNo,
        date: newEntry.date,
        cgst: cgstPct,
        sgst: sgstPct,
        igst: igstPct,
        items: parsedItems,
        basic_value: basicValue,
        total_amount: totalAmount,
      };

      let error;
      if (editingId) {
        const res = await supabase.from("invoices").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("invoices").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      
      toast.success(editingId ? "Invoice updated" : "Invoice saved");
      handleReset();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setNewEntry({
      documentType: row.document_type || "Sales Invoice",
      documentNo: row.document_no || "",
      customer: row.customer || "",
      dcNo: row.dc_no || "",
      poNo: row.po_no || "",
      date: row.date,
      cgst: row.cgst?.toString() || "0",
      sgst: row.sgst?.toString() || "0",
      igst: row.igst?.toString() || "0",
    });
    setItems(row.items && row.items.length > 0 ? row.items : [{ ...initialPartState }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await supabase.from("invoices").delete().eq("id", id);
      toast.success("Invoice deleted");
      fetchData();
    } catch (e) { toast.error("Failed to delete invoice"); }
  };

  const filteredEntries = entries.filter((e) =>
    Object.values(e).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-white">
      
      {/* Top Bar */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <h1 className="text-2xl font-bold text-[#333333] tracking-tight">Billing System</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Doc No Modal */}
          <Dialog onOpenChange={(open) => open && fetchDocNumbers()}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm text-gray-700 bg-white border-gray-300 rounded-sm">Doc No</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4 text-black">Document Numbers</DialogTitle></DialogHeader>
              <div className="grid grid-cols-12 gap-2 mb-2 font-bold text-sm text-black">
                <div className="col-span-4">Type</div>
                <div className="col-span-5 text-center">Value</div>
                <div className="col-span-3 text-center">Action</div>
              </div>
              <div className="space-y-2 mb-6">
                {docNumbers.map((doc, idx) => (
                  <div key={doc.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 text-sm text-black">{doc.type}</div>
                    <div className="col-span-5">
                      <Input className="h-8 border-gray-400 rounded-sm w-full text-black" defaultValue={doc.value} 
                        onChange={(e) => {
                          const newDocs = [...docNumbers];
                          newDocs[idx].tempValue = e.target.value;
                          setDocNumbers(newDocs);
                        }} 
                      />
                    </div>
                    <div className="col-span-3 text-center">
                      <Button variant="outline" className="h-8 px-3 border-gray-400 bg-[#f4f4f4] text-black rounded-sm"
                        onClick={() => handleUpdateDocNumber(doc.id, doc.tempValue || doc.value)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-300 pt-4 space-y-2 text-sm text-black">
                <div className="grid grid-cols-12"><div className="col-span-6">Sales Prefix</div><div className="col-span-6">S</div></div>
                <div className="grid grid-cols-12"><div className="col-span-6">Proforma Prefix</div><div className="col-span-6">P</div></div>
                <div className="grid grid-cols-12"><div className="col-span-6">Quotation Prefix</div><div className="col-span-6">Q</div></div>
                <div className="grid grid-cols-12"><div className="col-span-6">Credit Prefix</div><div className="col-span-6">C</div></div>
                <div className="grid grid-cols-12"><div className="col-span-6">Estimation Prefix</div><div className="col-span-6">E</div></div>
              </div>
              
              <div className="mt-6 flex">
                <DialogClose asChild><Button variant="outline" className="border-gray-400 bg-[#f4f4f4] text-black rounded-sm">Close</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stock Details Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm text-gray-700 bg-white border-gray-300 rounded-sm">Stock Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4 text-black">Stock Details</DialogTitle></DialogHeader>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>Show</span>
                  <Select defaultValue="10"><SelectTrigger className="w-16 h-8 border-gray-300"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem></SelectContent></Select>
                  <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Search:</span><Input className="h-8 w-48 border-gray-300" />
                </div>
              </div>
              <div className="border border-gray-300 rounded-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f4f4f4] border-b border-gray-300">
                    <tr><th className="p-2 border-r font-bold">Description</th><th className="p-2 font-bold w-24">Qty</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockDetails.map(item => (
                      <tr key={item.id}>
                        <td className="p-2 border-r">{item.desc}</td>
                        <td className="p-2">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <span>Showing 1 to {stockDetails.length} of {stockDetails.length} entries</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 text-gray-500">Previous</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 bg-white border-gray-300">1</Button>
                  <Button variant="ghost" size="sm" className="h-8 text-gray-500">Next</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* DC Details Modal */}
          <Dialog onOpenChange={(open) => open && fetchDcDetails()}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm text-gray-700 bg-white border-gray-300 rounded-sm">DC Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4 text-black">DC Details</DialogTitle></DialogHeader>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>Show</span>
                  <Select defaultValue="10"><SelectTrigger className="w-16 h-8 border-gray-300"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem></SelectContent></Select>
                  <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Search:</span><Input className="h-8 w-48 border-gray-300" />
                </div>
              </div>
              <div className="border border-gray-200 rounded-sm overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-[#f9fafb] border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-3 font-bold border-r">Type</th>
                      <th className="p-3 font-bold border-r">DC Number</th>
                      <th className="p-3 font-bold border-r">Date</th>
                      <th className="p-3 font-bold border-r">Party Name</th>
                      <th className="p-3 font-bold border-r">Category</th>
                      <th className="p-3 font-bold border-r">Part Name</th>
                      <th className="p-3 font-bold border-r">Quantity</th>
                      <th className="p-3 font-bold w-48 text-center">Invoice No</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-600">
                    {dcDetails.map((dc, i) => (
                      <tr key={dc.id} className="hover:bg-slate-50">
                        <td className="p-3 border-r">{dc.type}</td>
                        <td className="p-3 border-r">{dc.dc_number}</td>
                        <td className="p-3 border-r">{dc.date}</td>
                        <td className="p-3 border-r uppercase">{dc.party_name}</td>
                        <td className="p-3 border-r uppercase">{dc.category}</td>
                        <td className="p-3 border-r uppercase">{dc.part_name}</td>
                        <td className="p-3 border-r">{dc.quantity}</td>
                        <td className="p-2 flex gap-2">
                          <Input className="h-8 border-gray-400" defaultValue={dc.invoice_no} 
                            onChange={(e) => {
                              const newDcs = [...dcDetails];
                              newDcs[i].tempInvoice = e.target.value;
                              setDcDetails(newDcs);
                            }} 
                          />
                          <Button variant="outline" className="h-8 px-3 border-gray-400 text-black bg-white rounded-sm"
                            onClick={() => handleUpdateDcInvoice(dc.id, dc.tempInvoice || dc.invoice_no)}>Save</Button>
                        </td>
                      </tr>
                    ))}
                    {dcDetails.length === 0 && <tr><td colSpan={8} className="p-4 text-center">No DC details found. Add mock data to dc_details_billing table.</td></tr>}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>

          {/* HSN Master Modal */}
          <Dialog onOpenChange={(open) => open && fetchHsnMaster()}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm text-gray-700 bg-white border-gray-300 rounded-sm">HSN Master</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4 text-black">HSN Master</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-3 mb-4">
                <Input placeholder="HSN Code" className="h-9 border-gray-400 text-black rounded-sm max-w-[200px]" value={newHsnCode} onChange={e => setNewHsnCode(e.target.value)} />
                <Input placeholder="HSN Detail" className="h-9 border-gray-400 text-black rounded-sm max-w-[200px]" value={newHsnDetail} onChange={e => setNewHsnDetail(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" className="h-8 px-4 border-gray-400 bg-[#f4f4f4] text-black rounded-sm" onClick={handleAddHsn}>Add</Button>
                  <DialogClose asChild><Button variant="outline" className="h-8 px-4 border-gray-400 bg-[#f4f4f4] text-black rounded-sm">Close</Button></DialogClose>
                </div>
              </div>
              <hr className="border-gray-400 mb-4" />
              <table className="w-full text-sm text-left">
                <thead>
                  <tr><th className="pb-2 font-bold text-black">HSN</th><th className="pb-2 font-bold text-black">Detail</th><th className="pb-2 font-bold text-black text-right pr-4">Delete</th></tr>
                </thead>
                <tbody className="text-black">
                  {hsnMaster.map(h => (
                    <tr key={h.id}>
                      <td className="py-2">{h.hsn_code}</td>
                      <td className="py-2 uppercase">{h.detail}</td>
                      <td className="py-2 text-right">
                        <Button variant="outline" className="h-7 px-3 border-gray-400 bg-[#f4f4f4] text-black rounded-sm" onClick={() => handleDeleteHsn(h.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DialogContent>
          </Dialog>

          {/* Sales Price History Modal */}
          <Dialog onOpenChange={(open) => open && fetchSalesPriceHistory()}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 px-4 text-sm text-gray-700 bg-white border-gray-300 rounded-sm">Sales Price History</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-6">
              <DialogHeader className="flex flex-row justify-between items-center mb-4 border-b pb-4">
                <DialogTitle className="text-xl font-bold text-black">Sales Price History</DialogTitle>
                <DialogClose asChild><Button variant="outline" className="h-8 px-4 border-gray-300 bg-[#f4f4f4] text-black rounded-sm">Close</Button></DialogClose>
              </DialogHeader>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm text-black">
                  <span>Show</span>
                  <Select defaultValue="25"><SelectTrigger className="w-16 h-8 border-gray-300"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="25">25</SelectItem></SelectContent></Select>
                  <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-black">
                  <span>Search:</span><Input className="h-8 w-48 border-gray-300" />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b border-gray-300 sticky top-0">
                    <tr>
                      <th className="p-2 font-bold text-black border-r">Customer Name <span className="text-[10px] text-gray-400">▲▼</span></th>
                      <th className="p-2 font-bold text-black border-r">Description <span className="text-[10px] text-gray-400">▲▼</span></th>
                      <th className="p-2 font-bold text-black text-right">Price <span className="text-[10px] text-gray-400">▲▼</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesPriceHistory.map((h, i) => (
                      <tr key={h.id} className={i % 2 === 0 ? "bg-[#f4f4f4]" : "bg-white"}>
                        <td className="p-2 border-r uppercase">{h.customer_name}</td>
                        <td className="p-2 border-r uppercase">{h.description}</td>
                        <td className="p-2 text-right">{h.price}</td>
                      </tr>
                    ))}
                    {salesPriceHistory.length === 0 && <tr><td colSpan={3} className="p-4 text-center">No history found. Add mock data to sales_price_history table.</td></tr>}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="bg-[#f5f5f5] p-4 sm:p-6 mb-8 border-b border-gray-200">
        
        {/* Top Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="col-span-1 lg:col-span-1">
            <label className="text-xs text-gray-600 block mb-1">Document Type<span className="text-red-500">*</span></label>
            <Select value={newEntry.documentType} onValueChange={v => setNewEntry({...newEntry, documentType: v})}>
              <SelectTrigger className="h-8 bg-white border-gray-300 rounded-sm text-xs"><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="Sales Invoice">Sales Invoice</SelectItem><SelectItem value="Proforma Invoice">Proforma Invoice</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="col-span-1 lg:col-span-1">
            <label className="text-xs text-gray-600 block mb-1">Document Number<span className="text-red-500">*</span></label>
            <Input className="h-8 bg-white border-gray-300 rounded-sm text-xs" value={newEntry.documentNo} onChange={e => setNewEntry({...newEntry, documentNo: e.target.value})} />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <label className="text-xs text-gray-600 block mb-1">Party Name<span className="text-red-500">*</span></label>
            <Select value={newEntry.customer} onValueChange={v => setNewEntry({...newEntry, customer: v})}>
              <SelectTrigger className="h-8 bg-white border-gray-300 rounded-sm text-xs"><SelectValue placeholder="Select customer"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="SRI RAGAVA PATTERN WORKS">SRI RAGAVA PATTERN WORKS</SelectItem>
                <SelectItem value="L.G BALAKRISHNAN & BROS LIMITED">L.G BALAKRISHNAN & BROS LIMITED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 lg:col-span-1">
            <label className="text-xs text-gray-600 block mb-1">DC Number</label>
            <Input placeholder="Enter DC Number" className="h-8 bg-white border-gray-300 rounded-sm text-xs" value={newEntry.dcNo} onChange={e => setNewEntry({...newEntry, dcNo: e.target.value})} />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <label className="text-xs text-gray-600 block mb-1">PO Number</label>
            <Input className="h-8 bg-white border-gray-300 rounded-sm text-xs" value={newEntry.poNo} onChange={e => setNewEntry({...newEntry, poNo: e.target.value})} />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <label className="text-xs text-gray-600 block mb-1">Date<span className="text-red-500">*</span></label>
            <Input type="date" className="h-8 bg-white border-gray-300 rounded-sm text-xs" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
          </div>
          <div className="col-span-1 lg:col-span-1 flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-600 block mb-1">CGST (%)</label>
              <Select value={newEntry.cgst} onValueChange={v => setNewEntry({...newEntry, cgst: v})}>
                <SelectTrigger className="h-8 bg-white border-gray-300 rounded-sm text-xs px-2"><SelectValue placeholder="Select"/></SelectTrigger>
                <SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="9">9</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 block mb-1">SGST (%)</label>
              <Select value={newEntry.sgst} onValueChange={v => setNewEntry({...newEntry, sgst: v})}>
                <SelectTrigger className="h-8 bg-white border-gray-300 rounded-sm text-xs px-2"><SelectValue placeholder="Select"/></SelectTrigger>
                <SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="9">9</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 block mb-1">IGST (%)</label>
              <Select value={newEntry.igst} onValueChange={v => setNewEntry({...newEntry, igst: v})}>
                <SelectTrigger className="h-8 bg-white border-gray-300 rounded-sm text-xs px-2"><SelectValue placeholder="Select"/></SelectTrigger>
                <SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="18">18</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dynamic Items Row */}
        <div className="space-y-3 mb-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-gray-800 w-12">Item {idx + 1}</span>
              
              <Select value={item.description} onValueChange={v => updateItem(idx, 'description', v)}>
                <SelectTrigger className="h-8 w-48 bg-white border-gray-300 rounded-sm text-xs text-gray-500"><SelectValue placeholder="Select Description"/></SelectTrigger>
                <SelectContent><SelectItem value="ALU SCREW">ALU SCREW</SelectItem><SelectItem value="KMA 2D">KMA 2D</SelectItem></SelectContent>
              </Select>

              <Button variant="outline" className="h-8 px-3 bg-white border-gray-300 rounded-sm text-xs font-normal">New</Button>
              
              <Input className="h-8 w-40 bg-white border-gray-300 rounded-sm text-xs" value={item.customDesc} onChange={e => updateItem(idx, 'customDesc', e.target.value)} />

              <Select value={item.hsn} onValueChange={v => updateItem(idx, 'hsn', v)}>
                <SelectTrigger className="h-8 w-32 bg-white border-gray-300 rounded-sm text-xs text-gray-500"><SelectValue placeholder="Select HSN"/></SelectTrigger>
                <SelectContent><SelectItem value="9988">9988</SelectItem><SelectItem value="7326">7326</SelectItem></SelectContent>
              </Select>

              <Input placeholder="Qty" type="number" className="h-8 w-20 bg-white border-gray-300 rounded-sm text-xs" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} />

              <Select value={item.unit} onValueChange={v => updateItem(idx, 'unit', v)}>
                <SelectTrigger className="h-8 w-20 bg-white border-gray-300 rounded-sm text-xs"><SelectValue placeholder="NOS"/></SelectTrigger>
                <SelectContent><SelectItem value="NOS">NOS</SelectItem><SelectItem value="KGS">KGS</SelectItem></SelectContent>
              </Select>

              <Input placeholder="Price" type="number" className="h-8 w-32 bg-white border-gray-300 rounded-sm text-xs" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} />

              <Button variant="outline" className="h-8 w-8 bg-[#ffcccb] hover:bg-red-200 border-gray-300 rounded-sm text-red-700 p-0" onClick={() => handleRemoveItem(idx)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="h-8 px-3 bg-white border-gray-300 rounded-sm text-xs font-normal" onClick={handleAddItem}>
            + Add Item
          </Button>
          <Button variant="outline" className="h-8 px-3 bg-white border-gray-300 rounded-sm text-xs font-normal" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Submit
          </Button>
          <Button variant="outline" className="h-8 px-3 bg-white border-gray-300 rounded-sm text-xs font-normal" onClick={handleReset}>
            Clear
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="px-4 sm:px-6 pb-20 bg-white">
        
        <div className="flex justify-end mb-2">
          <Button variant="outline" className="h-8 px-4 bg-[#f4f4f4] border-gray-300 rounded-sm text-xs font-normal">Show Filters</Button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="flex flex-col">
              <span>Show</span>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-7 w-16 bg-white border-gray-300 rounded-sm text-xs"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
              </Select>
              <span>entries</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700 mt-auto">
            <span>Search:</span>
            <Input className="h-7 w-48 bg-[#f4f4f4] border-gray-300 rounded-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="border border-gray-300 overflow-x-auto rounded-sm">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#007bff] text-white">
              <tr>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Document Type</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Document No</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Customer</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">DC No</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Document Date</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Basic Value</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Total Amount</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Item 1 Desc</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">HSN</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Qty</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Unit</th>
                <th className="p-3 font-bold border-r border-[#3b82f6]">Price</th>
                <th className="p-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={13} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={13} className="p-6 text-center text-gray-500 bg-gray-50">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row, i) => {
                  const firstItem = row.items && row.items.length > 0 ? row.items[0] : null;
                  return (
                    <tr key={row.id} className={i % 2 === 0 ? "bg-[#f4f4f4]" : "bg-white"}>
                      <td className="p-3 border-r border-gray-200">{row.document_type}</td>
                      <td className="p-3 border-r border-gray-200">{row.document_no}</td>
                      <td className="p-3 border-r border-gray-200 uppercase whitespace-normal min-w-[200px]">{row.customer}</td>
                      <td className="p-3 border-r border-gray-200">{row.dc_no}</td>
                      <td className="p-3 border-r border-gray-200">{row.date}</td>
                      <td className="p-3 border-r border-gray-200">{row.basic_value}</td>
                      <td className="p-3 border-r border-gray-200">{row.total_amount}</td>
                      <td className="p-3 border-r border-gray-200 uppercase whitespace-normal min-w-[200px]">
                        {firstItem ? `${firstItem.description} ${firstItem.customDesc}`.trim() : '-'}
                      </td>
                      <td className="p-3 border-r border-gray-200">{firstItem ? firstItem.hsn : '-'}</td>
                      <td className="p-3 border-r border-gray-200">{firstItem ? firstItem.qty : '-'}</td>
                      <td className="p-3 border-r border-gray-200">{firstItem ? firstItem.unit : '-'}</td>
                      <td className="p-3 border-r border-gray-200">{firstItem ? firstItem.price : '-'}</td>
                      <td className="p-2 align-top">
                        <div className="flex flex-col gap-1 w-16 mx-auto">
                          <Button variant="outline" size="sm" className="h-6 w-full text-[10px] bg-[#f4f4f4] border-gray-300 rounded-sm" onClick={() => handleEdit(row)}>Edit</Button>
                          <Button variant="outline" size="sm" className="h-6 w-full text-[10px] bg-[#f4f4f4] border-gray-300 rounded-sm" onClick={() => handleDelete(row.id)}>Delete</Button>
                          <Button variant="outline" size="sm" className="h-6 w-full text-[10px] bg-[#f4f4f4] border-gray-300 rounded-sm">View</Button>
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
