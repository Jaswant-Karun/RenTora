export type UserRole = 'student' | 'owner' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution: string;
  department?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface DemoAccount {
  role: UserRole;
  roleLabel: string;
  email: string;
  password: string;
  name: string;
  institution: string;
}
