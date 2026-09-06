import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2 } from "lucide-react";

export const Route = createFileRoute("/petty-cash")({
  head: () => ({
    meta: [{ title: "Petty Cash Entry | Argus" }],
  }),
  component: PettyCashPage,
});

function PettyCashPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    valueDate: new Date().toISOString().split("T")[0],
    description: "",
    debit: "0.00",
    credit: "0.00",
    bankName: "",
    ledgerName: "",
    ledgerType: "",
  };
  const [form, setForm] = useState(initialForm);

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    bankName: "all",
    ledgerName: "all",
    ledgerType: "all"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("petty_cash").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast.error("Failed to load petty cash entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.valueDate || !form.description || !form.bankName || !form.ledgerName) {
      toast.error("Please fill all required fields (*)");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        value_date: form.valueDate,
        description: form.description,
        debit: parseFloat(form.debit) || 0,
        credit: parseFloat(form.credit) || 0,
        bank_name: form.bankName,
        ledger_name: form.ledgerName,
        ledger_type: form.ledgerType || "OTHERS", // fallback for mock
      };

      let error;
      if (editingId) {
        const res = await supabase.from("petty_cash").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("petty_cash").insert([payload]);
        error = res.error;
      }
      
      if (error) throw error;
      
      toast.success(editingId ? "Updated successfully" : "Saved successfully");
      handleReset();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete entry?")) return;
    try {
      await supabase.from("petty_cash").delete().eq("id", id);
      toast.success("Entry deleted");
      fetchData();
    } catch (e) { toast.error("Failed to delete entry"); }
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      valueDate: row.value_date,
      description: row.description,
      debit: row.debit?.toString() || "0.00",
      credit: row.credit?.toString() || "0.00",
      bankName: row.bank_name,
      ledgerName: row.ledger_name,
      ledgerType: row.ledger_type || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] pb-12">
      
      {/* Title */}
      <div className="px-6 py-6">
        <h1 className="text-xl font-bold text-[#333] uppercase">Petty Cash Entry</h1>
      </div>

      <div className="px-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* NEW CASH ENTRY CARD */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase">New Cash Entry</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Value Date <span className="text-red-500">*</span></label>
                <Input type="date" className="h-9 text-sm border-gray-300" value={form.valueDate} onChange={e => setForm({...form, valueDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Description <span className="text-red-500">*</span></label>
                <Input className="h-9 text-sm border-gray-300" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Debit</label>
                <Input type="number" className="h-9 text-sm border-gray-300" value={form.debit} onChange={e => setForm({...form, debit: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Credit</label>
                <Input type="number" className="h-9 text-sm border-gray-300" value={form.credit} onChange={e => setForm({...form, credit: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Bank Name <span className="text-red-500">*</span></label>
                <Select value={form.bankName} onValueChange={v => setForm({...form, bankName: v})}>
                  <SelectTrigger className="h-9 text-sm border-gray-300"><SelectValue placeholder="Select Bank" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="SBI">SBI</SelectItem>
                    <SelectItem value="HDFC">HDFC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Ledger Name <span className="text-red-500">*</span></label>
                <Select value={form.ledgerName} onValueChange={v => {
                  setForm({...form, ledgerName: v, ledgerType: v === 'COMPANY EXPENSES' ? 'INTERNAL' : 'Customer'})
                }}>
                  <SelectTrigger className="h-9 text-sm border-gray-300"><SelectValue placeholder="Search Ledger" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY EXPENSES">COMPANY EXPENSES</SelectItem>
                    <SelectItem value="AADHIGURU ENGINEERING">AADHIGURU ENGINEERING</SelectItem>
                    <SelectItem value="SANGEETHA">SANGEETHA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Ledger Type</label>
                <Input className="h-9 text-sm bg-gray-100 border-gray-300" value={form.ledgerType} readOnly />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button className="w-full h-9 bg-[#0d6efd] hover:bg-blue-600 text-white font-medium uppercase text-xs" onClick={handleSave} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? "Update Entry" : "Save Entry"}
                </Button>
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button variant="outline" className="w-full h-9 border-gray-300 text-gray-700 font-medium uppercase text-xs hover:bg-gray-50" onClick={handleReset}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase">Filter</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">From Date</label>
              <Input type="date" className="h-9 text-sm border-gray-300" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">To Date</label>
              <Input type="date" className="h-9 text-sm border-gray-300" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Bank Name</label>
              <Select value={filters.bankName} onValueChange={v => setFilters({...filters, bankName: v})}>
                <SelectTrigger className="h-9 text-sm border-gray-300"><SelectValue placeholder="All Banks" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Banks</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Ledger Name</label>
              <Select value={filters.ledgerName} onValueChange={v => setFilters({...filters, ledgerName: v})}>
                <SelectTrigger className="h-9 text-sm border-gray-300"><SelectValue placeholder="All Ledgers" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Ledgers</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Ledger Type</label>
              <Select value={filters.ledgerType} onValueChange={v => setFilters({...filters, ledgerType: v})}>
                <SelectTrigger className="h-9 text-sm border-gray-300"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Types</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full h-9 border-red-300 text-red-500 font-medium uppercase text-xs hover:bg-red-50" onClick={() => setFilters({fromDate:"", toDate:"", bankName:"all", ledgerName:"all", ledgerType:"all"})}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* PETTY CASH DETAILS TABLE */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase">Petty Cash Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="p-4 font-bold text-gray-800">Timestamp</th>
                  <th className="p-4 font-bold text-gray-800">Value Date</th>
                  <th className="p-4 font-bold text-gray-800">Description</th>
                  <th className="p-4 font-bold text-gray-800">Debit</th>
                  <th className="p-4 font-bold text-gray-800">Credit</th>
                  <th className="p-4 font-bold text-gray-800">Bank Name</th>
                  <th className="p-4 font-bold text-gray-800">Ledger Name</th>
                  <th className="p-4 font-bold text-gray-800">Ledger Type</th>
                  <th className="p-4 font-bold text-gray-800 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-gray-500">No data available</td></tr>
                ) : (
                  entries.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-4">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="p-4">{row.value_date}</td>
                      <td className="p-4">{row.description}</td>
                      <td className="p-4 text-gray-800 font-medium">{row.debit}</td>
                      <td className="p-4 text-gray-800 font-medium">{row.credit}</td>
                      <td className="p-4">{row.bank_name}</td>
                      <td className="p-4">{row.ledger_name}</td>
                      <td className="p-4">{row.ledger_type}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(row)} className="text-blue-500 hover:text-blue-700" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
