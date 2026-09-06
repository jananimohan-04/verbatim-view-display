import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/bank-entry")({
  head: () => ({
    meta: [{ title: "Bank Entry | Argus" }],
  }),
  component: BankEntryPage,
});

function BankEntryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals Data
  const [banks, setBanks] = useState<any[]>([]);
  const [bankTypes, setBankTypes] = useState<any[]>([]);
  const [bankOthers, setBankOthers] = useState<any[]>([]);
  const [ledgerDetails, setLedgerDetails] = useState<any[]>([]);

  // Textarea input
  const [pasteData, setPasteData] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("bank_entries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast.error("Failed to load bank entries.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => { const { data } = await supabase.from("banks").select("*"); if (data) setBanks(data); };
  const fetchBankTypes = async () => { const { data } = await supabase.from("bank_types").select("*"); if (data) setBankTypes(data); };
  const fetchBankOthers = async () => { const { data } = await supabase.from("bank_others").select("*"); if (data) setBankOthers(data); };
  const fetchLedgerDetails = async () => { const { data } = await supabase.from("ledger_details").select("*"); if (data) setLedgerDetails(data); };

  useEffect(() => {
    fetchData();
  }, []);

  // Basic crud for modals (mocking behavior for UI since it's a structural build, full CRUD easily hooked)
  const handleDeleteEntry = async (id: string) => {
    if(!window.confirm("Delete entry?")) return;
    await supabase.from("bank_entries").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      
      {/* Top Header Section */}
      <div className="bg-[#f8f9fa] border-b border-gray-300 px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#333]">Bank Entry</h1>
        
        <div className="flex gap-2 overflow-x-auto">
          {/* Manage Banks */}
          <Dialog onOpenChange={(o) => o && fetchBanks()}>
            <DialogTrigger asChild><Button variant="outline" className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-400 rounded-sm">Manage Banks</Button></DialogTrigger>
            <DialogContent className="max-w-md p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4">Manage Banks</DialogTitle></DialogHeader>
              <div className="flex gap-2 mb-4">
                <Input placeholder="New bank name" className="h-9 border-gray-400 rounded-sm" />
                <Button variant="outline" className="h-9 px-4 bg-[#f4f4f4] border-gray-400 rounded-sm">Add</Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {banks.map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm uppercase">{b.name}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" className="h-7 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Edit</Button>
                      <Button variant="outline" className="h-7 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Delete</Button>
                    </div>
                  </div>
                ))}
                {banks.length === 0 && <div className="text-sm text-gray-500 py-2">No banks found.</div>}
              </div>
              <div className="mt-4 flex justify-end"><DialogClose asChild><Button variant="outline" className="bg-[#f4f4f4] border-gray-400 rounded-sm">Close</Button></DialogClose></div>
            </DialogContent>
          </Dialog>

          {/* Manage Types */}
          <Dialog onOpenChange={(o) => o && fetchBankTypes()}>
            <DialogTrigger asChild><Button variant="outline" className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-400 rounded-sm">Manage Types</Button></DialogTrigger>
            <DialogContent className="max-w-md p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4">Manage Types (BANKS column B)</DialogTitle></DialogHeader>
              <div className="flex gap-2 mb-4">
                <Input placeholder="New type name" className="h-9 border-gray-400 rounded-sm" />
                <Button variant="outline" className="h-9 px-4 bg-[#f4f4f4] border-gray-400 rounded-sm">Add Type</Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {bankTypes.map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm uppercase">{b.name}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" className="h-7 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Edit</Button>
                      <Button variant="outline" className="h-7 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Delete</Button>
                    </div>
                  </div>
                ))}
                {bankTypes.length === 0 && <div className="text-sm text-gray-500 py-2">No types found.</div>}
              </div>
              <div className="mt-4 flex justify-end"><DialogClose asChild><Button variant="outline" className="bg-[#f4f4f4] border-gray-400 rounded-sm">Close</Button></DialogClose></div>
            </DialogContent>
          </Dialog>

          {/* Manage Others */}
          <Dialog onOpenChange={(o) => o && fetchBankOthers()}>
            <DialogTrigger asChild><Button variant="outline" className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-400 rounded-sm">Manage Others</Button></DialogTrigger>
            <DialogContent className="max-w-lg p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4">Manage Others</DialogTitle></DialogHeader>
              <div className="flex gap-2 mb-4">
                <Input placeholder="Party name (save to column...)" className="h-9 border-gray-400 rounded-sm flex-1" />
                <Select><SelectTrigger className="h-9 w-32 border-gray-400 rounded-sm"><SelectValue placeholder="-- Select Type --"/></SelectTrigger><SelectContent><SelectItem value="OTHERS">OTHERS</SelectItem><SelectItem value="INTERNAL">INTERNAL</SelectItem></SelectContent></Select>
                <Button variant="outline" className="h-9 px-4 bg-[#f4f4f4] border-gray-400 rounded-sm">Add Party</Button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {bankOthers.map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm uppercase">{b.party_name} — {b.type}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" className="h-7 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Edit</Button>
                      <Button variant="outline" className="h-7 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Delete</Button>
                    </div>
                  </div>
                ))}
                {bankOthers.length === 0 && <div className="text-sm text-gray-500 py-2">No entries found.</div>}
              </div>
            </DialogContent>
          </Dialog>

          {/* Ledger Details */}
          <Dialog onOpenChange={(o) => o && fetchLedgerDetails()}>
            <DialogTrigger asChild><Button variant="outline" className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-400 rounded-sm">Ledger Details</Button></DialogTrigger>
            <DialogContent className="max-w-3xl p-6">
              <DialogHeader><DialogTitle className="text-xl font-bold mb-4">Ledger Details</DialogTitle></DialogHeader>
              <div className="mb-4">
                <Input placeholder="Search ledger name or type..." className="h-9 border-gray-400 rounded-sm w-full" />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2 text-sm uppercase">
                {ledgerDetails.map(l => (
                  <div key={l.id} className="py-2 border-b border-gray-200 hover:bg-gray-50">{l.name} — {l.type}</div>
                ))}
                {ledgerDetails.length === 0 && <div className="text-gray-500 py-2">No ledgers found.</div>}
              </div>
            </DialogContent>
          </Dialog>

          {/* Manual Entry */}
          <Dialog>
            <DialogTrigger asChild><Button variant="outline" className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-400 rounded-sm">Manual Entry</Button></DialogTrigger>
            <DialogContent className="max-w-4xl p-6">
              <DialogHeader className="flex flex-row justify-between items-center mb-4">
                <DialogTitle className="text-xl font-bold text-black">Manual Entry</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-8 px-3 text-xs border-gray-400 rounded-sm">Types</Button>
                  <DialogClose asChild><button className="text-gray-500 hover:text-black">×</button></DialogClose>
                </div>
              </DialogHeader>
              
              <div className="grid grid-cols-12 gap-4 items-center mb-4 text-sm">
                <div className="col-span-1 text-gray-700">Date</div>
                <div className="col-span-3">
                  <Input type="date" className="h-9 border-gray-400 rounded-sm" />
                </div>
                <div className="col-span-1 text-gray-700">Debit</div>
                <div className="col-span-3">
                  <Input placeholder="0.00" className="h-9 border-gray-400 rounded-sm" />
                </div>
                <div className="col-span-1 text-gray-700">Credit</div>
                <div className="col-span-3">
                  <Input placeholder="0.00" className="h-9 border-gray-400 rounded-sm" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <Input placeholder="Description (will go to column D)" className="h-9 w-full border-gray-400 rounded-sm" />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-700">Type</label>
                  <Select>
                    <SelectTrigger className="h-9 w-48 border-gray-400 rounded-sm"><SelectValue placeholder="-- Select Type --" /></SelectTrigger>
                    <SelectContent><SelectItem value="INTERNAL">INTERNAL</SelectItem><SelectItem value="OTHERS">OTHERS</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="h-9 px-4 bg-[#f4f4f4] border-gray-400 rounded-sm text-black">Save</Button>
                  <DialogClose asChild><Button variant="outline" className="h-9 px-4 bg-[#f4f4f4] border-gray-400 rounded-sm text-black">Close</Button></DialogClose>
                </div>
              </div>

            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 sm:p-6 mx-auto w-full max-w-[1800px]">
        
        {/* Paste Area */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Input type="file" className="h-8 w-64 text-xs bg-white border-gray-400 rounded-sm file:mr-2 file:h-full file:bg-[#e9ecef] file:border-0 file:px-3 file:text-gray-700" />
            <Select>
              <SelectTrigger className="h-8 w-64 text-xs bg-white border-gray-400 rounded-sm"><SelectValue placeholder="-- Select Bank --"/></SelectTrigger>
              <SelectContent><SelectItem value="bank1">SBI</SelectItem><SelectItem value="bank2">HDFC</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Refresh</Button>
          </div>

          <Textarea 
            className="w-full h-40 bg-white border-gray-400 rounded-sm mb-2 text-sm p-3 font-mono" 
            placeholder="Paste rows here - use TAB or comma separated columns"
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Save</Button>
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">View full Table</Button>
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm" onClick={() => setPasteData("")}>Clear Text</Button>
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Download CSV</Button>
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Download PDF</Button>
            <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Update entries</Button>
          </div>
          <div className="mt-2 text-xs font-semibold text-green-700">Loaded {entries.length} rows</div>
        </div>

        {/* Bank Data Section */}
        <h2 className="text-lg font-bold text-[#333] mb-3">Bank Data</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-700 mr-2">Filter:</label>
            <Input className="h-8 w-56 text-xs bg-white border-gray-400 rounded-sm inline-flex" placeholder="-- All Banks / Types --" />
          </div>
          <Input className="h-8 w-48 text-xs bg-white border-gray-400 rounded-sm" placeholder="-- All Ledger Types --" />
          
          <div className="flex items-center gap-1 bg-transparent px-2 h-8">
            <Checkbox id="errorRows" className="border-gray-500 rounded-sm w-4 h-4" />
            <label htmlFor="errorRows" className="text-xs text-gray-700 font-medium">Only error rows</label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700">From</label>
            <Input type="date" className="h-8 w-32 text-xs bg-white border-gray-400 rounded-sm" />
            <label className="text-xs text-gray-700">To</label>
            <Input type="date" className="h-8 w-32 text-xs bg-white border-gray-400 rounded-sm" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="h-8 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Last 3 Months</Button>
            <Button variant="outline" className="h-8 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Last 6 Months</Button>
            <Button variant="outline" className="h-8 px-3 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Last 1 Year</Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Clear Filters</Button>
          <Button variant="outline" className="h-8 px-4 text-xs bg-[#f4f4f4] border-gray-400 rounded-sm">Load Full Data</Button>
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>Show</span>
            <Select defaultValue="100"><SelectTrigger className="h-7 w-16 bg-white border-gray-400 rounded-sm text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="100">100</SelectItem></SelectContent></Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span>Search:</span>
            <Input className="h-7 w-48 bg-white border-gray-400 rounded-sm" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded-sm bg-white">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8f9fa] border-b border-gray-300 text-gray-800 font-bold">
              <tr>
                <th className="p-2 border-r border-gray-300">Txn Date</th>
                <th className="p-2 border-r border-gray-300">Value Date</th>
                <th className="p-2 border-r border-gray-300">Cheque No.</th>
                <th className="p-2 border-r border-gray-300 w-48">Description</th>
                <th className="p-2 border-r border-gray-300">Branch Code</th>
                <th className="p-2 border-r border-gray-300 text-right">Debit</th>
                <th className="p-2 border-r border-gray-300 text-right">Credit</th>
                <th className="p-2 border-r border-gray-300 text-right">Balance</th>
                <th className="p-2 border-r border-gray-300">Bank Name</th>
                <th className="p-2 border-r border-gray-300 w-64">Ledger Name</th>
                <th className="p-2 border-r border-gray-300">Ledger Type</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={12} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-500" /></td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={12} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                entries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 text-gray-700">
                    <td className="p-2 border-r border-gray-200">{row.txn_date}</td>
                    <td className="p-2 border-r border-gray-200">{row.value_date}</td>
                    <td className="p-2 border-r border-gray-200">{row.cheque_no}</td>
                    <td className="p-2 border-r border-gray-200 truncate max-w-[200px]" title={row.description}>{row.description}</td>
                    <td className="p-2 border-r border-gray-200">{row.branch_code}</td>
                    <td className="p-2 border-r border-gray-200 text-right">{row.debit || ''}</td>
                    <td className="p-2 border-r border-gray-200 text-right">{row.credit || ''}</td>
                    <td className="p-2 border-r border-gray-200 text-right">{row.balance}</td>
                    <td className="p-2 border-r border-gray-200 uppercase">{row.bank_name}</td>
                    <td className="p-2 border-r border-gray-200">
                      <div className="flex border border-gray-300 rounded-sm overflow-hidden bg-white h-7">
                        <Input className="h-full border-0 rounded-none w-full text-xs px-2 shadow-none focus-visible:ring-0 uppercase" defaultValue={row.ledger_name} />
                        <button className="px-2 hover:bg-gray-100 text-gray-400 border-l border-gray-300">×</button>
                        <button className="px-2 bg-gray-100 hover:bg-gray-200 border-l border-gray-300 text-[10px]">▼</button>
                      </div>
                    </td>
                    <td className="p-2 border-r border-gray-200">{row.ledger_type}</td>
                    <td className="p-2 text-center">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-[#f4f4f4] border-gray-300 rounded-sm" onClick={() => handleDeleteEntry(row.id)}>
                        <Trash2 className="h-3 w-3 text-gray-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
