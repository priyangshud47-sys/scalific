"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/views/admin/Layout";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181B20]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) router.replace("/admin/login");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) router.replace("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (session === undefined) return <LoadingSpinner />;
  if (!session) return null;

  return <AdminLayout>{children}</AdminLayout>;
}
