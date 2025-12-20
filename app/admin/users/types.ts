export type Role = "admin" | "user" | "superadmin" | "auditor";
export type User = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  active: boolean;
};
