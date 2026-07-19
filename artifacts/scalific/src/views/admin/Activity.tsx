"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, History, RefreshCw, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type ActivityLogItem = {
  id: string;
  user_email: string;
  action: string;
  module: string;
  details: string | null;
  created_at: string;
};

export default function AdminActivity() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      toast.error("Failed to load activity logs");
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["ID", "Timestamp", "Employee Email", "Action", "Module", "Details"];
    const rows = filteredLogs.map((log) => [
      log.id,
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      `"${log.user_email}"`,
      log.action,
      `"${log.module}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scalific_activity_logs_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredLogs.length} log(s) to CSV`);
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "UPDATE":
        return "bg-primary/10 text-primary border-primary/20";
      case "DELETE":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "LOGIN":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <History className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-display font-bold tracking-tight">Employee Activity Audit Logs</h1>
          </div>
          <p className="text-muted-foreground">
            Track and audit all changes, updates, and employee activities across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportCSV} disabled={loading || filteredLogs.length === 0} className="gap-2">
            <Download className="w-4 h-4" />
            Export Log CSV ({filteredLogs.length})
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search email, module, details..."
            className="pl-9 bg-background/50 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {["all", "CREATE", "UPDATE", "DELETE", "LOGIN"].map((act) => (
            <Button
              key={act}
              type="button"
              variant={actionFilter === act ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(act)}
              className="text-xs h-8 capitalize"
            >
              {act}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="font-medium min-w-[170px]">Timestamp</TableHead>
                <TableHead className="font-medium min-w-[180px]">Employee Email</TableHead>
                <TableHead className="font-medium min-w-[100px]">Action</TableHead>
                <TableHead className="font-medium min-w-[140px]">Module</TableHead>
                <TableHead className="font-medium min-w-[300px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <History className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No activity logs recorded yet.</p>
                      <p className="text-sm">When employees make edits or login, changes will be tracked here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-medium text-sm text-foreground">
                      {log.user_email}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-primary">
                      {log.module}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[400px] truncate" title={log.details || undefined}>
                      {log.details}
                    </TableCell>
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
