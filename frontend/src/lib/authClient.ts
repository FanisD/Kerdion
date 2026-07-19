export type RegisterPayload = {
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthError = {
  error: string;
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
