"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { TeamMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Upload, X, Users } from "lucide-react";
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

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  photo_url: z.string().optional(),
  display_order: z.coerce.number().int(),
  is_active: z.boolean().default(true),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function AdminTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      role: "",
      bio: "",
      linkedin_url: "",
      photo_url: "",
      display_order: 0,
      is_active: true,
    },
  });

  const fetchTeam = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("team_members").select("*").order("display_order");
    if (error) {
      toast.error("Failed to load team members");
    } else {
      setTeam(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const openAddDialog = () => {
    setEditingMember(null);
    form.reset({ name: "", role: "", bio: "", linkedin_url: "", photo_url: "", display_order: team.length, is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    form.reset({
      name: member.name,
      role: member.role || "",
      bio: member.bio || "",
      linkedin_url: member.linkedin_url || "",
      photo_url: member.photo_url || "",
      display_order: member.display_order,
      is_active: member.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete member");
    } else {
      toast.success("Member deleted");
      fetchTeam();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("team_members").update({ is_active: !currentStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      fetchTeam();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from("team-photos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("team-photos").getPublicUrl(filePath);
      form.setValue("photo_url", publicUrl);
      toast.success("Photo uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: TeamFormValues) => {
    if (editingMember) {
      const { error } = await supabase.from("team_members").update(values).eq("id", editingMember.id);
      if (error) toast.error("Failed to update member");
      else {
        toast.success("Member updated");
        setDialogOpen(false);
        fetchTeam();
      }
    } else {
      const { error } = await supabase.from("team_members").insert(values);
      if (error) toast.error("Failed to add member");
      else {
        toast.success("Member added");
        setDialogOpen(false);
        fetchTeam();
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Team Roster</h1>
          <p className="text-muted-foreground mt-1">Manage the agency team members shown on the site.</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border">
              <TableHead className="w-16"></TableHead>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Role</TableHead>
              <TableHead className="w-20 font-medium">Order</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : team.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p>No team members found. Add one to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              team.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell>
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-display font-bold text-sm">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.role}</TableCell>
                  <TableCell className="font-mono text-muted-foreground/70">{member.display_order}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={member.is_active} 
                      onCheckedChange={() => toggleActive(member.id, member.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
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
            <DialogTitle className="font-display text-xl">{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
              
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium leading-none">Profile Photo</label>
                <div className="flex items-end gap-4">
                  {form.watch("photo_url") ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border">
                      <img src={form.watch("photo_url")} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => form.setValue("photo_url", "")}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center border border-dashed border-border">
                      <Upload className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs" 
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? "Uploading..." : form.watch("photo_url") ? "Change Photo" : "Upload Photo"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Jane Doe" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl><Input placeholder="Partner" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl><Textarea placeholder="Short biography..." className="resize-none bg-background/50 min-h-[80px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="linkedin_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl><Input placeholder="https://linkedin.com/in/..." className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="display_order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl><Input type="number" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex flex-col justify-center">
                    <FormLabel className="mb-3">Active Status</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className="text-sm text-muted-foreground">{field.value ? "Visible" : "Hidden"}</span>
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingMember ? "Update Member" : "Add Member"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
