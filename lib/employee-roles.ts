export const employeeRoles = [
  "field_team",
  "unload_team",
  "inspector",
  "inbound_scale",
  "outbound_scale",
  "accounting",
  "purchasing",
  "admin",
] as const;

export type EmployeeRole = (typeof employeeRoles)[number];

export const employeeRoleLabels: Record<EmployeeRole, string> = {
  field_team: "Field Team",
  unload_team: "Unload Team",
  inspector: "Inspector",
  inbound_scale: "Inbound Scale",
  outbound_scale: "Outbound Scale",
  accounting: "Accounting",
  purchasing: "Purchasing",
  admin: "Admin",
};

export function isEmployeeRole(value: string | null | undefined): value is EmployeeRole {
  return Boolean(value && employeeRoles.includes(value as EmployeeRole));
}

export function normalizeEmployeeRole(value: string | null | undefined): EmployeeRole {
  return isEmployeeRole(value) ? value : "field_team";
}
