export interface DecodedToken {
  userId: number;
  user_name: string;
  role_id: number;
  exp: number;
  iat: number;
}

export interface LoginRequest {
  user_name: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: DecodedToken;
    token: string;
  };
}

export interface RegisterRequest {
  user_name: string;
  password: string;
  role_id: number;
  email?: string;
  phone?: string;
}

export interface User {
  id: number;
  user_name: string;
  role_id: number;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCredentialsRequest {
  current_password: string;
  new_password?: string;
  user_name?: string;
  email?: string;
  phone?: string;
}

export interface AdminUpdateUserRequest {
  user_name?: string;
  password?: string;
  role_id?: number;
  email?: string;
  phone?: string;
}
