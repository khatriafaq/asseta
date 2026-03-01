import api from "./client";
import type { User, LoginResponse, SignupPayload, UserProfileUpdate } from "@/lib/types";

export async function login(email: string, password: string): Promise<LoginResponse> {
  // Backend uses OAuth2PasswordRequestForm (form-encoded, field is "username")
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const { data } = await api.post<LoginResponse>("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function signup(payload: SignupPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/signup", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function updateMe(payload: UserProfileUpdate): Promise<User> {
  const { data } = await api.patch<User>("/auth/me", payload);
  return data;
}
