export type UserRole = 'member' | 'teacher' | 'editor' | 'super_admin';

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
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (fullName: string, email: string, password: string, examType?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshAuthorization: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isMember: boolean;
  isTeacher: boolean;
  isEditor: boolean;
  isSuperAdmin: boolean;
}
