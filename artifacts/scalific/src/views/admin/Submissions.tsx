"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContactSubmission } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Inbox, Calendar, Filter, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, subDays, startOfDay } from "date-fns";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicKeys, setDynamicKeys] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customDate, setCustomDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

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
        Object.keys(sub.data).forEach(key => keys.add(key));
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
    
    if (dateFilter === "today") {
      return isToday(subDate);
    }
    if (dateFilter === "yesterday") {
      return isYesterday(subDate);
    }
    if (dateFilter === "7days") {
      const sevenDaysAgo = subDays(startOfDay(new Date()), 7);
      return subDate >= sevenDaysAgo;
    }
    if (dateFilter === "30days") {
      const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
      return subDate >= thirtyDaysAgo;
    }
    if (dateFilter === "custom" && customDate) {
      const formattedSubDate = format(subDate, "yyyy-MM-dd");
      return formattedSubDate === customDate;
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast.error("No submissions to export for selected filter");
      return;
    }

    const headers = ["ID", "Submitted Date", "Submitted Time", ...dynamicKeys];
    
    const rows = filteredSubmissions.map(sub => {
      const subDate = new Date(sub.submitted_at);
      const rowData = [
        sub.id,
        format(subDate, "yyyy-MM-dd"),
        format(subDate, "HH:mm:ss"),
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
          <p className="text-muted-foreground mt-1">View, filter by day, and export leads and inquiries.</p>
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

      {/* Filter Bar */}
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
                <TableHead className="font-medium min-w-[170px]">Submitted Date & Time</TableHead>
                {dynamicKeys.map(key => (
                  <TableHead key={key} className="font-medium whitespace-nowrap">
                    {formatKeyName(key)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    {dynamicKeys.length > 0 ? dynamicKeys.map((k, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                    )) : (
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    )}
                  </TableRow>
                ))
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(2, dynamicKeys.length + 1)} className="text-center py-20 text-muted-foreground">
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
                filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(sub.submitted_at), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    {dynamicKeys.map(key => (
                      <TableCell key={key} className="max-w-[300px] truncate text-sm" title={String(sub.data[key] || "")}>
                        {sub.data[key] || <span className="text-muted-foreground/30">-</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
