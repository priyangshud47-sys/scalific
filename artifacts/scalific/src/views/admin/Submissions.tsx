"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContactSubmission } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, Inbox, Calendar, Filter, RefreshCw, CheckCircle2, PhoneCall, Trash2, ShieldAlert, Loader2 } from "lucide-react";
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

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
          if (key !== "status" && key !== "is_called" && key !== "called_at" && key !== "called_by") {
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
      const allIds = filteredSubmissions.map((sub) => sub.id);
      setSelectedIds(allIds);
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

  const isCalled = (sub: ContactSubmission) => {
    return sub.data?.status === "CALLED" || sub.data?.is_called === true;
  };

  const getSubEmailOrName = (sub: ContactSubmission) => {
    return sub.data?.email || sub.data?.name || sub.data?.phone || `ID: ${sub.id.substring(0, 8)}`;
  };

  // Toggle Mark Done / Client Called for single submission
  const toggleMarkDone = async (sub: ContactSubmission) => {
    setTogglingId(sub.id);
    const currentlyCalled = isCalled(sub);
    const newStatus = currentlyCalled ? "PENDING" : "CALLED";
    const subIdentifier = getSubEmailOrName(sub);

    const updatedData = {
      ...sub.data,
      status: newStatus,
      is_called: newStatus === "CALLED",
      called_at: newStatus === "CALLED" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("contact_submissions")
      .update({ data: updatedData })
      .eq("id", sub.id);

    setTogglingId(null);

    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
    } else {
      if (newStatus === "CALLED") {
        toast.success(`Marked Done: Client ${subIdentifier} has been called!`);
        await logActivity(
          "UPDATE",
          "Submissions",
          `Marked submission for ${subIdentifier} as Client Called`
        );
      } else {
        toast.info(`Marked ${subIdentifier} as Pending Contact`);
        await logActivity(
          "UPDATE",
          "Submissions",
          `Reverted submission for ${subIdentifier} back to Pending`
        );
      }
      fetchSubmissions();
    }
  };

  // Single Delete Guard: Block deletion unless Marked Done (Client Called)
  const handleDeleteOne = async (sub: ContactSubmission) => {
    const subIdentifier = getSubEmailOrName(sub);

    // Guard Rule: Cannot delete unless marked done
    if (!isCalled(sub)) {
      toast.error(
        `Cannot delete submission for ${subIdentifier}! You must click "Mark Done (Client Called)" first before deleting.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete submission for ${subIdentifier}?`)) return;

    const { error } = await supabase.from("contact_submissions").delete().eq("id", sub.id);
    if (error) {
      toast.error("Failed to delete submission");
    } else {
      toast.success(`Submission for ${subIdentifier} deleted`);
      await logActivity("DELETE", "Submissions", `Deleted submission for ${subIdentifier}`);
      setSelectedIds((prev) => prev.filter((id) => id !== sub.id));
      fetchSubmissions();
    }
  };

  // Bulk Delete Guard: Block deletion if ANY selected item is NOT marked done
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const selectedSubs = submissions.filter((sub) => selectedIds.includes(sub.id));
    const uncalledSubs = selectedSubs.filter((sub) => !isCalled(sub));

    // Guard Rule Check: If any item is uncalled, block bulk deletion
    if (uncalledSubs.length > 0) {
      const sampleNames = uncalledSubs
        .slice(0, 2)
        .map((s) => getSubEmailOrName(s))
        .join(", ");
      
      toast.error(
        `Cannot delete! ${uncalledSubs.length} selected submission(s) (e.g. ${sampleNames}) are NOT marked done (Client Called). Please mark them done first before deleting.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected submission(s)?`)) return;

    setBulkProcessing(true);
    const { error } = await supabase.from("contact_submissions").delete().in("id", selectedIds);
    setBulkProcessing(false);

    if (error) {
      toast.error(`Failed to bulk delete submissions: ${error.message}`);
    } else {
      toast.success(`Successfully deleted ${selectedIds.length} submission(s)`);
      await logActivity(
        "DELETE",
        "Submissions",
        `Bulk deleted ${selectedIds.length} submission(s)`
      );
      setSelectedIds([]);
      fetchSubmissions();
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

  const exportCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast.error("No submissions to export for selected filter");
      return;
    }

    const headers = ["ID", "Submitted Date", "Submitted Time", "Call Status", ...dynamicKeys];
    
    const rows = filteredSubmissions.map(sub => {
      const subDate = new Date(sub.submitted_at);
      const rowData = [
        sub.id,
        format(subDate, "yyyy-MM-dd"),
        format(subDate, "HH:mm:ss"),
        isCalled(sub) ? "CALLED / DONE" : "PENDING",
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
            Track lead calls, mark client calls as done, and manage submission records safely.
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

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkCalled}
                disabled={bulkProcessing}
                className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 h-8"
              >
                {bulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                Mark Selected Called / Done
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
                <TableHead className="font-medium min-w-[150px]">Client Call Status</TableHead>
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
                  const called = isCalled(sub);
                  const isSelected = selectedIds.includes(sub.id);

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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleMarkDone(sub)}
                          disabled={togglingId === sub.id}
                          className={`h-7 px-2.5 text-xs font-semibold rounded-full border transition-all ${
                            called
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                        >
                          {togglingId === sub.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : called ? (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          ) : (
                            <PhoneCall className="w-3.5 h-3.5 mr-1" />
                          )}
                          {called ? "Client Called ✓" : "Mark Done (Call)"}
                        </Button>
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
                            called
                              ? "Delete Submission"
                              : "Mark Done (Client Called) first to enable deletion"
                          }
                          className={`h-8 w-8 ${
                            called
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-muted-foreground/40 hover:text-destructive/50"
                          }`}
                        >
                          {called ? <Trash2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4 text-amber-500/70" />}
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
    </div>
  );
}
