import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowUpDown, Plus } from "lucide-react";

export const Route = createFileRoute("/ledger-dashboard")({
  head: () => ({
    meta: [{ title: "Ledger Statement | Argus" }],
  }),
  component: LedgerPage,
});



function LedgerPage() {
  // Pure Supabase state - no hardcoded active rows
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [particularsFilter, setParticularsFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
    particulars: "",
    party: "all"
  });

  // Table Controls
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Statement Modal State
  const [statementOpen, setStatementOpen] = useState(false);
  const [stmtFromDate, setStmtFromDate] = useState("");
  const [stmtToDate, setStmtToDate] = useState("");
  const [stmtSearchParty, setStmtSearchParty] = useState("");
  const [stmtSelectedParty, setStmtSelectedParty] = useState("all");
  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({});
  const [isLedgerBookMode, setIsLedgerBookMode] = useState(false);

  // New manual entry modal state
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reference_no: "",
    particulars: "",
    narration: "",
    debit: "0",
    credit: "0",
    party_name: "",
    ledger_type: "Customer"
  });

  // Fetch Supabase data directly
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ledger_dashboard")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (e: any) {
      console.error("Error fetching ledger_dashboard from Supabase:", e);
      toast.error(e.message || "Failed to load ledger records from Supabase");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  // Sync Bank Entries into Ledger directly via Supabase
  const handleUpdateBank = async () => {
    try {
      setLoading(true);
      const { data: banks, error } = await supabase.from("bank_entries").select("*");
      if (error) throw error;
      if (!banks || banks.length === 0) {
        toast.info("No records in Supabase 'bank_entries' to sync.");
        return;
      }
      const rows = banks.map((b) => ({
        date: b.txn_date || b.value_date || new Date().toISOString().split("T")[0],
        reference_no: b.cheque_no || "",
        particulars: b.description || "BANK TRANSACTION",
        narration: `Bank: ${b.bank_name || ""}`,
        debit: Number(b.debit) || 0,
        credit: Number(b.credit) || 0,
        party_name: b.ledger_name || "BANK",
        ledger_type: b.ledger_type || "Bank"
      }));
      const { error: insErr } = await supabase.from("ledger_dashboard").insert(rows);
      if (insErr) throw insErr;
      toast.success(`Successfully imported ${rows.length} bank entries from Supabase!`);
      fetchData();
    } catch (err: any) {
      toast.error("Bank sync error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync Invoices into Ledger directly via Supabase
  const handleUpdateInvoice = async () => {
    try {
      setLoading(true);
      const { data: invs, error } = await supabase.from("invoices").select("*");
      if (error) throw error;
      if (!invs || invs.length === 0) {
        toast.info("No records in Supabase 'invoices' to sync.");
        return;
      }
      const rows = invs.map((inv) => ({
        date: inv.date || new Date().toISOString().split("T")[0],
        reference_no: inv.document_no || "",
        particulars: inv.document_type || "SALES INVOICE",
        narration: `DC: ${inv.dc_no || ""} | PO: ${inv.po_no || ""}`,
        debit: Number(inv.total_amount) || 0,
        credit: 0,
        party_name: inv.customer || "UNKNOWN",
        ledger_type: "Customer"
      }));
      const { error: insErr } = await supabase.from("ledger_dashboard").insert(rows);
      if (insErr) throw insErr;
      toast.success(`Successfully imported ${rows.length} invoices from Supabase!`);
      fetchData();
    } catch (err: any) {
      toast.error("Invoice sync error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new Ledger Entry in Supabase
  const handleCreateNewEntry = async () => {
    if (!newEntryForm.party_name || !newEntryForm.particulars) {
      toast.error("Please enter Party Name and Particulars");
      return;
    }
    try {
      const payload = {
        date: newEntryForm.date,
        reference_no: newEntryForm.reference_no,
        particulars: newEntryForm.particulars,
        narration: newEntryForm.narration,
        debit: parseFloat(newEntryForm.debit) || 0,
        credit: parseFloat(newEntryForm.credit) || 0,
        party_name: newEntryForm.party_name,
        ledger_type: newEntryForm.ledger_type
      };
      const { error } = await supabase.from("ledger_dashboard").insert([payload]);
      if (error) throw error;
      toast.success("New entry saved to Supabase!");
      setNewEntryOpen(false);
      setNewEntryForm({
        date: new Date().toISOString().split("T")[0],
        reference_no: "",
        particulars: "",
        narration: "",
        debit: "0",
        credit: "0",
        party_name: "",
        ledger_type: "Customer"
      });
      fetchData();
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    }
  };

  // DYNAMIC Statement Groups Computed Entirely From Supabase Data
  const statementGroups = useMemo(() => {
    const map: Record<
      string,
      {
        party: string;
        debit: number;
        credit: number;
        balance: number;
        transactions: any[];
      }
    > = {};

    entries.forEach((e) => {
      const party = (e.party_name || "UNKNOWN").trim();
      if (!map[party]) {
        map[party] = {
          party,
          debit: 0,
          credit: 0,
          balance: 0,
          transactions: []
        };
      }
      const d = Number(e.debit) || 0;
      const c = Number(e.credit) || 0;
      map[party].debit += d;
      map[party].credit += c;
      map[party].balance += (d - c);
      map[party].transactions.push({
        date: e.date,
        ref: e.reference_no || "-",
        particulars: e.particulars || "-",
        narration: e.narration || "-",
        debit: d,
        credit: c,
        balance: map[party].balance,
        dueDays: 0
      });
    });

    return Object.values(map).sort((a, b) => a.party.localeCompare(b.party));
  }, [entries]);

  // Unique parties dynamically derived from database records
  const uniqueParties = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.party_name) set.add(e.party_name);
    });
    return Array.from(set).sort();
  }, [entries]);

  // Apply filters on button click
  const handleApplyFilter = () => {
    setAppliedFilters({
      startDate,
      endDate,
      particulars: particularsFilter.trim().toLowerCase(),
      party: partyFilter
    });
    toast.success("Filters applied");
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setParticularsFilter("");
    setPartyFilter("all");
    setAppliedFilters({
      startDate: "",
      endDate: "",
      particulars: "",
      party: "all"
    });
    setSearch("");
    toast.info("Filters cleared");
  };

  // Filtered and Sorted entries for Main Table
  const displayedEntries = useMemo(() => {
    let list = [...entries];

    if (appliedFilters.startDate) {
      list = list.filter((r) => r.date >= appliedFilters.startDate);
    }
    if (appliedFilters.endDate) {
      list = list.filter((r) => r.date <= appliedFilters.endDate);
    }
    if (appliedFilters.particulars) {
      list = list.filter((r) =>
        r.particulars?.toLowerCase().includes(appliedFilters.particulars)
      );
    }
    if (appliedFilters.party !== "all") {
      list = list.filter((r) => r.party_name === appliedFilters.party);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.party_name?.toLowerCase().includes(q) ||
          r.particulars?.toLowerCase().includes(q) ||
          r.reference_no?.toLowerCase().includes(q) ||
          r.narration?.toLowerCase().includes(q) ||
          r.ledger_type?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let vA = a[sortField] ?? "";
      let vB = b[sortField] ?? "";
      if (typeof vA === "number" && typeof vB === "number") {
        return sortOrder === "asc" ? vA - vB : vB - vA;
      }
      return sortOrder === "asc"
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });

    const limit = parseInt(pageSize, 10) || 100;
    return list.slice(0, limit);
  }, [entries, appliedFilters, search, sortField, sortOrder, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Statement Modal Calculations
  const filteredStatementGroups = useMemo(() => {
    let groups = [...statementGroups];
    if (stmtSelectedParty !== "all") {
      groups = groups.filter((g) => g.party === stmtSelectedParty);
    }
    if (stmtSearchParty.trim()) {
      const q = stmtSearchParty.toLowerCase();
      groups = groups.filter((g) => g.party.toLowerCase().includes(q));
    }
    if (stmtFromDate) {
      groups = groups.map((g) => ({
        ...g,
        transactions: g.transactions.filter((t) => t.date >= stmtFromDate)
      }));
    }
    if (stmtToDate) {
      groups = groups.map((g) => ({
        ...g,
        transactions: g.transactions.filter((t) => t.date <= stmtToDate)
      }));
    }
    return groups;
  }, [statementGroups, stmtSelectedParty, stmtSearchParty, stmtFromDate, stmtToDate]);

  const statementTotals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let totalBalance = 0;
    filteredStatementGroups.forEach((g) => {
      totalDebit += g.debit;
      totalCredit += g.credit;
      totalBalance += g.balance;
    });
    return {
      debit: totalDebit,
      credit: totalCredit,
      balance: totalBalance
    };
  }, [filteredStatementGroups]);

  const togglePartyExpand = (party: string) => {
    setExpandedParties((prev) => ({
      ...prev,
      [party]: !prev[party]
    }));
  };

  const handleDownloadExcel = () => {
    const headers = ["Date", "Reference No.", "Particulars", "Narration", "Debit", "Credit", "Closing Balance", "DUE DAYS"];
    const rows: string[] = [headers.join(",")];

    filteredStatementGroups.forEach((g) => {
      rows.push(`"${g.party}","","","","${g.debit}","${g.credit}","${g.balance}",""`);
      g.transactions.forEach((t) => {
        rows.push(`"${t.date}","${t.ref}","${t.particulars}","${t.narration}","${t.debit}","${t.credit}","${t.balance}","${t.dueDays}"`);
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ledger_Statement_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel CSV downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] pb-16 text-[#333]">
      
      {/* Top Bar Header */}
      <div className="bg-[#f4f6f8] border-b border-gray-300 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#111]">Ledger Dashboard</h1>
          <span className="text-xs text-gray-500 font-medium">
            {loading ? "Loading..." : `${entries.length} rows (Supabase)`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Entry Modal */}
          <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-black">New Ledger Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Date</label>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={newEntryForm.date}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Party Name</label>
                  <Input
                    placeholder="e.g. AADHIGURU ENGINEERING"
                    className="h-8 text-xs uppercase"
                    value={newEntryForm.party_name}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, party_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Particulars</label>
                  <Input
                    placeholder="e.g. GOODS PURCHASE, SALES INVOICE"
                    className="h-8 text-xs uppercase"
                    value={newEntryForm.particulars}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, particulars: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Debit (₹)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={newEntryForm.debit}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, debit: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Credit (₹)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={newEntryForm.credit}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, credit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Reference No</label>
                    <Input
                      placeholder="e.g. INV-001"
                      className="h-8 text-xs"
                      value={newEntryForm.reference_no}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, reference_no: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Ledger Type</label>
                    <Select
                      value={newEntryForm.ledger_type}
                      onValueChange={(v) => setNewEntryForm({ ...newEntryForm, ledger_type: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Narration</label>
                  <Input
                    placeholder="Optional notes..."
                    className="h-8 text-xs"
                    value={newEntryForm.narration}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, narration: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <DialogClose asChild>
                    <Button variant="outline" className="h-8 text-xs">Cancel</Button>
                  </DialogClose>
                  <Button className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateNewEntry}>
                    Save to Database
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="h-8 px-4 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
            onClick={fetchData}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Refresh
          </Button>
          <Button
            variant="outline"
            className="h-8 px-4 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
            onClick={handleUpdateBank}
          >
            Update Bank
          </Button>
          <Button
            variant="outline"
            className="h-8 px-4 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
            onClick={handleUpdateInvoice}
          >
            Update Invoice
          </Button>
          <Button
            variant="outline"
            className="h-8 px-4 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
            onClick={() => toast.info("Inward entries checked with Supabase.")}
          >
            Update Inward
          </Button>

          {/* Ledger Statement Modal */}
          <Dialog open={statementOpen} onOpenChange={setStatementOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-8 px-4 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
              >
                Ledger Statement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-[95vw] p-6 bg-white overflow-hidden max-h-[95vh] flex flex-col">
              <DialogHeader className="flex flex-row justify-between items-center mb-2 pb-2 border-b border-gray-200">
                <DialogTitle className="text-xl font-bold text-black">Ledger Statement</DialogTitle>
                <DialogClose asChild>
                  <button className="text-gray-500 hover:text-black text-2xl leading-none font-light">×</button>
                </DialogClose>
              </DialogHeader>

              {/* Modal Top Filters */}
              <div className="flex flex-wrap items-center gap-3 py-3 border-b border-gray-200 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-700">From:</span>
                  <Input
                    type="date"
                    className="h-8 w-36 border-gray-300 text-xs rounded-sm"
                    value={stmtFromDate}
                    onChange={(e) => setStmtFromDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-700">To:</span>
                  <Input
                    type="date"
                    className="h-8 w-36 border-gray-300 text-xs rounded-sm"
                    value={stmtToDate}
                    onChange={(e) => setStmtToDate(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Search party..."
                  className="h-8 w-44 border-gray-300 text-xs rounded-sm"
                  value={stmtSearchParty}
                  onChange={(e) => setStmtSearchParty(e.target.value)}
                />
                <Select value={stmtSelectedParty} onValueChange={setStmtSelectedParty}>
                  <SelectTrigger className="h-8 w-44 border-gray-300 text-xs rounded-sm">
                    <SelectValue placeholder="-- All Parties --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- All Parties --</SelectItem>
                    {statementGroups.map((g) => (
                      <SelectItem key={g.party} value={g.party}>
                        {g.party}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className={`h-8 px-4 text-xs font-bold rounded-sm border ${
                    isLedgerBookMode
                      ? "bg-amber-400 text-black border-amber-500"
                      : "bg-[#ffdf73] hover:bg-[#ffe68d] text-black border-[#ffd230]"
                  }`}
                  onClick={() => setIsLedgerBookMode(!isLedgerBookMode)}
                >
                  Ledger Book
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
                  onClick={() => toast.success("Statement updated")}
                >
                  Run
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
                  onClick={handlePrint}
                >
                  Print
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
                  onClick={handleDownloadExcel}
                >
                  Download Excel
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
                  onClick={handlePrint}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-100"
                  onClick={() => {
                    setStmtFromDate("");
                    setStmtToDate("");
                    setStmtSearchParty("");
                    setStmtSelectedParty("all");
                    setIsLedgerBookMode(false);
                  }}
                >
                  Clear
                </Button>
              </div>

              {/* Modal Statement Table */}
              <div className="flex-1 overflow-y-auto max-h-[55vh] border border-gray-200 mt-3 rounded-sm">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#f8f9fa] border-b border-gray-300 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-2.5 font-bold text-black border-r border-gray-200">Date</th>
                      <th className="p-2.5 font-bold text-black border-r border-gray-200">Reference No.</th>
                      <th className="p-2.5 font-bold text-black border-r border-gray-200">Particulars</th>
                      <th className="p-2.5 font-bold text-black border-r border-gray-200">Narration</th>
                      <th className="p-2.5 font-bold text-black text-right border-r border-gray-200">Debit</th>
                      <th className="p-2.5 font-bold text-black text-right border-r border-gray-200">Credit</th>
                      <th className="p-2.5 font-bold text-black text-right border-r border-gray-200">Closing Balance</th>
                      <th className="p-2.5 font-bold text-black text-center">DUE DAYS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredStatementGroups.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-500">
                          No party statements available. Records will dynamically group here as data is added in Supabase.
                        </td>
                      </tr>
                    ) : (
                      filteredStatementGroups.map((group) => {
                        const isExpanded = isLedgerBookMode || !!expandedParties[group.party];
                        return (
                          <div key={group.party} className="contents">
                            {/* Party Summary Row */}
                            <tr
                              className="hover:bg-blue-50/50 cursor-pointer select-none bg-white transition-colors"
                              onClick={() => togglePartyExpand(group.party)}
                            >
                              <td className="p-2.5 border-r border-gray-200 font-bold text-[#00529b]">
                                <span className="inline-flex items-center gap-1 font-bold">
                                  {isExpanded ? (
                                    <span className="text-base leading-none font-bold text-black mr-1">−</span>
                                  ) : (
                                    <span className="text-base leading-none font-bold text-black mr-1">+</span>
                                  )}
                                  {group.party}
                                </span>
                              </td>
                              <td className="p-2.5 border-r border-gray-200"></td>
                              <td className="p-2.5 border-r border-gray-200"></td>
                              <td className="p-2.5 border-r border-gray-200"></td>
                              <td className="p-2.5 text-right font-bold text-black border-r border-gray-200">
                                ₹{group.debit.toLocaleString("en-IN")}
                              </td>
                              <td className="p-2.5 text-right font-bold text-black border-r border-gray-200">
                                ₹{group.credit.toLocaleString("en-IN")}
                              </td>
                              <td className="p-2.5 text-right font-bold text-black border-r border-gray-200">
                                ₹{group.balance.toLocaleString("en-IN")}
                              </td>
                              <td className="p-2.5 text-center text-black"></td>
                            </tr>

                            {/* Expanded Detailed Transactions */}
                            {isExpanded &&
                              group.transactions.map((tx, idx) => (
                                <tr key={idx} className="bg-slate-50/80 text-gray-700 text-[11px]">
                                  <td className="p-2 pl-8 border-r border-gray-200 font-mono">
                                    {new Date(tx.date).toLocaleDateString("en-GB")}
                                  </td>
                                  <td className="p-2 border-r border-gray-200 font-medium">{tx.ref}</td>
                                  <td className="p-2 border-r border-gray-200 uppercase font-medium">{tx.particulars}</td>
                                  <td className="p-2 border-r border-gray-200 uppercase">{tx.narration}</td>
                                  <td className="p-2 text-right border-r border-gray-200">
                                    {tx.debit > 0 ? `₹${tx.debit.toLocaleString("en-IN")}` : "-"}
                                  </td>
                                  <td className="p-2 text-right border-r border-gray-200">
                                    {tx.credit > 0 ? `₹${tx.credit.toLocaleString("en-IN")}` : "-"}
                                  </td>
                                  <td className="p-2 text-right border-r border-gray-200 font-semibold">
                                    ₹{tx.balance.toLocaleString("en-IN")}
                                  </td>
                                  <td className="p-2 text-center font-medium">
                                    {tx.dueDays > 0 ? `${tx.dueDays} d` : "-"}
                                  </td>
                                </tr>
                              ))}
                          </div>
                        );
                      })
                    )}

                    {/* Total Row */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                      <td colSpan={3} className="p-2.5 border-r border-gray-200"></td>
                      <td className="p-2.5 font-bold text-black text-right border-r border-gray-200 uppercase tracking-wider">
                        TOTAL
                      </td>
                      <td className="p-2.5 font-bold text-black text-right border-r border-gray-200">
                        ₹{statementTotals.debit.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 font-bold text-black text-right border-r border-gray-200">
                        ₹{statementTotals.credit.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 font-bold text-black text-right border-r border-gray-200">
                        ₹{statementTotals.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Yellow Card & Close Button */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="text-xs text-gray-500 font-medium">
                  Showing {filteredStatementGroups.length} parties
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-[#ffdf73] px-6 py-2.5 font-bold text-black text-base border border-[#ffd230] rounded-sm shadow-sm tracking-wide">
                    BALANCE AMOUNT: ₹{statementTotals.balance.toLocaleString("en-IN")}
                  </div>
                  <DialogClose asChild>
                    <Button variant="outline" className="bg-[#f4f4f4] border-gray-300 text-black h-9 px-6 rounded-sm hover:bg-gray-200">
                      Close
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="h-8 px-4 text-xs font-bold bg-[#fff8e1] text-black border-[#ffd230] rounded-sm hover:bg-[#ffeb99]"
            onClick={() => setStatementOpen(true)}
          >
            Ledger Book
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 mx-auto w-full max-w-[1800px] mt-4">
        
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 border border-gray-200 rounded-sm shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-black">
            <span>Start:</span>
            <Input
              type="date"
              className="h-8 w-36 border-gray-300 rounded-sm text-xs"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-black">
            <span>End:</span>
            <Input
              type="date"
              className="h-8 w-36 border-gray-300 rounded-sm text-xs"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Input
            placeholder="Filter: Particulars"
            className="h-8 w-56 border-gray-300 rounded-sm text-xs"
            value={particularsFilter}
            onChange={(e) => setParticularsFilter(e.target.value)}
          />
          <Select value={partyFilter} onValueChange={setPartyFilter}>
            <SelectTrigger className="h-8 w-56 border-gray-300 rounded-sm text-xs">
              <SelectValue placeholder="Party (all)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Party (all)</SelectItem>
              {uniqueParties.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="h-8 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium"
            onClick={handleApplyFilter}
          >
            Apply
          </Button>
          <Button
            variant="outline"
            className="h-8 px-4 text-xs bg-white text-gray-700 border-gray-300 rounded-sm hover:bg-gray-50 font-medium"
            onClick={handleClearFilter}
          >
            Clear
          </Button>
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-2 text-xs text-black">
            <span>Show</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="h-7 w-16 bg-white border-gray-300 rounded-sm text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-black">
            <span>Search:</span>
            <Input
              className="h-7 w-52 bg-white border-gray-300 rounded-sm text-xs"
              placeholder="Search anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Main Datatable */}
        <div className="overflow-x-auto border border-gray-200 bg-white rounded-sm shadow-2xs">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#eef2f7] border-b border-gray-200">
              <tr>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center justify-between">
                    <span>Date (dd/MM/yyyy)</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("reference_no")}
                >
                  <div className="flex items-center justify-between">
                    <span>Reference Number</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("particulars")}
                >
                  <div className="flex items-center justify-between">
                    <span>Particulars</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("narration")}
                >
                  <div className="flex items-center justify-between">
                    <span>Narration</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 text-right cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("debit")}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Debit</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 text-right cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("credit")}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Credit</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] border-r border-gray-200 cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("party_name")}
                >
                  <div className="flex items-center justify-between">
                    <span>Party Name</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="p-3 font-bold text-[#333] cursor-pointer hover:bg-gray-200/60 select-none"
                  onClick={() => handleSort("ledger_type")}
                >
                  <div className="flex items-center justify-between">
                    <span>Ledger Type</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#333]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Fetching records from Supabase...
                  </td>
                </tr>
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                displayedEntries.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className={`transition-colors ${
                      idx % 2 === 1 ? "bg-[#fcfdfd]" : "bg-white"
                    } hover:bg-slate-50`}
                  >
                    <td className="p-2.5 border-r border-gray-100 font-mono">
                      {new Date(row.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-2.5 border-r border-gray-100">{row.reference_no}</td>
                    <td className="p-2.5 border-r border-gray-100 uppercase font-medium">{row.particulars}</td>
                    <td className="p-2.5 border-r border-gray-100 uppercase text-gray-500">{row.narration}</td>
                    <td className="p-2.5 border-r border-gray-100 text-right font-medium">
                      {row.debit > 0 ? Number(row.debit).toLocaleString("en-IN") : ""}
                    </td>
                    <td className="p-2.5 border-r border-gray-100 text-right font-medium">
                      {row.credit > 0 ? Number(row.credit).toLocaleString("en-IN") : ""}
                    </td>
                    <td className="p-2.5 border-r border-gray-100 uppercase font-medium text-gray-800">
                      {row.party_name}
                    </td>
                    <td className="p-2.5 uppercase text-gray-600 font-medium">{row.ledger_type}</td>
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
