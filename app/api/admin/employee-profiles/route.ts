import { NextResponse } from "next/server";
import { requireEmployeeRole } from "@/lib/api/require-employee-role";
import { employeeRoles, isEmployeeRole } from "@/lib/employee-roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UpdateEmployeeProfileRequest = {
  userId?: unknown;
  role?: unknown;
  isActive?: unknown;
};

function parseUpdateRequest(value: unknown) {
  const body = (value && typeof value === "object" ? value : {}) as UpdateEmployeeProfileRequest;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const role = typeof body.role === "string" && isEmployeeRole(body.role) ? body.role : null;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

  return { userId, role, isActive };
}

async function requireAdmin(request: Request) {
  const serverClient = createServerSupabaseClient();
  const roleGuard = await requireEmployeeRole({
    request,
    serverClient,
    allowedRoles: ["admin"],
    enforce: true,
  });

  return { serverClient, roleGuard };
}

export async function GET(request: Request) {
  try {
    const { serverClient, roleGuard } = await requireAdmin(request);
    if (!roleGuard.ok) return roleGuard.response;

    const { data, error } = await serverClient
      .from("employee_profiles")
      .select("user_id, employee_code, display_name, phone, role, is_active, created_at, updated_at")
      .is("deleted_at", null)
      .order("display_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      roles: employeeRoles,
      profiles: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Load employee profiles failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { serverClient, roleGuard } = await requireAdmin(request);
    if (!roleGuard.ok) return roleGuard.response;

    const { user, employeeName, employeeRole } = roleGuard.guard;
    const { userId, role, isActive } = parseUpdateRequest(await request.json());

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (!role && isActive === null) return NextResponse.json({ error: "No profile update requested" }, { status: 400 });

    const { data: beforeProfile, error: beforeError } = await serverClient
      .from("employee_profiles")
      .select("user_id, employee_code, display_name, phone, role, is_active, updated_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (beforeError) throw beforeError;

    const updatePayload = {
      ...(role ? { role } : {}),
      ...(isActive !== null ? { is_active: isActive } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: updateError } = await serverClient
      .from("employee_profiles")
      .update(updatePayload)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("user_id, employee_code, display_name, phone, role, is_active, created_at, updated_at")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await serverClient.from("audit_logs").insert({
      actor_id: user.id,
      action: "employee_profile_role_updated",
      entity_type: "employee_profiles",
      entity_id: userId,
      before_data: beforeProfile,
      after_data: updatedProfile,
      metadata: { source: "admin_employee_profiles_api", actor_name: employeeName, actor_role: employeeRole },
    });

    if (auditError) {
      return NextResponse.json(
        {
          error: "Employee profile updated, but audit log insert failed",
          detail: auditError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update employee profile failed" },
      { status: 500 },
    );
  }
}
