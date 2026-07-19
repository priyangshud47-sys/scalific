"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContactSubmission } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Inbox, Calendar, Filter, RefreshCw, CheckCircle2, PhoneCall, Trash2, ShieldAlert, Loader2, CalendarClock, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, subDays, startOfDay } from "date-fns";
import { logActivity } from "@/lib/logger";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicKeys, setDynamicKeys] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customDate, setCustomDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Status Change Dialog State
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedSubForStatus, setSelectedSubForStatus] = useState<ContactSubmission | null>(null);
  const [statusChoice, setStatusChoice] = useState<"CALLED" | "FOLLOW_UP" | "PENDING">("CALLED");
  const [followUpNote, setFollowUpNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      toast.error("Failed to load submissions");
    } else {
      setSubmissions(data || []);
      
      const keys = new Set<string>();
      data?.forEach(sub => {
        Object.keys(sub.data || {}).forEach(key => {
          if (
            key !== "status" &&
            key !== "is_called" &&
            key !== "called_at" &&
            key !== "called_by" &&
            key !== "follow_up_note" &&
            key !== "follow_up_at"
          ) {
            keys.add(key);
          }
        });
      });
      setDynamicKeys(Array.from(keys));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const formatKeyName = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (dateFilter === "all") return true;
    const subDate = new Date(sub.submitted_at);
    
    if (dateFilter === "today") return isToday(subDate);
    if (dateFilter === "yesterday") return isYesterday(subDate);
    if (dateFilter === "7days") return subDate >= subDays(startOfDay(new Date()), 7);
    if (dateFilter === "30days") return subDate >= subDays(startOfDay(new Date()), 30);
    if (dateFilter === "custom" && customDate) {
      return format(subDate, "yyyy-MM-dd") === customDate;
    }
    return true;
  });

  const allFilteredSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((sub) => selectedIds.includes(sub.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSubmissions.map((sub) => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const getStatus = (sub: ContactSubmission): "CALLED" | "FOLLOW_UP" | "PENDING" => {
    if (sub.data?.status === "CALLED" || sub.data?.is_called === true) return "CALLED";
    if (sub.data?.status === "FOLLOW_UP") return "FOLLOW_UP";
    return "PENDING";
  };

  const isProcessed = (sub: ContactSubmission) => {
    const s = getStatus(sub);
    return s === "CALLED" || s === "FOLLOW_UP";
  };

  const getSubEmailOrName = (sub: ContactSubmission) => {
    return sub.data?.email || sub.data?.name || sub.data?.phone || `ID: ${sub.id.substring(0, 8)}`;
  };

  const openStatusDialog = (sub: ContactSubmission) => {
    setSelectedSubForStatus(sub);
    setStatusChoice(getStatus(sub));
    setFollowUpNote(sub.data?.follow_up_note || "");
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedSubForStatus) return;
    setSavingStatus(true);
    const sub = selectedSubForStatus;
    const subIdentifier = getSubEmailOrName(sub);

    const updatedData = {
      ...sub.data,
      status: statusChoice,
      is_called: statusChoice === "CALLED",
      called_at: statusChoice === "CALLED" ? new Date().toISOString() : sub.data?.called_at || null,
      follow_up_note: statusChoice === "FOLLOW_UP" ? followUpNote.trim() : null,
      follow_up_at: statusChoice === "FOLLOW_UP" ? new Date().toISOString() : null,
    };

    // Optimistic UI state update
    setSubmissions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, data: updatedData } : s))
    );

    const { error } = await supabase
      .from("contact_submissions")
      .update({ data: updatedData })
      .eq("id", sub.id);

    setSavingStatus(false);
    setStatusDialogOpen(false);

    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
      fetchSubmissions(); // Rollback if DB write fails
    } else {
      if (statusChoice === "CALLED") {
        toast.success(`Marked Done: Client ${subIdentifier} has been called!`);
        await logActivity(
          "UPDATE",
          "Submissions",
          `Marked submission for ${subIdentifier} as Client Called`
        );
      } else if (statusChoice === "FOLLOW_UP") {
        toast.success(`Follow Up Saved for ${subIdentifier}!`);
        await logActivity(
          "UPDATE",
          "Submissions",
          `Marked submission for ${subIdentifier} for Follow Up (${followUpNote.trim() || "No note"})`
        );
      } else {
        toast.info(`Marked ${subIdentifier} as Pending Contact`);
        await logActivity(
          "UPDATE",
          "Submissions",
          `Reverted submission for ${subIdentifier} back to Pending`
        );
      }
    }
  };

  // Single Delete Guard: Block deletion unless Marked Done or Follow Up
  const handleDeleteOne = async (sub: ContactSubmission) => {
    const subIdentifier = getSubEmailOrName(sub);

    // Guard Rule: Cannot delete unless marked CALLED or FOLLOW_UP
    if (!isProcessed(sub)) {
      toast.error(
        `Cannot delete submission for ${subIdentifier}! You must mark status as "Client Called" or "Follow Up Needed" first before deleting.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete submission for ${subIdentifier}?`)) return;

    // Optimistically remove from state immediately so UI updates cleanly without flickering
    setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    setSelectedIds((prev) => prev.filter((id) => id !== sub.id));

    const { error } = await supabase.from("contact_submissions").delete().eq("id", sub.id);

    if (error) {
      toast.error(`Failed to delete submission: ${error.message}`);
      fetchSubmissions(); // Rollback if DB delete fails
    } else {
      toast.success(`Submission for ${subIdentifier} deleted`);
      await logActivity("DELETE", "Submissions", `Deleted submission for ${subIdentifier}`);
    }
  };

  // Bulk Delete Guard: Block deletion if ANY selected item is NOT marked done or follow-up
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const selectedSubs = submissions.filter((sub) => selectedIds.includes(sub.id));
    const uncalledSubs = selectedSubs.filter((sub) => !isProcessed(sub));

    if (uncalledSubs.length > 0) {
      const sampleNames = uncalledSubs
        .slice(0, 2)
        .map((s) => getSubEmailOrName(s))
        .join(", ");
      
      toast.error(
        `Cannot delete! ${uncalledSubs.length} selected submission(s) (e.g. ${sampleNames}) are NOT marked done or follow-up. Please mark them done or follow-up first before deleting.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected submission(s)?`)) return;

    // Optimistically remove selected items from UI state immediately
    setSubmissions((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
    const idsToDelete = [...selectedIds];
    setSelectedIds([]);

    setBulkProcessing(true);
    const { error } = await supabase.from("contact_submissions").delete().in("id", idsToDelete);
    setBulkProcessing(false);

    if (error) {
      toast.error(`Failed to bulk delete submissions: ${error.message}`);
      fetchSubmissions(); // Rollback on error
    } else {
      toast.success(`Successfully deleted ${idsToDelete.length} submission(s)`);
      await logActivity(
        "DELETE",
        "Submissions",
        `Bulk deleted ${idsToDelete.length} submission(s)`
      );
    }
  };

  // Bulk Mark Called
  const handleBulkMarkCalled = async () => {
    if (selectedIds.length === 0) return;

    setBulkProcessing(true);
    const selectedSubs = submissions.filter((sub) => selectedIds.includes(sub.id));

    let updatedCount = 0;
    for (const sub of selectedSubs) {
      const updatedData = {
        ...sub.data,
        status: "CALLED",
        is_called: true,
        called_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("contact_submissions")
        .update({ data: updatedData })
        .eq("id", sub.id);

      if (!error) updatedCount++;
    }

    setBulkProcessing(false);
    toast.success(`Marked ${updatedCount} submission(s) as Client Called / Done!`);
    await logActivity(
      "UPDATE",
      "Submissions",
      `Bulk marked ${updatedCount} submission(s) as Client Called`
    );
    fetchSubmissions();
  };

  // Bulk Mark Follow Up
  const handleBulkMarkFollowUp = async () => {
    if (selectedIds.length === 0) return;

    setBulkProcessing(true);
    const selectedSubs = submissions.filter((sub) => selectedIds.includes(sub.id));

    let updatedCount = 0;
    for (const sub of selectedSubs) {
      const updatedData = {
        ...sub.data,
        status: "FOLLOW_UP",
        is_called: false,
        follow_up_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("contact_submissions")
        .update({ data: updatedData })
        .eq("id", sub.id);

      if (!error) updatedCount++;
    }

    setBulkProcessing(false);
    toast.success(`Marked ${updatedCount} submission(s) for Follow Up!`);
    await logActivity(
      "UPDATE",
      "Submissions",
      `Bulk marked ${updatedCount} submission(s) for Follow Up`
    );
    fetchSubmissions();
  };

  const exportCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast.error("No submissions to export for selected filter");
      return;
    }

    const headers = ["ID", "Submitted Date", "Submitted Time", "Call Status", "Follow Up Notes", ...dynamicKeys];
    
    const rows = filteredSubmissions.map(sub => {
      const subDate = new Date(sub.submitted_at);
      const rowData = [
        sub.id,
        format(subDate, "yyyy-MM-dd"),
        format(subDate, "HH:mm:ss"),
        getStatus(sub),
        `"${String(sub.data?.follow_up_note || "").replace(/"/g, '""')}"`,
        ...dynamicKeys.map(key => {
          const val = sub.data[key] || "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
      ];
      return rowData.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scalific_submissions_${dateFilter}_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredSubmissions.length} submission(s) to CSV`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Form Submissions</h1>
          <p className="text-muted-foreground mt-1">
            Track lead calls, schedule customer follow-ups, and manage submission records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportCSV} className="gap-2" disabled={loading || filteredSubmissions.length === 0}>
            <Download className="w-4 h-4" />
            Download CSV ({filteredSubmissions.length})
          </Button>
        </div>
      </div>

      {/* Filter & Bulk Actions Bar */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter By Day:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
              { id: "custom", label: "Custom Date" },
            ].map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant={dateFilter === preset.id ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter(preset.id)}
                className="text-xs h-8"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 py-1">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="border-none bg-transparent h-7 text-xs focus-visible:ring-0 px-0"
              />
            </div>
          )}
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/10 gap-3">
            <span className="text-xs font-semibold text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{selectedIds.length} submission(s) selected</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkCalled}
                disabled={bulkProcessing}
                className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-8"
              >
                {bulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                Mark Called / Done
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkFollowUp}
                disabled={bulkProcessing}
                className="text-xs gap-1.5 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 h-8"
              >
                {bulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
                Mark Follow Up Needed
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                className="text-xs gap-1.5 h-8"
              >
                {bulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Bulk Delete Selected ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t border-border/50 pt-3 flex items-center justify-between">
          <span>
            Showing <strong className="text-foreground">{filteredSubmissions.length}</strong> of{" "}
            <strong className="text-foreground">{submissions.length}</strong> total submissions
          </span>
          {dateFilter !== "all" && (
            <button
              onClick={() => setDateFilter("all")}
              className="text-primary hover:underline font-medium text-xs"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all submissions"
                  />
                </TableHead>
                <TableHead className="font-medium min-w-[170px]">Submitted Date & Time</TableHead>
                <TableHead className="font-medium min-w-[180px]">Client Call Status</TableHead>
                {dynamicKeys.map(key => (
                  <TableHead key={key} className="font-medium whitespace-nowrap">
                    {formatKeyName(key)}
                  </TableHead>
                ))}
                <TableHead className="font-medium text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    {dynamicKeys.length > 0 ? dynamicKeys.map((k, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                    )) : (
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    )}
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(3, dynamicKeys.length + 3)} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No submissions found.</p>
                      <p className="text-sm">
                        {dateFilter !== "all"
                          ? "No submissions matched your selected date filter."
                          : "When users fill out your contact form, they will appear here."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => {
                  const status = getStatus(sub);
                  const isSelected = selectedIds.includes(sub.id);
                  const processed = isProcessed(sub);

                  return (
                    <TableRow
                      key={sub.id}
                      className={`hover:bg-muted/10 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(sub.id, Boolean(checked))}
                          aria-label={`Select submission ${sub.id}`}
                        />
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(sub.submitted_at), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openStatusDialog(sub)}
                            disabled={updatingId === sub.id}
                            className={`h-7 px-2.5 text-xs font-semibold rounded-full border transition-all ${
                              status === "CALLED"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                                : status === "FOLLOW_UP"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                            }`}
                          >
                            {status === "CALLED" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            ) : status === "FOLLOW_UP" ? (
                              <CalendarClock className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <PhoneCall className="w-3.5 h-3.5 mr-1" />
                            )}
                            {status === "CALLED"
                              ? "Client Called ✓"
                              : status === "FOLLOW_UP"
                              ? "Follow Up 📅"
                              : "Mark Done / Status"}
                          </Button>

                          {sub.data?.follow_up_note && (
                            <span className="text-[10px] text-blue-600 font-medium truncate max-w-[160px]" title={sub.data.follow_up_note}>
                              💬 {sub.data.follow_up_note}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {dynamicKeys.map((key) => (
                        <TableCell
                          key={key}
                          className="max-w-[300px] truncate text-sm"
                          title={String(sub.data[key] || "")}
                        >
                          {sub.data[key] || <span className="text-muted-foreground/30">-</span>}
                        </TableCell>
                      ))}

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOne(sub)}
                          title={
                            processed
                              ? "Delete Submission"
                              : "Mark Done (Client Called / Follow Up) first to enable deletion"
                          }
                          className={`h-8 w-8 ${
                            processed
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-muted-foreground/40 hover:text-destructive/50"
                          }`}
                        >
                          {processed ? <Trash2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4 text-amber-500/70" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary" />
              <span>Update Customer Call Status</span>
            </DialogTitle>
          </DialogHeader>

          {selectedSubForStatus && (
            <div className="space-y-5 pt-3">
              <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs space-y-1">
                <p className="font-semibold text-foreground">{getSubEmailOrName(selectedSubForStatus)}</p>
                <p className="text-muted-foreground">
                  Submitted: {format(new Date(selectedSubForStatus.submitted_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Select Call Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusChoice("CALLED")}
                    className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                      statusChoice === "CALLED"
                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-500"
                        : "bg-background border-border hover:bg-muted/50"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Client Called ✓</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusChoice("FOLLOW_UP")}
                    className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                      statusChoice === "FOLLOW_UP"
                        ? "bg-blue-500/20 text-blue-600 border-blue-500"
                        : "bg-background border-border hover:bg-muted/50"
                    }`}
                  >
                    <CalendarClock className="w-5 h-5" />
                    <span>Follow Up 📅</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusChoice("PENDING")}
                    className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                      statusChoice === "PENDING"
                        ? "bg-amber-500/20 text-amber-600 border-amber-500"
                        : "bg-background border-border hover:bg-muted/50"
                    }`}
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span>Pending ⏳</span>
                  </button>
                </div>
              </div>

              {statusChoice === "FOLLOW_UP" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Follow Up Note / Scheduled Time
                  </label>
                  <Input
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    placeholder="e.g. Call back Friday at 3:00 PM (wants custom quote)"
                    className="bg-background/50 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveStatus} disabled={savingStatus} className="gap-2">
                  {savingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingStatus ? "Saving..." : "Save Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
