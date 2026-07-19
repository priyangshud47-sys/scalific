"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck, Plus, Trash2, Edit2, Loader2, Users, Lock, Clock, CheckCircle2, XCircle, AlertTriangle, KeyRound, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { logActivity } from "@/lib/logger";

const ALL_SECTIONS = [
  { id: "/admin/services", label: "Services" },
  { id: "/admin/team", label: "Team" },
  { id: "/admin/content", label: "Content" },
  { id: "/admin/testimonials", label: "Testimonials" },
  { id: "/admin/contact-form", label: "Contact Form" },
  { id: "/admin/contact-info", label: "Contact Info" },
  { id: "/admin/branding", label: "Branding" },
  { id: "/admin/seo-geo", label: "SEO & GEO" },
  { id: "/admin/colors", label: "Colors" },
  { id: "/admin/submissions", label: "Submissions" },
  { id: "/admin/employees", label: "Employees" },
  { id: "/admin/tracking", label: "Tracking" },
  { id: "/admin/activity", label: "Activity Logs" },
  { id: "/admin/security", label: "2FA Security" },
  { id: "/admin/setup", label: "DB Setup" },
];

type EmployeeRecord = {
  id: string;
  user_email: string;
  role_title: string;
  is_super_admin: boolean;
  allowed_sections: string[];
  created_at: string;
};

type PermissionRequest = {
  id: string;
  requested_by: string;
  request_type: "CREATE" | "UPDATE" | "DELETE";
  target_email: string;
  payload: any;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isCurrentSuperAdmin, setIsCurrentSuperAdmin] = useState<boolean>(true);

  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Employee");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(ALL_SECTIONS.map((s) => s.id));

  // Password Reset State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [targetPasswordEmail, setTargetPasswordEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const openPasswordDialog = (emp: EmployeeRecord) => {
    setTargetPasswordEmail(emp.user_email);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordDialogOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please check and try again.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: targetPasswordEmail,
          newPassword,
          adminEmail: currentUserEmail,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update password");

      toast.success(`Password for ${targetPasswordEmail} updated successfully!`);
      await logActivity(
        "UPDATE",
        "Employees",
        `Super Admin changed password for employee ${targetPasswordEmail}`
      );
      setPasswordDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update employee password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const activeEmail = sessionData?.session?.user?.email?.toLowerCase() || null;
    setCurrentUserEmail(activeEmail);

    let isSuper = true;
    if (activeEmail) {
      const { data: userPerm } = await supabase
        .from("employee_permissions")
        .select("is_super_admin")
        .eq("user_email", activeEmail)
        .maybeSingle();

      if (userPerm) {
        isSuper = Boolean(userPerm.is_super_admin);
      }
    }
    setIsCurrentSuperAdmin(isSuper);

    const { data, error } = await supabase
      .from("employee_permissions")
      .select("*")
      .order("created_at", { ascending: false });

    let list: EmployeeRecord[] = data ? [...data] : [];

    if (activeEmail) {
      const exists = list.some((emp) => emp.user_email.toLowerCase() === activeEmail);
      if (!exists) {
        const superAdminRecord: EmployeeRecord = {
          id: "current-super-admin",
          user_email: activeEmail,
          role_title: "Super Admin",
          is_super_admin: true,
          allowed_sections: ALL_SECTIONS.map((s) => s.id),
          created_at: new Date().toISOString(),
        };
        list = [superAdminRecord, ...list];

        await supabase.from("employee_permissions").upsert(
          {
            user_email: activeEmail,
            role_title: "Super Admin",
            is_super_admin: true,
            allowed_sections: ALL_SECTIONS.map((s) => s.id),
          },
          { onConflict: "user_email" }
        );
      }
    }

    // Shielding Rule: If NOT Super Admin, filter out all Super Admin records
    if (!isSuper) {
      list = list.filter((emp) => !emp.is_super_admin);
    }

    setEmployees(list);

    // Fetch Pending Approval Requests if Super Admin
    if (isSuper) {
      const { data: reqData } = await supabase
        .from("permission_requests")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      setPendingRequests((reqData as PermissionRequest[]) || []);
    } else {
      setPendingRequests([]);
    }

    if (error && list.length === 0) {
      toast.error("Failed to load employee access records");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddDialog = () => {
    setEditingId(null);
    setFormEmail("");
    setFormRole("Employee");
    setIsSuperAdmin(false);
    setSelectedSections(ALL_SECTIONS.map((s) => s.id));
    setDialogOpen(true);
  };

  const openEditDialog = (emp: EmployeeRecord) => {
    if (!isCurrentSuperAdmin && emp.is_super_admin) {
      toast.error("Super Admin accounts cannot be edited or viewed by regular employees.");
      return;
    }
    setEditingId(emp.id);
    setFormEmail(emp.user_email);
    setFormRole(emp.role_title || "Employee");
    setIsSuperAdmin(emp.is_super_admin);
    setSelectedSections(Array.isArray(emp.allowed_sections) ? emp.allowed_sections : []);
    setDialogOpen(true);
  };

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSave = async () => {
    if (!formEmail.trim()) {
      toast.error("Please enter employee email");
      return;
    }

    setSaving(true);
    const targetEmail = formEmail.trim().toLowerCase();
    const payload = {
      user_email: targetEmail,
      role_title: formRole.trim(),
      is_super_admin: isSuperAdmin,
      allowed_sections: isSuperAdmin ? ALL_SECTIONS.map((s) => s.id) : selectedSections,
    };

    if (isCurrentSuperAdmin) {
      // Direct update for Super Admin
      let error = null;
      if (editingId) {
        const res = await supabase.from("employee_permissions").update(payload).eq("id", editingId);
        error = res.error;
      } else {
        const res = await supabase.from("employee_permissions").insert(payload);
        error = res.error;
      }

      setSaving(false);
      if (error) {
        toast.error(`Failed to save permissions: ${error.message}`);
      } else {
        toast.success(editingId ? "Employee permissions updated" : "Employee added");
        await logActivity(
          editingId ? "UPDATE" : "CREATE",
          "Employees",
          `${editingId ? "Updated" : "Added"} permissions for ${targetEmail}`
        );
        setDialogOpen(false);
        fetchEmployees();
      }
    } else {
      // Non-SuperAdmin Request Flow: Submit permission request to Super Admin
      const { error } = await supabase.from("permission_requests").insert({
        requested_by: currentUserEmail || "employee",
        request_type: editingId ? "UPDATE" : "CREATE",
        target_email: targetEmail,
        payload: { ...payload, editingId },
        status: "PENDING",
      });

      setSaving(false);
      if (error) {
        toast.error(`Failed to submit request: ${error.message}`);
      } else {
        toast.success("Change request submitted to Super Admin for approval!");
        await logActivity(
          "CREATE",
          "Employees",
          `Submitted permission change request for ${targetEmail} to Super Admin`
        );
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async (emp: EmployeeRecord) => {
    if (!isCurrentSuperAdmin && emp.is_super_admin) {
      toast.error("Super Admin accounts cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to remove permissions for ${emp.user_email}?`)) return;

    if (isCurrentSuperAdmin) {
      const { error } = await supabase.from("employee_permissions").delete().eq("id", emp.id);
      if (error) {
        toast.error("Failed to delete employee permission record");
      } else {
        toast.success("Employee permissions removed");
        await logActivity("DELETE", "Employees", `Removed permissions for ${emp.user_email}`);
        fetchEmployees();
      }
    } else {
      // Submit Delete Request to Super Admin
      const { error } = await supabase.from("permission_requests").insert({
        requested_by: currentUserEmail || "employee",
        request_type: "DELETE",
        target_email: emp.user_email,
        payload: { id: emp.id },
        status: "PENDING",
      });

      if (error) {
        toast.error(`Failed to submit deletion request: ${error.message}`);
      } else {
        toast.success("Deletion request submitted to Super Admin for review!");
        await logActivity(
          "DELETE",
          "Employees",
          `Submitted deletion request for ${emp.user_email} to Super Admin`
        );
      }
    }
  };

  const handleApproveRequest = async (req: PermissionRequest) => {
    setProcessingReqId(req.id);
    let error = null;

    if (req.request_type === "DELETE") {
      const res = await supabase.from("employee_permissions").delete().eq("user_email", req.target_email);
      error = res.error;
    } else {
      const payload = req.payload;
      const cleanPayload = {
        user_email: payload.user_email,
        role_title: payload.role_title,
        is_super_admin: payload.is_super_admin,
        allowed_sections: payload.allowed_sections,
      };

      const res = await supabase
        .from("employee_permissions")
        .upsert(cleanPayload, { onConflict: "user_email" });
      error = res.error;
    }

    if (!error) {
      await supabase.from("permission_requests").update({ status: "APPROVED" }).eq("id", req.id);
      toast.success(`Request approved and applied for ${req.target_email}`);
      await logActivity(
        "UPDATE",
        "Employees",
        `Super Admin APPROVED permission change request for ${req.target_email}`
      );
      fetchEmployees();
    } else {
      toast.error(`Failed to approve request: ${error.message}`);
    }
    setProcessingReqId(null);
  };

  const handleRejectRequest = async (req: PermissionRequest) => {
    setProcessingReqId(req.id);
    const { error } = await supabase
      .from("permission_requests")
      .update({ status: "REJECTED" })
      .eq("id", req.id);

    setProcessingReqId(null);

    if (error) {
      toast.error("Failed to reject request");
    } else {
      toast.info(`Request for ${req.target_email} rejected`);
      await logActivity(
        "UPDATE",
        "Employees",
        `Super Admin REJECTED permission request for ${req.target_email}`
      );
      fetchEmployees();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-display font-bold tracking-tight">Employee Access Control (RBAC)</h1>
          </div>
          <p className="text-muted-foreground">
            Manage employee roles and section-level permissions. Non-superadmin employee changes require Super Admin approval.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Employee Permission
        </Button>
      </div>

      {/* Super Admin Approval Queue Card */}
      {isCurrentSuperAdmin && pendingRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
              <Clock className="w-4 h-4" />
              <span>Pending Super Admin Approval Requests ({pendingRequests.length})</span>
            </div>
            <span className="text-xs text-amber-600/80 font-medium">Action Required</span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{req.target_email}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {req.request_type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested by: <strong>{req.requested_by}</strong> • Role: {req.payload?.role_title || "Employee"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(req)}
                    disabled={processingReqId === req.id}
                    className="text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(req)}
                    disabled={processingReqId === req.id}
                    className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {processingReqId === req.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Approve & Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="font-medium min-w-[200px]">Employee Email</TableHead>
                <TableHead className="font-medium min-w-[140px]">Role Title</TableHead>
                <TableHead className="font-medium min-w-[120px]">Super Admin</TableHead>
                <TableHead className="font-medium min-w-[300px]">Allowed Sections</TableHead>
                <TableHead className="font-medium text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No employee permission rules created yet.</p>
                      <p className="text-sm">Click "Add Employee Permission" to restrict employee access to specific sections.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-medium text-sm text-foreground">
                      {emp.user_email}
                    </TableCell>
                    <TableCell className="text-xs text-primary font-semibold">
                      {emp.role_title || "Employee"}
                    </TableCell>
                    <TableCell>
                      {emp.is_super_admin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.is_super_admin ? (
                        <span className="text-xs font-semibold text-primary">All Sections Granted</span>
                      ) : Array.isArray(emp.allowed_sections) && emp.allowed_sections.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[360px]">
                          {emp.allowed_sections.map((secId) => {
                            const sec = ALL_SECTIONS.find((s) => s.id === secId);
                            return (
                              <span
                                key={secId}
                                className="px-2 py-0.5 rounded bg-muted/60 text-muted-foreground text-[10px] border border-border"
                              >
                                {sec ? sec.label : secId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-destructive">No Sections Granted</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCurrentSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPasswordDialog(emp)}
                            title="Change Employee Password"
                            className="text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(emp)}
                          disabled={!isCurrentSuperAdmin && emp.is_super_admin}
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(emp)}
                          disabled={!isCurrentSuperAdmin && emp.is_super_admin}
                          title="Remove Access"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Employee Permissions" : "Add Employee Access"}
              {!isCurrentSuperAdmin && (
                <span className="text-xs block text-amber-500 font-normal mt-1">
                  Note: Changes will be submitted to Super Admin for approval.
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Employee Email Address
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="employee@scalific.in"
                disabled={Boolean(editingId)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Role Title
              </label>
              <Input
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="e.g. Content Lead, SEO Specialist"
                className="bg-background/50"
              />
            </div>

            {isCurrentSuperAdmin && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <Checkbox
                  id="is_super_admin"
                  checked={isSuperAdmin}
                  onCheckedChange={(checked) => setIsSuperAdmin(Boolean(checked))}
                />
                <label htmlFor="is_super_admin" className="text-xs font-medium cursor-pointer">
                  Super Admin (Full unrestricted access to all sections)
                </label>
              </div>
            )}

            {!isSuperAdmin && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Allowed Admin Sections
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-3 border border-border rounded-lg bg-muted/10">
                  {ALL_SECTIONS.map((sec) => {
                    const isChecked = selectedSections.includes(sec.id);
                    return (
                      <div key={sec.id} className="flex items-center gap-2 text-xs">
                        <Checkbox
                          id={`sec_${sec.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleSection(sec.id)}
                        />
                        <label htmlFor={`sec_${sec.id}`} className="cursor-pointer">
                          {sec.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving
                  ? "Saving..."
                  : isCurrentSuperAdmin
                  ? "Save Employee Permissions"
                  : "Submit Change Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Change Employee Password</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-3">
            <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs space-y-1">
              <span className="text-muted-foreground block">Target Employee:</span>
              <span className="font-bold text-foreground block truncate">{targetPasswordEmail}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswordText ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  required
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirm New Password
              </label>
              <Input
                type={showPasswordText ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="bg-background/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingPassword} className="gap-2">
                {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
