"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  logoutRequest,
  type UserProfile,
  type UpdateProfilePayload,
} from "@/lib/authClient";

/* ───────── styles ───────── */
const S = {
  page: "flex flex-1 items-start justify-center px-6 py-10",
  wrapper: "flex w-full max-w-2xl flex-col gap-8",
  heading:
    "text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent",
  card: "rounded-2xl border border-white/10 bg-zinc-950 p-6",
  cardTitle: "mb-4 text-base font-semibold text-zinc-50",
  field: "flex flex-col gap-1",
  label: "text-xs font-medium text-zinc-400",
  input:
    "rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-zinc-50 outline-none focus:border-white/30",
  row: "flex gap-3",
  badge:
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
  badgeVerified: "bg-emerald-500/10 text-emerald-400",
  badgeUnverified: "bg-amber-500/10 text-amber-400",
  btnPrimary:
    "rounded-lg bg-zinc-50 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50",
  btnDanger:
    "rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50",
  successMsg: "text-sm text-emerald-400",
  errorMsg: "text-sm text-red-400",
  dangerZone:
    "rounded-2xl border border-red-500/20 bg-zinc-950 p-6",
  dangerTitle: "mb-2 text-base font-semibold text-red-400",
  dangerDesc: "mb-4 text-sm text-zinc-400",
  overlay:
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
  modal:
    "flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-950 p-6",
  modalHeading: "text-lg font-semibold text-zinc-50",
  modalBody: "text-sm text-zinc-400",
  modalActions: "flex justify-end gap-3 pt-2",
  btnCancel:
    "rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50",
};

export default function AccountPage() {
  const router = useRouter();

  /* ── profile state ── */
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── edit form state ── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  /* ── delete modal state ── */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── load profile on mount ── */
  useEffect(() => {
    getUserProfile().then((profile) => {
      if (!profile) {
        router.push("/login");
        return;
      }
      setUser(profile);
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setOccupation(profile.occupation ?? "");
      setEmail(profile.email);
      setLoading(false);
    });
  }, [router]);

  /* ── save handler ── */
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);

    const payload: UpdateProfilePayload = {};
    if (firstName !== user.first_name) payload.first_name = firstName;
    if (lastName !== user.last_name) payload.last_name = lastName;
    if (occupation !== (user.occupation ?? "")) payload.occupation = occupation;
    if (email !== user.email) payload.email = email;

    if (Object.keys(payload).length === 0) {
      setSaveMsg({ type: "ok", text: "No changes to save." });
      setSaving(false);
      return;
    }

    const result = await updateUserProfile(payload);
    setSaving(false);

    if (!result.ok) {
      setSaveMsg({ type: "err", text: result.error });
      return;
    }

    setUser(result.user);
    const msg =
      payload.email
        ? "Profile updated. A verification email has been sent to your new address."
        : "Profile updated successfully.";
    setSaveMsg({ type: "ok", text: msg });
  }

  /* ── delete handler ── */
  async function handleDelete() {
    setDeleting(true);
    const err = await deleteUserAccount();
    if (err) {
      setDeleting(false);
      setSaveMsg({ type: "err", text: err.error });
      setShowDeleteModal(false);
      return;
    }
    await logoutRequest();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className={S.page}>
        <div className={S.wrapper}>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded-lg bg-white/5" />
            <div className="h-64 rounded-2xl bg-white/5" />
            <div className="h-32 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={S.page}>
      <div className={S.wrapper}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className={S.heading}>Account Settings</h1>
          <span
            className={`${S.badge} ${user?.is_verified ? S.badgeVerified : S.badgeUnverified}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${user?.is_verified ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            {user?.is_verified ? "Verified" : "Unverified"}
          </span>
        </div>

        {/* ── Profile Form (Task 4.4) ── */}
        <div className={S.card}>
          <h2 className={S.cardTitle}>Profile Information</h2>
          <div className="flex flex-col gap-4">
            <div className={S.row}>
              <div className={`${S.field} flex-1`}>
                <label htmlFor="acc-first-name" className={S.label}>
                  First Name
                </label>
                <input
                  id="acc-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={S.input}
                />
              </div>
              <div className={`${S.field} flex-1`}>
                <label htmlFor="acc-last-name" className={S.label}>
                  Last Name
                </label>
                <input
                  id="acc-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={S.input}
                />
              </div>
            </div>

            <div className={S.field}>
              <label htmlFor="acc-occupation" className={S.label}>
                Occupation
              </label>
              <input
                id="acc-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className={S.input}
              />
            </div>

            <div className={S.field}>
              <label htmlFor="acc-email" className={S.label}>
                Email
              </label>
              <input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={S.input}
              />
              {email !== user?.email && (
                <p className="text-xs text-amber-400">
                  Changing your email will require re-verification.
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={S.btnPrimary}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveMsg && (
                <p
                  className={
                    saveMsg.type === "ok" ? S.successMsg : S.errorMsg
                  }
                >
                  {saveMsg.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Danger Zone (Task 4.5) ── */}
        <div className={S.dangerZone}>
          <h2 className={S.dangerTitle}>Danger Zone</h2>
          <p className={S.dangerDesc}>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={S.btnDanger}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className={S.overlay}>
          <div className={S.modal}>
            <h2 className={S.modalHeading}>Are you absolutely sure?</h2>
            <p className={S.modalBody}>
              This will permanently delete your account and all data. This
              action cannot be reversed.
            </p>
            <div className={S.modalActions}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className={S.btnCancel}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={S.btnDanger}
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
