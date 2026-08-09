import { api } from "../../../lib/axios";
import type {
  LoginInput,
  RegisterInput,
  LoginResponse,
  AuthUser,
} from "../types/auth.types";

export const loginUser = async (data: LoginInput): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/v1/auth/login", data);
  return response.data;
};

export const registerUser = async (data: RegisterInput): Promise<AuthUser> => {
  const response = await api.post<AuthUser>("/api/v1/auth/register", data);
  return response.data;
};
