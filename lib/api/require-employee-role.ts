import { NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { normalizeEmployeeRole, type EmployeeRole } from "@/lib/employee-roles";

type EmployeeProfileRow = {
  display_name: string | null;
  is_active: boolean | null;
  role: string | null;
};

export type EmployeeRoleGuard = {
  userClient: SupabaseClient;
  user: User;
  employeeName: string;
  employeeRole: EmployeeRole;
  roleGuardEnforced: boolean;
};

function createUserScopedClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function isRoleGuardEnforced() {
  return process.env.ROLE_GUARDS_ENABLED === "true";
}

function fallbackDisplayName(user: User) {
  return user.email?.trim() || "Unknown user";
}

export async function requireEmployeeRole({
  request,
  serverClient,
  allowedRoles,
  enforce,
}: {
  request: Request;
  serverClient: SupabaseClient;
  allowedRoles: EmployeeRole[];
  enforce?: boolean;
}): Promise<{ ok: true; guard: EmployeeRoleGuard } | { ok: false; response: NextResponse }> {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return { ok: false, response: NextResponse.json({ error: "Missing authenticated Supabase session" }, { status: 401 }) };
  }

  const userClient = createUserScopedClient(accessToken);
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return { ok: false, response: NextResponse.json({ error: "Invalid or expired Supabase session" }, { status: 401 }) };
  }

  const { data, error } = await serverClient
    .from("employee_profiles")
    .select("display_name, is_active, role")
    .eq("user_id", userData.user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;

  const profile = data as EmployeeProfileRow | null;
  const employeeRole = normalizeEmployeeRole(profile?.role);
  const employeeName = profile?.is_active && profile.display_name?.trim() ? profile.display_name.trim() : fallbackDisplayName(userData.user);
  const roleGuardEnforced = enforce ?? isRoleGuardEnforced();

  if (roleGuardEnforced && (!profile?.is_active || !allowedRoles.includes(employeeRole))) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "This employee role is not allowed for this action",
          role: employeeRole,
          allowedRoles,
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    guard: {
      userClient,
      user: userData.user,
      employeeName,
      employeeRole,
      roleGuardEnforced,
    },
  };
}
