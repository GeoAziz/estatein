import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bookmark,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Flag,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Settings as SettingsIcon,
  Ticket,
  Users,
} from "lucide-react";
import DashboardLayout, { type NavItem } from "../../components/DashboardLayout";
import { useAuth } from "../../lib/auth-api";
import { useToast } from "../../lib/toast";
import { useConfirm } from "../../lib/confirm";
import { passwordStrength } from "../../lib/validation";
import { apiClient } from "../../lib/api-client";

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  buyer: [
    { label: "Dashboard", to: "/dashboard/buyer", icon: LayoutDashboard, end: true },
    { label: "My Favorites", to: "/dashboard/buyer#favorites", icon: Heart },
    { label: "Saved Searches", to: "/dashboard/buyer#searches", icon: Bookmark },
    { label: "My Inquiries", to: "/dashboard/buyer#inquiries", icon: MessageSquare },
    { label: "Scheduled Viewings", to: "/dashboard/buyer#viewings", icon: Calendar },
    { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
  ],
  agent: [
    { label: "Dashboard", to: "/dashboard/agent", icon: LayoutDashboard, end: true },
    { label: "My Listings", to: "/agent/listings", icon: HomeIcon },
    { label: "Inquiries", to: "/agent/messages", icon: MessageSquare },
    { label: "Scheduled Viewings", to: "/dashboard/agent#viewings", icon: Calendar },
    { label: "Analytics", to: "/dashboard/agent#analytics", icon: BarChart3 },
    { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, end: true },
    { label: "Pending Listings", to: "/admin/dashboard#pending", icon: Clock },
    { label: "Users", to: "/admin/dashboard#users", icon: Users },
    { label: "Reported Listings", to: "/admin/dashboard#reported", icon: Flag },
    { label: "Support Tickets", to: "/admin/dashboard#support", icon: Ticket },
    { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
  ],
};

const TABS = ["Profile", "Password", "Notifications", "Privacy"] as const;
const REGIONS = ["Malibu, California", "Downtown, New York", "Willow Creek, Vermont", "Austin, Texas"];

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border border-border p-4">
      <span className="text-sm text-white">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        aria-label={`Toggle ${label}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-white/10"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [license, setLicense] = useState(user?.license ?? "");
  const [serviceAreas, setServiceAreas] = useState<string[]>(user?.serviceAreas ?? []);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const profileDirty =
    !!user &&
    (name !== user.name ||
      phone !== user.phone ||
      bio !== (user.bio ?? "") ||
      company !== (user.company ?? "") ||
      license !== (user.license ?? "") ||
      photoPreview !== null ||
      JSON.stringify(serviceAreas) !== JSON.stringify(user.serviceAreas ?? []));

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (profileDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [profileDirty]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordMsgOk, setPasswordMsgOk] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const strength = passwordStrength(newPassword);

  const [notifications, setNotifications] = useState(user?.notifications ?? {
    emailInquiries: true, emailViewings: true, emailMessages: true, emailListingApproved: true, emailDigest: false,
    pushInquiries: true, pushMessages: true, pushViewings: false,
  });
  const [privacy, setPrivacy] = useState(user?.privacy ?? {
    showProfile: true, showPhone: false, allowWhatsapp: true, promoEmails: false,
  });

  if (!user) return null;
  const nav = NAV_BY_ROLE[user.role] ?? NAV_BY_ROLE.buyer;

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      await apiClient.updateUserProfile(user.id, { name, phone, bio, company: company || undefined, license: license || undefined, serviceAreas });
      updateUser({ name, phone, bio, company: company || undefined, license: license || undefined, serviceAreas } as any);
      setSavingProfile(false);
      setPhotoPreview(null);
      showToast("success", "Profile updated successfully");
    } catch (error: any) {
      setSavingProfile(false);
      showToast("error", error.message || "Failed to update profile");
    }
  }

  function cancelProfile() {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone);
    setBio(user.bio ?? "");
    setCompany(user.company ?? "");
    setLicense(user.license ?? "");
    setServiceAreas(user.serviceAreas ?? []);
    setPhotoPreview(null);
  }

  async function updatePassword() {
    setPasswordMsg("");
    setPasswordMsgOk(false);
    if (!user) return;
    if (!strength.valid) {
      setPasswordMsg("New password must be 8+ characters with an uppercase letter and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords must match.");
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.changePassword(user.id, { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSavingPassword(false);
      setPasswordMsgOk(true);
      setPasswordMsg("Password updated successfully.");
      showToast("success", "Password updated successfully");
    } catch (error: any) {
      setSavingPassword(false);
      setPasswordMsg(error.message || "Failed to update password");
    }
  }

  function handlePhotoSelect(file: File | undefined) {
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: "Delete your account?",
      message: "This is permanent and cannot be undone. All your data will be removed.",
      confirmLabel: "Delete My Account",
      danger: true,
      requireText: "DELETE",
    });
    if (!ok) return;
    showToast("success", "Account deleted");
    navigate("/");
  }

  return (
    <DashboardLayout navItems={nav}>
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">Account Settings</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-h-[44px] shrink-0 rounded-[10px] px-4 py-3 text-left text-sm font-medium transition ${
                tab === t ? "border border-border bg-white/5 text-white" : "text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div key={tab} className="animate-page-fade max-w-2xl">
          {tab === "Profile" && (
            <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>

              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border text-xl font-semibold text-primary-text">
                    {user.name[0]}
                  </span>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                  className="hidden"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="min-h-[44px] rounded-[10px] border border-border px-4 py-2 text-sm font-medium text-white hover:border-primary hover:text-primary-text"
                  >
                    Upload Photo
                  </button>
                  {photoPreview && (
                    <button onClick={() => setPhotoPreview(null)} className="min-h-[44px] text-sm text-muted hover:text-red-400">
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Full Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white focus:border-primary focus:outline-none" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted">Email (read-only)</span>
                <input disabled value={user.email} className="h-12 rounded-lg border border-border bg-white/5 px-4 text-base text-white/70" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Phone Number</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white focus:border-primary focus:outline-none" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted">Bio / Description (optional)</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-base text-white focus:border-primary focus:outline-none" />
              </label>

              {user.role === "agent" && (
                <>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted">Company / Brokerage (optional)</span>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white focus:border-primary focus:outline-none" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted">License Number (optional)</span>
                    <input value={license} onChange={(e) => setLicense(e.target.value)} className="h-12 rounded-lg border border-border bg-transparent px-4 text-base text-white focus:border-primary focus:outline-none" />
                  </label>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">Service Area</span>
                    <div className="grid grid-cols-2 gap-2">
                      {REGIONS.map((r) => (
                        <label key={r} className="flex min-h-[32px] items-center gap-2 text-sm text-muted">
                          <input
                            type="checkbox"
                            checked={serviceAreas.includes(r)}
                            onChange={() =>
                              setServiceAreas((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]))
                            }
                            className="h-5 w-5 rounded border-border bg-transparent accent-primary"
                          />
                          {r}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {profileDirty && <p className="text-xs text-amber-400">You have unsaved changes.</p>}
              <div className="flex gap-3">
                <button
                  onClick={saveProfile}
                  disabled={!profileDirty || savingProfile}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingProfile && <Loader2 size={14} className="animate-spin" />}
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={cancelProfile}
                  disabled={!profileDirty}
                  className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tab === "Password" && (
            <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white">Change Password</h2>
              {passwordMsg && (
                <p className={`text-sm ${passwordMsgOk ? "text-primary-text" : "text-red-400"}`}>{passwordMsg}</p>
              )}
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Current Password</span>
                <div className="flex h-12 items-center rounded-lg border border-border pr-3 focus-within:border-primary">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-full w-full bg-transparent px-4 text-base text-white focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} aria-label={showCurrent ? "Hide password" : "Show password"} className="text-subtle hover:text-white">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">New Password</span>
                <div className="flex h-12 items-center rounded-lg border border-border pr-3 focus-within:border-primary">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-full w-full bg-transparent px-4 text-base text-white focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} aria-label={showNew ? "Hide password" : "Show password"} className="text-subtle hover:text-white">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-muted">{strength.label}</span>
                  </div>
                )}
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Confirm New Password</span>
                <div className="flex h-12 items-center rounded-lg border border-border pr-3 focus-within:border-primary">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-full w-full bg-transparent px-4 text-base text-white focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} className="text-subtle hover:text-white">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={updatePassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword || savingPassword}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingPassword && <Loader2 size={14} className="animate-spin" />}
                  {savingPassword ? "Updating…" : "Update Password"}
                </button>
                <button
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordMsg("");
                  }}
                  className="min-h-[44px] rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tab === "Notifications" && (
            <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted">Email</span>
                <Toggle label="New inquiries" checked={notifications.emailInquiries} onChange={(v) => setNotifications((n) => ({ ...n, emailInquiries: v }))} />
                <Toggle label="Scheduled viewings" checked={notifications.emailViewings} onChange={(v) => setNotifications((n) => ({ ...n, emailViewings: v }))} />
                <Toggle label="Messages received" checked={notifications.emailMessages} onChange={(v) => setNotifications((n) => ({ ...n, emailMessages: v }))} />
                <Toggle label="Listing approved" checked={notifications.emailListingApproved} onChange={(v) => setNotifications((n) => ({ ...n, emailListingApproved: v }))} />
                <Toggle label="Daily digest" checked={notifications.emailDigest} onChange={(v) => setNotifications((n) => ({ ...n, emailDigest: v }))} />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted">Push Notifications</span>
                <Toggle label="New inquiries" checked={notifications.pushInquiries} onChange={(v) => setNotifications((n) => ({ ...n, pushInquiries: v }))} />
                <Toggle label="Messages" checked={notifications.pushMessages} onChange={(v) => setNotifications((n) => ({ ...n, pushMessages: v }))} />
                <Toggle label="Scheduled viewings" checked={notifications.pushViewings} onChange={(v) => setNotifications((n) => ({ ...n, pushViewings: v }))} />
              </div>
              <button
                onClick={async () => {
                  try {
                    await apiClient.updateUserProfile(user.id, { notifications });
                    updateUser({ notifications } as any);
                    showToast("success", "Notification preferences saved");
                  } catch {
                    showToast("error", "Failed to save preferences");
                  }
                }}
                className="min-h-[44px] w-fit rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
              >
                Save Preferences
              </button>
            </div>
          )}

          {tab === "Privacy" && (
            <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white">Privacy &amp; Security</h2>
              <div className="flex flex-col gap-3">
                <Toggle label="Show my profile to other agents" checked={privacy.showProfile} onChange={(v) => setPrivacy((p) => ({ ...p, showProfile: v }))} />
                <Toggle label="Display my phone number on listings" checked={privacy.showPhone} onChange={(v) => setPrivacy((p) => ({ ...p, showPhone: v }))} />
                <Toggle label="Allow buyers to contact me via WhatsApp" checked={privacy.allowWhatsapp} onChange={(v) => setPrivacy((p) => ({ ...p, allowWhatsapp: v }))} />
                <Toggle label="Receive promotional emails" checked={privacy.promoEmails} onChange={(v) => setPrivacy((p) => ({ ...p, promoEmails: v }))} />
              </div>
              <button
                onClick={async () => {
                  try {
                    await apiClient.updateUserProfile(user.id, { privacy });
                    updateUser({ privacy } as any);
                    showToast("success", "Privacy preferences saved");
                  } catch {
                    showToast("error", "Failed to save preferences");
                  }
                }}
                className="min-h-[44px] w-fit rounded-[10px] bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90"
              >
                Save Preferences
              </button>

              <div className="flex flex-col gap-3 border-t border-border pt-6">
                <button className="min-h-[44px] w-fit rounded-[10px] border border-border px-6 py-3 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                  Download My Data
                </button>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-red-500/30 p-5">
                <span className="text-sm font-semibold text-red-400">Danger Zone</span>
                <button
                  onClick={handleDeleteAccount}
                  className="min-h-[44px] w-fit rounded-[10px] border border-red-500 px-6 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
