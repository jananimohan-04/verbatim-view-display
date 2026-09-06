import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, RefreshCw, Copy, FileSpreadsheet, FileText, Printer, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/process-costing")({
  head: () => ({
    meta: [{ title: "Process Costing | Argus" }],
  }),
  component: ProcessCostingPage,
});

function ProcessCostingPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("100");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("process_costing")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching process costing:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredEntries = entries.filter((e) =>
    Object.values(e).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalCostSum = filteredEntries.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);
  const formattedTotalCost = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalCostSum);

  const columns = [
    "PROJECT NAME", "PARTY NAME", "PART NAME", "PROCESS NAME", "PROCESS COST", "DURATION", "QUANTITY", "TOTAL COST"
  ];

  return (
    <div className="p-4 sm:p-6 mx-auto w-full min-h-screen bg-[#fcfcfc] relative pb-20">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">PROCESS COSTING</h1>
        <div className="flex items-center gap-2">
          <Button className="h-9 bg-[#ffb800] hover:bg-yellow-500 text-black font-semibold rounded-md shadow-sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Update
          </Button>
          <Select>
            <SelectTrigger className="h-9 w-64 bg-white border-gray-300 text-gray-500">
              <div className="flex items-center">
                <span className="text-blue-500 font-bold mr-2 text-lg">🔍</span>
                <SelectValue placeholder="Filter by Project ..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Select value={pageSize} onValueChange={setPageSize}>
            <SelectTrigger className="h-8 w-32 bg-gray-100 border-gray-300 text-sm">
              <SelectValue placeholder="Show 100 rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Show 10 rows</SelectItem>
              <SelectItem value="50">Show 50 rows</SelectItem>
              <SelectItem value="100">Show 100 rows</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex bg-gray-100 rounded-sm border border-gray-300 overflow-hidden">
            <Button variant="ghost" className="h-8 px-3 rounded-none border-r border-gray-300 hover:bg-gray-200 text-xs font-semibold text-slate-700">
              <Copy className="h-3 w-3 mr-1 text-slate-700" /> Copy
            </Button>
            <Button variant="ghost" className="h-8 px-3 rounded-none border-r border-gray-300 hover:bg-gray-200 text-xs font-semibold text-slate-700">
              <FileSpreadsheet className="h-3 w-3 mr-1 text-green-600" /> Excel
            </Button>
            <Button variant="ghost" className="h-8 px-3 rounded-none border-r border-gray-300 hover:bg-gray-200 text-xs font-semibold text-slate-700">
              <FileText className="h-3 w-3 mr-1 text-red-600" /> PDF
            </Button>
            <Button variant="ghost" className="h-8 px-3 rounded-none hover:bg-gray-200 text-xs font-semibold text-slate-700">
              <Printer className="h-3 w-3 mr-1 text-slate-700" /> Print
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Search:</span>
          <Input className="h-8 w-64 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full text-left text-[13px] whitespace-nowrap">
          <thead>
            {/* Filter Dropdowns Row */}
            <tr className="bg-white border-b">
              {columns.map((col, i) => (
                <th key={`filter-${i}`} className="p-2 border-r border-gray-100 font-normal">
                  <Select>
                    <SelectTrigger className="h-8 text-xs border-gray-300 w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
                  </Select>
                </th>
              ))}
            </tr>
            {/* Main Header Row */}
            <tr className="bg-[#8b1c41] text-white">
              {columns.map((col, i) => (
                <th key={col} className="px-3 py-4 font-bold text-xs border-r border-[#9d244c] last:border-r-0">
                  <div className="flex items-center justify-between gap-1">
                    {col}
                    <div className="flex flex-col text-[8px] leading-[8px] opacity-70">
                      <span>▲</span><span>▼</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#8b1c41]" /></td></tr>
            ) : filteredEntries.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500 bg-slate-50">No data available in table</td></tr>
            ) : (
              filteredEntries.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 border-r border-gray-100 uppercase">{row.project_name}</td>
                  <td className="px-3 py-3 border-r border-gray-100 uppercase">{row.party_name}</td>
                  <td className="px-3 py-3 border-r border-gray-100 uppercase">{row.part_name}</td>
                  <td className="px-3 py-3 border-r border-gray-100 uppercase">{row.process_name}</td>
                  <td className="px-3 py-3 border-r border-gray-100">{row.process_cost}</td>
                  <td className="px-3 py-3 border-r border-gray-100">{row.duration}</td>
                  <td className="px-3 py-3 border-r border-gray-100">{row.quantity}</td>
                  <td className="px-3 py-3 border-r border-gray-100 font-semibold">{row.total_cost}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2">
        <div className="text-sm text-slate-600 mb-4 sm:mb-0">
          Showing 1 to {filteredEntries.length} of {filteredEntries.length} entries
        </div>
        <div className="text-2xl font-bold text-[#8b1c41]">
          TOTAL COST: {formattedTotalCost}
        </div>
      </div>

      {/* Floating Top Button */}
      {showScrollTop && (
        <Button 
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#007bff] hover:bg-blue-600 text-white shadow-lg flex flex-col items-center justify-center p-0"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
          <span className="text-[10px] font-semibold mt-[-2px]">Top</span>
        </Button>
      )}

    </div>
  );
}
