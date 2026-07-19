"use client";

import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/authClient";

const STYLES = {
  button: "transition-colors hover:text-black dark:hover:text-zinc-50",
};

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logoutRequest();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className={STYLES.button}>
      Sign out
    </button>
  );
}
