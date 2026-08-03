"use client";

import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/authClient";

const STYLES = {
  button: "rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold text-red-500 transition-all duration-300 hover:from-red-500 hover:to-orange-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]",
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
