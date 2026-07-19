"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Testimonial } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, Quote, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const testimonialSchema = z.object({
  quote: z.string().min(1, "Quote is required"),
  author_name: z.string().min(1, "Author name is required"),
  author_title: z.string().optional(),
  company: z.string().optional(),
  display_order: z.coerce.number().int(),
  is_active: z.boolean().default(true),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      quote: "",
      author_name: "",
      author_title: "",
      company: "",
      display_order: 0,
      is_active: true,
    },
  });

  const fetchTestimonials = async () => {
    setLoading(true);
    setTableMissing(false);
    const { data, error } = await supabase.from("testimonials").select("*").order("display_order");

    if (error) {
      if (error.message?.includes("does not exist") || error.message?.includes("schema cache")) {
        setTableMissing(true);
      } else {
        toast.error(`Failed to load testimonials: ${error.message}`);
      }
    } else {
      setTestimonials(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const openAddDialog = () => {
    setEditingTestimonial(null);
    form.reset({
      quote: "",
      author_name: "",
      author_title: "",
      company: "",
      display_order: testimonials.length,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    form.reset({
      quote: testimonial.quote,
      author_name: testimonial.author_name,
      author_title: testimonial.author_title || "",
      company: testimonial.company || "",
      display_order: testimonial.display_order,
      is_active: testimonial.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      toast.error(`Failed to delete testimonial: ${error.message}`);
    } else {
      toast.success("Testimonial deleted");
      fetchTestimonials();
    }
  };

  const toggleActive = async (testimonial: Testimonial) => {
    const { error } = await supabase
      .from("testimonials")
      .update({ is_active: !testimonial.is_active })
      .eq("id", testimonial.id);

    if (error) {
      toast.error(`Failed to update testimonial: ${error.message}`);
    } else {
      fetchTestimonials();
    }
  };

  const onSubmit = async (values: TestimonialFormValues) => {
    const payload = {
      quote: values.quote,
      author_name: values.author_name,
      author_title: values.author_title || null,
      company: values.company || null,
      display_order: values.display_order,
      is_active: values.is_active,
    };

    if (editingTestimonial) {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", editingTestimonial.id);
      if (error) toast.error(`Failed to update testimonial: ${error.message}`);
      else {
        toast.success("Testimonial updated");
        setDialogOpen(false);
        fetchTestimonials();
      }
    } else {
      const { error } = await supabase.from("testimonials").insert(payload);
      if (error) toast.error(`Failed to create testimonial: ${error.message}`);
      else {
        toast.success("Testimonial created");
        setDialogOpen(false);
        fetchTestimonials();
      }
    }
  };

  if (tableMissing) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground mt-1">Manage client quotes shown on the public homepage carousel.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          <h2 className="font-display font-bold text-xl mb-2">Database update required</h2>
          <p className="text-sm leading-relaxed">
            The testimonials table is missing. Run the updated `supabase-migration.sql` in Supabase, then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground mt-1">Add, edit, reorder, and publish homepage client quotes.</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Testimonial
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border">
              <TableHead className="w-20 font-medium">Order</TableHead>
              <TableHead className="font-medium">Quote</TableHead>
              <TableHead className="font-medium">Author</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
            ) : testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Quote className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p>No testimonials yet. Add one to replace the default homepage quotes.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((testimonial) => (
                <TableRow key={testimonial.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-mono text-muted-foreground/70">{testimonial.display_order}</TableCell>
                  <TableCell className="max-w-[520px] truncate">{testimonial.quote}</TableCell>
                  <TableCell>
                    <div className="font-medium">{testimonial.author_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[testimonial.author_title, testimonial.company].filter(Boolean).join(", ")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={testimonial.is_active} onCheckedChange={() => toggleActive(testimonial)} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(testimonial)}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(testimonial.id)}>
                      <Trash2 className="w-4 h-4 text-destructive/80 hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
              <FormField control={form.control} name="quote" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Client quote..." className="resize-none bg-background/50 min-h-[140px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="author_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author Name</FormLabel>
                    <FormControl><Input placeholder="Dana Whitfield" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="author_title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author Title</FormLabel>
                    <FormControl><Input placeholder="Marketing Lead" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl><Input placeholder="Verdant Co." className="bg-background/50" {...field} /></FormControl>
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

              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-background/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Published</FormLabel>
                    <div className="text-sm text-muted-foreground">Show this testimonial on the public homepage.</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <div className="flex justify-end pt-4 gap-3">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingTestimonial ? "Update Testimonial" : "Create Testimonial"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
