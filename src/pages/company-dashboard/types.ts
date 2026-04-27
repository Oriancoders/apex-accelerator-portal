export interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface CompanyMembership {
  role: "owner" | "admin" | "member";
}

export interface AssignedAgent {
  display_name: string | null;
  email: string | null;
}
