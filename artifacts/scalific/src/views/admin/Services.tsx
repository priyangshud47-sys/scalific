"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Service } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const IconPreview = ({ value, title, className = "w-6 h-6" }: { value: string | null | undefined; title: string | undefined; className?: string }) => {
  const trimmed = value?.trim();
  if (trimmed && (trimmed.startsWith("<svg") || trimmed.startsWith("<SVG"))) {
    return (
      <div 
        className={`${className} flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full text-primary`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  const name = trimmed || title?.split(" ")[0] || "Activity";
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.Activity;
  return <IconComponent className={`${className} text-primary`} />;
};

const serviceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  icon_url: z.string().optional(),
  display_order: z.coerce.number().int(),
  is_active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      icon_url: "",
      display_order: 0,
      is_active: true,
    },
  });

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("display_order");
    if (error) {
      toast.error("Failed to load services");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddDialog = () => {
    setEditingService(null);
    form.reset({ title: "", description: "", icon_url: "", display_order: services.length, is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    form.reset({
      title: service.title,
      description: service.description || "",
      icon_url: service.icon_url || "",
      display_order: service.display_order,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete service");
    } else {
      toast.success("Service deleted");
      fetchServices();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("services").update({ is_active: !currentStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      fetchServices();
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    if (editingService) {
      const { error } = await supabase.from("services").update(values).eq("id", editingService.id);
      if (error) toast.error(`Failed to update service: ${error.message}`);
      else {
        toast.success("Service updated");
        setDialogOpen(false);
        fetchServices();
      }
    } else {
      const { error } = await supabase.from("services").insert(values);
      if (error) toast.error(`Failed to create service: ${error.message}`);
      else {
        toast.success("Service created");
        setDialogOpen(false);
        fetchServices();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">Manage the core expertise offerings shown on the public site.</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border">
              <TableHead className="w-20 font-medium">Order</TableHead>
              <TableHead className="w-16 font-medium text-center">Icon</TableHead>
              <TableHead className="font-medium">Title</TableHead>
              <TableHead className="w-[40%] font-medium">Description</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p>No services found. Add one to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-mono text-muted-foreground/70">{service.display_order}</TableCell>
                  <TableCell className="text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                      <IconPreview value={service.icon_url} title={service.title} className="w-5 h-5" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{service.title}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[300px]">
                    {service.description}
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={service.is_active} 
                      onCheckedChange={() => toggleActive(service.id, service.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
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
        <DialogContent className="sm:max-w-[500px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Performance Marketing" className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Service description..." className="resize-none bg-background/50 min-h-[100px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="icon_url" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Icon (SVG code or Lucide icon name)</FormLabel>
                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded text-xs">
                      <span className="text-muted-foreground font-medium">Live Preview:</span>
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <IconPreview value={form.watch("icon_url")} title={form.watch("title")} className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste raw SVG markup (starts with <svg) or enter Lucide name (e.g. Activity)" 
                      className="bg-background/50 font-mono text-xs min-h-[90px]" 
                      {...field} 
                    />
                  </FormControl>
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

              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-background/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">Is this service visible on the public site?</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <div className="flex justify-end pt-4 gap-3">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingService ? "Update Service" : "Create Service"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
