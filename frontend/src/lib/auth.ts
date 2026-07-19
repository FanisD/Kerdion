import { cookies } from "next/headers";

export const SESSION_COOKIE = "kerdion_token";

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
