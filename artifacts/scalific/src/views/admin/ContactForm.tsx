"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContactFormField, ContactFieldType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const fieldSchema = z.object({
  field_label: z.string().min(1, "Label is required"),
  field_name: z.string().min(1, "Name is required").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  field_type: z.enum(["text", "email", "textarea", "phone", "select"] as const),
  is_required: z.boolean().default(true),
  options: z.string().optional(), // Comma separated for form, parsed to array for DB
  display_order: z.coerce.number().int(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

export default function AdminContactForm() {
  const [fields, setFields] = useState<ContactFormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<ContactFormField | null>(null);

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      field_label: "",
      field_name: "",
      field_type: "text",
      is_required: true,
      options: "",
      display_order: 0,
    },
  });

  const watchFieldType = form.watch("field_type");

  const fetchFields = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_form_fields").select("*").order("display_order");
    if (error) {
      toast.error("Failed to load form fields");
    } else {
      setFields(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const openAddDialog = () => {
    setEditingField(null);
    form.reset({ 
      field_label: "", 
      field_name: "", 
      field_type: "text", 
      is_required: true, 
      options: "", 
      display_order: fields.length 
    });
    setDialogOpen(true);
  };

  const openEditDialog = (field: ContactFormField) => {
    setEditingField(field);
    form.reset({
      field_label: field.field_label,
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required,
      options: field.options ? field.options.join(", ") : "",
      display_order: field.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form field? This will NOT delete existing submissions, but they will lack context for this field.")) return;
    
    const { error } = await supabase.from("contact_form_fields").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete field");
    } else {
      toast.success("Field deleted");
      fetchFields();
    }
  };

  const onSubmit = async (values: FieldFormValues) => {
    const dataToSave = {
      field_label: values.field_label,
      field_name: values.field_name,
      field_type: values.field_type,
      is_required: values.is_required,
      display_order: values.display_order,
      options: values.field_type === "select" && values.options 
        ? values.options.split(",").map(s => s.trim()).filter(s => s) 
        : null
    };

    if (editingField) {
      const { error } = await supabase.from("contact_form_fields").update(dataToSave).eq("id", editingField.id);
      if (error) toast.error(`Failed to update field: ${error.message}`);
      else {
        toast.success("Field updated");
        setDialogOpen(false);
        fetchFields();
      }
    } else {
      const { error } = await supabase.from("contact_form_fields").insert(dataToSave);
      if (error) toast.error(`Failed to add field: ${error.message}`);
      else {
        toast.success("Field added");
        setDialogOpen(false);
        fetchFields();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Form Builder</h1>
          <p className="text-muted-foreground mt-1">Configure the fields shown on the public contact form.</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="w-16 font-medium">Order</TableHead>
                <TableHead className="font-medium">Label</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Required</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <p>No fields defined. Your contact form is empty.</p>
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-muted-foreground/70">{field.display_order}</TableCell>
                    <TableCell>
                      <div className="font-medium">{field.field_label}</div>
                      <div className="text-xs text-muted-foreground font-mono">{field.field_name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary/50 text-secondary-foreground">
                        {field.field_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {field.is_required ? (
                        <span className="text-primary text-xs font-bold uppercase tracking-wider">Yes</span>
                      ) : (
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(field)}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(field.id)}>
                        <Trash2 className="w-4 h-4 text-destructive/80 hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Live Preview */}
        <div className="bg-card rounded-xl border border-border p-6 sticky top-6">
          <h3 className="font-display font-bold text-lg mb-6 border-b border-border pb-4">Live Preview</h3>
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium opacity-80">
                  {field.field_label} {field.is_required && <span className="text-primary">*</span>}
                </label>
                {field.field_type === 'textarea' ? (
                  <Textarea disabled className="bg-background/50 min-h-[80px]" placeholder={`Enter ${field.field_label.toLowerCase()}`} />
                ) : field.field_type === 'select' ? (
                  <Select disabled>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </Select>
                ) : (
                  <Input disabled className="bg-background/50" placeholder={`Enter ${field.field_label.toLowerCase()}`} />
                )}
              </div>
            ))}
            <Button disabled className="w-full mt-4">Submit</Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingField ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="field_label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl><Input placeholder="e.g. First Name" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="field_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database Key</FormLabel>
                    <FormControl><Input placeholder="e.g. first_name" className="bg-background/50 font-mono text-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="field_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text (Single Line)</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="textarea">Textarea (Multi Line)</SelectItem>
                        <SelectItem value="select">Dropdown (Select)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="display_order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl><Input type="number" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {watchFieldType === "select" && (
                <FormField control={form.control} name="options" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dropdown Options</FormLabel>
                    <FormControl>
                      <Input placeholder="Option 1, Option 2, Option 3" className="bg-background/50" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Comma separated list of options.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="is_required" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-background/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Required Field</FormLabel>
                    <div className="text-sm text-muted-foreground">Must the user fill this out?</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <div className="flex justify-end pt-4 gap-3">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingField ? "Update Field" : "Add Field"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
