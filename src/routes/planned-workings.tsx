import { createFileRoute } from "@tanstack/react-router";
import { Plus, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/planned-workings")({
  head: () => ({
    meta: [
      { title: "Planned Workings | Argus" },
      { name: "description", content: "Manage planned workings and categories." },
    ],
  }),
  component: PlannedWorkingsPage,
});

const partSchema = z.object({
  name: z.string().min(1, "Part Name is required"),
  qty: z.coerce.number().min(1, "Qty must be at least 1"),
  price: z.coerce.number().min(0, "Price must be positive"),
  gst: z.coerce.number().min(0, "GST must be positive"),
});

const formSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  project_name: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  party_id: z.string().min(1, "Party is required"),
  parts: z.array(partSchema).min(1, "At least one part is required").max(10, "Maximum 10 parts allowed"),
});

type Category = { id: string; name: string };
type Party = { id: string; company_name: string };
type PlannedWorking = {
  id: string;
  category_id: string;
  project_name: string;
  date: string;
  party_id: string;
  parts: z.infer<typeof partSchema>[];
  total_amount: number;
  created_at: string;
  working_categories?: { name: string };
  parties?: { company_name: string };
};

function PlannedWorkingsPage() {
  const [workings, setWorkings] = useState<PlannedWorking[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: "",
      project_name: "",
      date: new Date().toISOString().split("T")[0] || "",
      party_id: "",
      parts: [{ name: "", qty: 1, price: 0, gst: 0 }],
    } as any,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workingsRes, categoriesRes, partiesRes] = await Promise.all([
        supabase.from("planned_workings").select("*, working_categories(name), parties(company_name)").order("created_at", { ascending: false }),
        supabase.from("working_categories").select("*").order("name"),
        supabase.from("parties").select("id, company_name").order("company_name"),
      ]);

      if (workingsRes.error) throw workingsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (partiesRes.error) throw partiesRes.error;

      setWorkings(workingsRes.data || []);
      setCategories(categoriesRes.data || []);
      setParties(partiesRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data. Make sure Supabase is connected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = (parts: z.infer<typeof partSchema>[]) => {
    return parts.reduce((total, part) => {
      const partTotal = part.qty * part.price;
      const gstAmount = partTotal * (part.gst / 100);
      return total + partTotal + gstAmount;
    }, 0);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      const total_amount = calculateTotal(values.parts);
      const { error } = await supabase.from("planned_workings").insert([{ ...values, total_amount }]);
      if (error) throw error;

      toast.success("Planned working saved successfully");
      form.reset({
        ...form.getValues(),
        parts: [{ name: "", qty: 1, price: 0, gst: 0 }],
      });
      fetchData();
    } catch (error: any) {
      console.error("Error saving working:", error);
      toast.error(error.message || "Failed to save working");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorking = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from("planned_workings").delete().eq("id", id);
      if (error) throw error;
      toast.success("Record deleted successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategoryId) {
        const { error } = await supabase.from("working_categories").update({ name: newCategoryName }).eq("id", editingCategoryId);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("working_categories").insert([{ name: newCategoryName }]);
        if (error) throw error;
        toast.success("Category added");
      }
      setNewCategoryName("");
      setEditingCategoryId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure? This might fail if the category is in use.")) return;
    try {
      const { error } = await supabase.from("working_categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category. It might be in use.");
    }
  };

  const columns: Column<PlannedWorking>[] = [
    { key: "timestamp", header: "Timestamp", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
    { key: "category", header: "Category", cell: (r) => r.working_categories?.name || "-" },
    { key: "project", header: "Project", cell: (r) => r.project_name || "-" },
    { key: "date", header: "Date", cell: (r) => new Date(r.date).toLocaleDateString() },
    { key: "party", header: "Party", cell: (r) => r.parties?.company_name || "-" },
    { key: "part1", header: "Part 1", cell: (r) => r.parts[0]?.name || "-" },
    { key: "qty1", header: "Qty 1", cell: (r) => r.parts[0]?.qty || "-" },
    { key: "total", header: "Total Amount", cell: (r) => <span className="font-semibold tabular-nums">₹{r.total_amount.toFixed(2)}</span> },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteWorking(r.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Planned Workings"
        description="Manage planned workings and categories."
        actions={
          <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="size-3.5" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 my-4">
                <Input
                  placeholder="Enter new category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} className="bg-gray-200 text-black hover:bg-gray-300">
                  {editingCategoryId ? "Update" : "Add"}
                </Button>
                {editingCategoryId && (
                  <Button variant="ghost" onClick={() => { setEditingCategoryId(null); setNewCategoryName(""); }}>
                    Cancel
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2 border-b">
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="h-7" onClick={() => {
                        setEditingCategoryId(cat.id);
                        setNewCategoryName(cat.name);
                      }}>Edit</Button>
                      <Button size="sm" variant="secondary" className="h-7" onClick={() => handleDeleteCategory(cat.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control as any}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category<span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Select Category --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="project_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date<span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Name<span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- Select Party --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parties.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md bg-muted/20 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Part {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => remove(index)}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control as any}
                        name={`parts.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Part Name<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name={`parts.${index}.qty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name={`parts.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name={`parts.${index}.gst`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST (%)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fields.length < 10 && append({ name: "", qty: 1, price: 0, gst: 0 })}
                  disabled={fields.length >= 10}
                >
                  + Add Part (max 10)
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button type="button" variant="secondary" onClick={() => form.reset()} disabled={submitting}>
                  Reset
                </Button>
                <div className="ml-auto text-sm text-muted-foreground italic">
                  Amount auto-calculated on save
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={workings}
        rowKey={(r) => r.id}
        searchPlaceholder="Search..."
        searchKeys={(r) => `${r.project_name} ${r.working_categories?.name} ${r.parties?.company_name}`}
      />
    </>
  );
}
