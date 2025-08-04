export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegistrationData {
  email: string;
  password: string;
  name: string;
}

export interface IResetPasswordData {
  email: string;
}

export interface IUpdatePasswordData {
  password: string;
  confirmPassword: string;
}

export interface IAuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface IAuthState {
  user: User | null;
  loading: boolean;
  error: IAuthError | null;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export type User = IUser;
