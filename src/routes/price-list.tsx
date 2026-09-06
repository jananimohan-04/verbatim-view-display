import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/price-list")({
  head: () => ({
    meta: [{ title: "Price List Management | Argus" }],
  }),
  component: PriceListPage,
});

function PriceListPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialEntryState = {
    product: "",
    mrp: "",
    selling: "",
    minSelling: "",
  };

  const [newEntry, setNewEntry] = useState(initialEntryState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("price_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error("Error fetching price list:", error);
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
      product: row.project_name || "",
      mrp: row.mrp?.toString() || "",
      selling: row.sale_price?.toString() || "",
      minSelling: row.min_selling_price?.toString() || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const { error } = await supabase.from("price_list").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete item");
    }
  };

  const handleReset = () => {
    setNewEntry(initialEntryState);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!newEntry.product) {
      toast.error("Product name is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        project_name: newEntry.product,
        mrp: parseFloat(newEntry.mrp) || 0,
        sale_price: parseFloat(newEntry.selling) || 0,
        min_selling_price: parseFloat(newEntry.minSelling) || 0,
      };

      let error;
      if (editingId) {
        const res = await supabase.from("price_list").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("price_list").insert([payload]);
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

  const filteredEntries = entries.filter((e) =>
    Object.values(e).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-8">
      
      <div className="max-w-[1600px] mx-auto bg-[#f4f4f4]">
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight">Price List Management</h1>
        <hr className="border-gray-300 mb-6" />

        {/* Form Row */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="font-bold text-sm text-gray-900">Product:</label>
            <Select value={newEntry.product} onValueChange={(v) => setNewEntry({ ...newEntry, product: v })}>
              <SelectTrigger className="h-9 w-64 bg-white border-gray-300 rounded-sm">
                <SelectValue placeholder="Search or type to add a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FLICKER - 26/07/2025">FLICKER - 26/07/2025</SelectItem>
                <SelectItem value="M10 CLAMP PAD 115MM - 24/10/2025">M10 CLAMP PAD 115MM - 24/10/2025</SelectItem>
                <SelectItem value="M10 FLANGE NUT - 24/10/2025">M10 FLANGE NUT - 24/10/2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-sm text-gray-900">MRP:</label>
            <Input type="number" className="h-9 w-32 bg-white border-gray-300 rounded-sm" value={newEntry.mrp} onChange={e => setNewEntry({...newEntry, mrp: e.target.value})} />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-sm text-gray-900">Selling:</label>
            <Input type="number" className="h-9 w-32 bg-white border-gray-300 rounded-sm" value={newEntry.selling} onChange={e => setNewEntry({...newEntry, selling: e.target.value})} />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-sm text-gray-900">Min Selling:</label>
            <Input type="number" className="h-9 w-32 bg-white border-gray-300 rounded-sm" value={newEntry.minSelling} onChange={e => setNewEntry({...newEntry, minSelling: e.target.value})} />
          </div>

          <div className="flex items-center gap-2 ml-2">
            <Button className="h-9 px-5 bg-[#007bff] hover:bg-blue-600 text-white font-medium rounded-sm shadow-sm" onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
            <Button className="h-9 px-5 bg-[#007bff] hover:bg-blue-600 text-white font-medium rounded-sm shadow-sm" onClick={handleReset}>
              Clear
            </Button>
          </div>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Toolbar Row */}
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 px-3 bg-[#e9ecef] border-gray-300 hover:bg-gray-200 text-sm font-normal text-gray-700 rounded-sm shadow-sm">Export CSV</Button>
            <Button variant="outline" className="h-8 px-3 bg-[#e9ecef] border-gray-300 hover:bg-gray-200 text-sm font-normal text-gray-700 rounded-sm shadow-sm">Export PDF</Button>
            <Button variant="outline" className="h-8 px-3 bg-[#e9ecef] border-gray-300 hover:bg-gray-200 text-sm font-normal text-gray-700 rounded-sm shadow-sm">Print Table</Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Search:</span>
            <Input className="h-8 w-64 bg-white border-gray-300 rounded-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-300 rounded-sm overflow-x-auto shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] text-gray-800 border-b border-gray-300">
              <tr>
                {["Timestamp", "Product", "MRP", "Selling Price", "Min Selling Price", "Actions"].map((col) => (
                  <th key={col} className="px-4 py-3 font-bold border-r border-gray-200 last:border-0 align-middle">
                    <div className="flex items-center justify-between">
                      {col}
                      <div className="flex flex-col text-[8px] leading-[8px] text-gray-400">
                        <span>▲</span><span>▼</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" /></td></tr>
              ) : filteredEntries.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No data available in table</td></tr>
              ) : (
                filteredEntries.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 uppercase">{row.project_name}</td>
                    <td className="px-4 py-3">{row.mrp}</td>
                    <td className="px-4 py-3">{row.sale_price}</td>
                    <td className="px-4 py-3">{row.min_selling_price || 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 px-3 bg-[#007bff] hover:bg-blue-600 text-white rounded-sm text-xs font-medium" onClick={() => handleEdit(row)}>Edit</Button>
                        <Button size="sm" className="h-7 px-3 bg-[#007bff] hover:bg-blue-600 text-white rounded-sm text-xs font-medium" onClick={() => handleDelete(row.id)}>Delete</Button>
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
  );
}
