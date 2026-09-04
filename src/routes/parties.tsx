import { createFileRoute } from "@tanstack/react-router";
import { Plus, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { DataTable, type Column } from "@/components/erp/data-table";
import { PageHeader, StatTile } from "@/components/erp/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Party Entry | Engineering ERP" },
      { name: "description", content: "Master records for customers, suppliers and vendors." },
    ],
  }),
  component: PartiesPage,
});

const formSchema = z.object({
  type: z.string().min(1, "Type is required"),
  code: z.string().min(1, "Code is required"),
  company_name: z.string().min(1, "Company Name is required"),
  address: z.string().optional(),
  gst: z.string().optional(),
  contact_1: z.string().optional(),
  contact_2: z.string().optional(),
  email_id: z.string().email("Invalid email").or(z.literal("")),
  contact_person: z.string().optional(),
  allocation: z.string().min(1, "Allocation is required"),
});

type Party = z.infer<typeof formSchema> & { id: string; created_at: string };

function PartiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterGST, setFilterGST] = useState("");
  const [filterContact, setFilterContact] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      code: "",
      company_name: "",
      address: "",
      gst: "",
      contact_1: "",
      contact_2: "",
      email_id: "",
      contact_person: "",
      allocation: "",
    },
  });

  const fetchParties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("parties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setParties(data || []);
    } catch (error: any) {
      console.error("Error fetching parties:", error);
      toast.error("Failed to load parties. Make sure Supabase is connected.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      if (editingId) {
        const { error } = await supabase.from("parties").update(values).eq("id", editingId);
        if (error) throw error;
        toast.success("Party updated successfully");
      } else {
        const { error } = await supabase.from("parties").insert([values]);
        if (error) throw error;
        toast.success("Party created successfully");
      }

      form.reset();
      setShowForm(false);
      setEditingId(null);
      fetchParties();
    } catch (error: any) {
      console.error("Error saving party:", error);
      toast.error(error.message || "Failed to save party");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (party: Party) => {
    form.reset({
      type: party.type,
      code: party.code,
      company_name: party.company_name,
      address: party.address || "",
      gst: party.gst || "",
      contact_1: party.contact_1 || "",
      contact_2: party.contact_2 || "",
      email_id: party.email_id || "",
      contact_person: party.contact_person || "",
      allocation: party.allocation,
    });
    setEditingId(party.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this party?")) return;
    try {
      const { error } = await supabase.from("parties").delete().eq("id", id);
      if (error) throw error;
      toast.success("Party deleted successfully");
      fetchParties();
    } catch (error: any) {
      console.error("Error deleting party:", error);
      toast.error("Failed to delete party");
    }
  };

  const filteredParties = parties.filter((p) => {
    return (
      (filterType === "" || p.type?.toLowerCase().includes(filterType.toLowerCase())) &&
      (filterCompany === "" || p.company_name?.toLowerCase().includes(filterCompany.toLowerCase())) &&
      (filterGST === "" || p.gst?.toLowerCase().includes(filterGST.toLowerCase())) &&
      (filterContact === "" || p.contact_1?.toLowerCase().includes(filterContact.toLowerCase()))
    );
  });

  const columns: Column<Party>[] = [
    { key: "sno", header: "S.No", cell: (r) => <span className="text-muted-foreground">{filteredParties.indexOf(r) + 1}</span> },
    { key: "timestamp", header: "Timestamp", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
    { key: "type", header: "Type", cell: (r) => r.type },
    { key: "code", header: "Code", sortable: true, sortValue: (r) => r.code, cell: (r) => <span className="font-semibold">{r.code}</span> },
    { key: "company_name", header: "Company Name", sortable: true, sortValue: (r) => r.company_name, cell: (r) => r.company_name },
    { key: "gst", header: "GST", cell: (r) => r.gst },
    { key: "contact_1", header: "Contact 1", cell: (r) => r.contact_1 },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="default" size="sm" className="h-7 px-2 bg-blue-500 hover:bg-blue-600 text-white text-xs" onClick={() => handleEdit(r)}>
            View
          </Button>
          <Button variant="default" size="sm" className="h-7 px-2 bg-blue-500 hover:bg-blue-600 text-white text-xs" onClick={() => handleEdit(r)}>
            Edit
          </Button>
          <Button variant="default" size="sm" className="h-7 px-2 bg-blue-500 hover:bg-blue-600 text-white text-xs" onClick={() => handleDelete(r.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Party Entry"
        description="Central master for all customers, suppliers and vendors used across the ERP."
        actions={
          <Button size="sm" className="h-9 gap-1.5" onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              form.reset();
            } else {
              setShowForm(true);
            }
          }}>
            <Plus className="size-3.5" /> {showForm ? "Close Form" : "Create Party"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Customer">Customer</SelectItem>
                            <SelectItem value="Supplier">Supplier</SelectItem>
                            <SelectItem value="Vendor">Vendor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact 1</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact 2</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Purchase">Purchase</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-center gap-2 pt-4">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Update" : "Submit"}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => {
                    form.reset();
                    if (editingId) {
                      setShowForm(false);
                      setEditingId(null);
                    }
                  }} disabled={submitting}>
                    {editingId ? "Cancel" : "Clear"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card className="mb-4 bg-muted/30">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type:</span>
            <Input
              placeholder="Search Type"
              className="h-8 w-40 bg-background"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Company Name:</span>
            <Input
              placeholder="Search Company"
              className="h-8 w-48 bg-background"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">GST:</span>
            <Input
              placeholder="Search GST"
              className="h-8 w-40 bg-background"
              value={filterGST}
              onChange={(e) => setFilterGST(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Contact 1:</span>
            <Input
              placeholder="Search Contact"
              className="h-8 w-40 bg-background"
              value={filterContact}
              onChange={(e) => setFilterContact(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              setFilterType("");
              setFilterCompany("");
              setFilterGST("");
              setFilterContact("");
            }}
          >
            Clear Filter
          </Button>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={filteredParties}
        rowKey={(r) => r.id}
        searchPlaceholder="Search party name, code, GST..."
        searchKeys={(r) => `${r.code} ${r.company_name} ${r.gst} ${r.type}`}
      />
    </>
  );
}
