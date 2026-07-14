import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeEmployeeRole, type EmployeeRole } from "@/lib/employee-roles";

type EmployeeProfile = {
  display_name: string | null;
  is_active: boolean | null;
  role?: string | null;
};

function fallbackDisplayName(user: User | null) {
  return user?.email?.trim() || "Unknown user";
}

export async function getCurrentEmployeeName(supabase: SupabaseClient) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) return { userId: null, displayName: "", role: "field_team" as const };

  const { data, error } = await supabase
    .from("employee_profiles")
    .select("display_name, is_active, role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;

  const profile = data as EmployeeProfile | null;
  const displayName = profile?.is_active && profile.display_name?.trim() ? profile.display_name.trim() : fallbackDisplayName(user);

  return { userId: user.id, displayName, role: normalizeEmployeeRole(profile?.role) };
}

export async function getEmployeeNameByUserId(supabase: SupabaseClient, userId: string, fallbackName = "") {
  const { data, error } = await supabase
    .from("employee_profiles")
    .select("display_name, is_active")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;

  const profile = data as EmployeeProfile | null;
  return profile?.is_active && profile.display_name?.trim() ? profile.display_name.trim() : fallbackName.trim();
}

export async function getCurrentEmployeeProfile(supabase: SupabaseClient): Promise<{
  userId: string | null;
  displayName: string;
  role: EmployeeRole;
}> {
  const employee = await getCurrentEmployeeName(supabase);
  return {
    userId: employee.userId,
    displayName: employee.displayName,
    role: employee.role,
  };
}
