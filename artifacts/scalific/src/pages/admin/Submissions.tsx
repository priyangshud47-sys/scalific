"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContactSubmission } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicKeys, setDynamicKeys] = useState<string[]>([]);

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
      
      // Extract unique keys from all submission data objects
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

  const exportCSV = () => {
    if (submissions.length === 0) return;

    // Build CSV headers
    const headers = ["ID", "Submitted At", ...dynamicKeys];
    
    // Build CSV rows
    const rows = submissions.map(sub => {
      const rowData = [
        sub.id,
        format(new Date(sub.submitted_at), "yyyy-MM-dd HH:mm:ss"),
        ...dynamicKeys.map(key => {
          const val = sub.data[key] || "";
          // Escape quotes and wrap in quotes to handle commas in values
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
    link.setAttribute("download", `scalific_submissions_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exported successfully");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground mt-1">View leads and inquiries from the contact form.</p>
        </div>
        <Button onClick={exportCSV} className="gap-2" variant="outline" disabled={loading || submissions.length === 0}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b border-border">
                <TableHead className="font-medium min-w-[150px]">Date</TableHead>
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
              ) : submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(2, dynamicKeys.length + 1)} className="text-center py-20 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg">No submissions yet.</p>
                      <p className="text-sm">When users fill out your contact form, they will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(sub.submitted_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    {dynamicKeys.map(key => (
                      <TableCell key={key} className="max-w-[300px] truncate" title={String(sub.data[key] || "")}>
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
