export type UserRole = 'member' | 'teacher' | 'editor' | 'super_admin';

export type AppCapability =
  | 'view_student_app'
  | 'manage_own_profile'
  | 'manage_own_progress'
  | 'view_assigned_students'
  | 'manage_own_classes'
  | 'create_assignments'
  | 'manage_global_content'
  | 'publish_content'
  | 'manage_users'
  | 'manage_roles'
  | 'view_audit_logs'
  | 'manage_system_settings';

export const ROLE_CAPABILITIES: Record<UserRole, readonly AppCapability[]> = {
  member: [
    'view_student_app',
    'manage_own_profile',
    'manage_own_progress',
  ],
  teacher: [
    'view_student_app',
    'manage_own_profile',
    'manage_own_progress',
    'view_assigned_students',
    'manage_own_classes',
    'create_assignments',
  ],
  editor: [
    'view_student_app',
    'manage_own_profile',
    'manage_own_progress',
    'manage_global_content',
    'publish_content',
  ],
  super_admin: [
    'view_student_app',
    'manage_own_profile',
    'manage_own_progress',
    'view_assigned_students',
    'manage_own_classes',
    'create_assignments',
    'manage_global_content',
    'publish_content',
    'manage_users',
    'manage_roles',
    'view_audit_logs',
    'manage_system_settings',
  ],
};

export function computeCapabilities(roles: UserRole[]): AppCapability[] {
  const capSet = new Set<AppCapability>();
  for (const role of roles) {
    const list = ROLE_CAPABILITIES[role];
    if (list) {
      list.forEach((c) => capSet.add(c));
    }
  }
  return Array.from(capSet);
}

export interface UserProfileData {
  id: string;
  fullName: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  examType: string;
  dailyGoal?: number;
  status: 'active' | 'suspended' | 'deleted';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextValue {
  session: any | null;
  user: any | null;
  profile: UserProfileData | null;
  roles: UserRole[];
  capabilities: AppCapability[];
  activeRole: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithUsername: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, password: string, examType?: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithUsername: (fullName: string, username: string, email: string, password: string, examType?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  refreshAuthorization: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  can: (capability: AppCapability) => boolean;
  isMember: boolean;
  isTeacher: boolean;
  isEditor: boolean;
  isSuperAdmin: boolean;
}

/** Birden fazla rolü olan kullanıcı için en yüksek öncelikli rolü belirler */
export function resolveActiveRole(roles: UserRole[]): UserRole {
  if (roles.includes('super_admin')) return 'super_admin';
  if (roles.includes('editor')) return 'editor';
  if (roles.includes('teacher')) return 'teacher';
  return 'member';
}

/** Rol bazlı varsayılan başlangıç rotası */
export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin': return '/admin';
    case 'editor': return '/editor';
    case 'teacher': return '/teacher';
    default: return '/';
  }
}
