export type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  occupation?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthError = {
  error: string;
};

export type UserProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  occupation: string | null;
  is_verified: boolean;
  role: string;
  is_active: boolean;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  occupation?: string;
  email?: string;
};

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthError | null> {
  const res = await postJson("/api/auth/register", payload);
  if (res.ok) return null;
  const data = await res.json().catch(() => null);
  return { error: data?.error ?? "Registration failed." };
}

export async function loginRequest(payload: LoginPayload): Promise<AuthError | null> {
  const res = await postJson("/api/auth/login", payload);
  if (res.ok) return null;
  const data = await res.json().catch(() => null);
  return { error: data?.error ?? "Invalid email or password." };
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getWsToken(): Promise<string | null> {
  const res = await fetch("/api/auth/ws-token");
  if (!res.ok) return null;
  const data = await res.json();
  return data.token ?? null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const res = await fetch("/api/users/me");
  if (!res.ok) return null;
  return res.json();
}

export async function updateUserProfile(
  payload: UpdateProfilePayload,
): Promise<{ ok: true; user: UserProfile } | { ok: false; error: string }> {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { ok: false, error: data?.error ?? "Failed to update profile." };
  }
  return { ok: true, user: await res.json() };
}

export async function deleteUserAccount(): Promise<AuthError | null> {
  const res = await fetch("/api/users/me", { method: "DELETE" });
  if (res.ok) return null;
  const data = await res.json().catch(() => null);
  return { error: data?.error ?? "Failed to delete account." };
}
