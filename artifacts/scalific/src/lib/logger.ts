import { supabase } from "@/lib/supabase";

export async function logActivity(
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN",
  module: string,
  details: string
) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userEmail = sessionData.session?.user?.email || "admin@scalific.in";

    await supabase.from("activity_logs").insert({
      user_email: userEmail,
      action,
      module,
      details,
    });
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}
