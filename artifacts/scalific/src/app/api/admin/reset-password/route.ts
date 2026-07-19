import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { targetEmail, newPassword, adminEmail } = await req.json();

    if (!targetEmail || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://vynfhhlyowwogcxdiclg.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify requesting user is super admin if adminEmail provided
    if (adminEmail) {
      const { data: perm } = await supabaseAdmin
        .from("employee_permissions")
        .select("is_super_admin")
        .eq("user_email", adminEmail.toLowerCase())
        .maybeSingle();

      if (perm && perm.is_super_admin === false) {
        return NextResponse.json({ error: "Unauthorized: Only Super Admins can change employee passwords." }, { status: 403 });
      }
    }

    // Search for user in Supabase Auth by email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json({ error: `Employee user "${targetEmail}" was not found in Supabase Auth.` }, { status: 404 });
    }

    // Update target user's password using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: `Password for ${targetEmail} updated successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update password" }, { status: 500 });
  }
}
