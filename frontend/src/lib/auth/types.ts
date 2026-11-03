export type AccountType = "STUDENT" | "STAFF";
export type Role = "SV" | "BQL" | "ADMIN";

export interface Identity {
  actorKind: AccountType;
  accountId: string;
  role: Role;
  identifier: string;
  displayName: string;
  studentId: string | null;
}

export interface LoginInput {
  accountType: AccountType;
  identifier: string;
  password: string;
}

export interface FieldIssue {
  field: string;
  message: string;
}

export type LoginField = keyof LoginInput;
export type FieldErrors = Partial<Record<LoginField, string>>;

export const ROLE_LABELS: Record<Role, string> = {
  SV: "Sinh viên",
  BQL: "Ban quản lý ký túc xá",
  ADMIN: "Quản trị viên hệ thống",
};
