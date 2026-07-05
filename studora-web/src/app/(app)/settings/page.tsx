"use client";

import { useTheme } from "next-themes";
import { useThemeColor, ThemeColor } from "@/components/ThemeColorProvider";
import { usePreferences, LandingPage } from "@/components/PreferencesProvider";
import { Moon, Sun, Monitor, Palette, CheckCircle2, LayoutDashboard, Bell, Loader2, User as UserIcon, Upload, Trash2, Key, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotificationPreferences, updateNotificationPreferences, wipeAccountAndFilesAction } from "@/actions/user";
import { useSession, updateUser, changeEmail, changePassword, signOut } from "@/lib/auth-client";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { color, setColor } = useThemeColor();
  const preferences = usePreferences();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "dashboard" | "notifications">("account");

  // Account State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [emailStr, setEmailStr] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [emailReminders, setEmailReminders] = useState(true);
  const [emailRoomActivity, setEmailRoomActivity] = useState(true);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    setMounted(true);
    getNotificationPreferences().then(res => {
      if (res.success && res.preferences) {
        setEmailReminders(res.preferences.emailReminders);
        setEmailRoomActivity(res.preferences.emailRoomActivity);
      }
      setLoadingPrefs(false);
    });
  }, []);

  const handleToggleNotification = async (key: 'emailReminders' | 'emailRoomActivity', value: boolean) => {
    if (key === 'emailReminders') setEmailReminders(value);
    if (key === 'emailRoomActivity') setEmailRoomActivity(value);
    
    setSavingPrefs(true);
    await updateNotificationPreferences(
      key === 'emailReminders' ? value : emailReminders,
      key === 'emailRoomActivity' ? value : emailRoomActivity
    );
    setSavingPrefs(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomType", "profile");
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        await updateUser({ image: data.fileUrl });
      }
    } catch (err) {
      console.error(err);
    }
    setAvatarUploading(false);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg("");
    try {
      // better-auth changeEmail
      const res = await changeEmail({ newEmail: emailStr, callbackURL: "/settings" });
      if (res?.error) {
        setEmailMsg("Error: " + res.error.message);
      } else {
        setEmailMsg("Email updated successfully (verification may be required).");
      }
    } catch (err: any) {
      setEmailMsg("Failed to update email.");
    }
    setEmailLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMsg("");
    try {
      const res = await changePassword({ newPassword, currentPassword, revokeOtherSessions: true });
      if (res?.error) {
        setPassMsg("Error: " + res.error.message);
      } else {
        setPassMsg("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      setPassMsg("Failed to update password.");
    }
    setPassLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await wipeAccountAndFilesAction();
      if (res.success) {
        await signOut();
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const colorOptions: { name: ThemeColor; label: string; twClass: string }[] = [
    { name: "violet", label: "Violet (Default)", twClass: "bg-violet-600" },
    { name: "blue", label: "Blue", twClass: "bg-blue-600" },
    { name: "emerald", label: "Emerald", twClass: "bg-emerald-500" },
    { name: "crimson", label: "Crimson", twClass: "bg-rose-600" },
    { name: "amber", label: "Amber", twClass: "bg-amber-500" },
  ];

  if (!mounted) {
    return <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-pulse"><div className="h-8 bg-muted w-48 rounded mb-8"></div></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Settings Navigation */}
        <div className="md:col-span-1 flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${activeTab === "account" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <UserIcon className={`w-4 h-4 ${activeTab === "account" ? "text-primary" : ""}`} />
            Account
          </button>
          <button 
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${activeTab === "appearance" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <Palette className={`w-4 h-4 ${activeTab === "appearance" ? "text-primary" : ""}`} />
            Appearance
          </button>
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${activeTab === "dashboard" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === "dashboard" ? "text-primary" : ""}`} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${activeTab === "notifications" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <Bell className={`w-4 h-4 ${activeTab === "notifications" ? "text-primary" : ""}`} />
            Notifications
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-8">
          
          {activeTab === "account" && (
            <div className="space-y-8">
              {/* Profile Picture */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Profile Picture</h2>
                  <p className="text-sm text-muted-foreground">Update your avatar. It will be shown across Studora.</p>
                </div>
                <div className="flex items-center gap-6">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted border flex items-center justify-center text-xl font-bold">
                      {session?.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                    {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {avatarUploading ? "Uploading..." : "Upload New Picture"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} />
                  </label>
                </div>
              </section>

              {/* Update Credentials */}
              <section className="space-y-4 pt-6 border-t border-border">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Update Email</h2>
                  <p className="text-sm text-muted-foreground">Change the email address associated with your account.</p>
                </div>
                <form onSubmit={handleEmailChange} className="space-y-3 max-w-sm">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">New Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="email" 
                        required 
                        value={emailStr}
                        onChange={(e) => setEmailStr(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-transparent border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                        placeholder="new@example.com" 
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={emailLoading} className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
                    {emailLoading ? "Updating..." : "Update Email"}
                  </button>
                  {emailMsg && <p className="text-sm text-muted-foreground mt-2">{emailMsg}</p>}
                </form>
              </section>

              <section className="space-y-4 pt-6 border-t border-border">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Change Password</h2>
                  <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="password" 
                        required 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-transparent border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="password" 
                        required 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-transparent border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={passLoading} className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50">
                    {passLoading ? "Updating..." : "Update Password"}
                  </button>
                  {passMsg && <p className="text-sm text-muted-foreground mt-2">{passMsg}</p>}
                </form>
              </section>

              {/* Danger Zone */}
              <section className="space-y-4 pt-6 border-t border-border">
                <div>
                  <h2 className="text-lg font-medium text-red-500">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all uploaded files.</p>
                </div>
                <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg space-y-4">
                  <p className="text-sm text-red-500 font-medium">This action cannot be undone. All your study rooms, assignments, and uploaded files will be permanently wiped from our servers.</p>
                  
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm text-red-500/80">Type "DELETE" to confirm</label>
                    <input 
                      type="text" 
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="w-full px-3 py-2 bg-transparent border border-red-500/20 focus:border-red-500 rounded-md text-sm focus:outline-none text-red-500" 
                      placeholder="DELETE" 
                    />
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== "DELETE" || deleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? "Deleting Account..." : "Delete Account"}
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === "appearance" && (
            <>
              {/* Theme Preference */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Theme</h2>
                  <p className="text-sm text-muted-foreground">Select how you'd like Studora to look.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme("light")}
                    className={`relative flex flex-col items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                      theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-foreground/20 bg-card"
                    }`}
                  >
                    <Sun className={`w-8 h-8 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium text-foreground">Light</span>
                    {theme === "light" && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" />}
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`relative flex flex-col items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                      theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-foreground/20 bg-card"
                    }`}
                  >
                    <Moon className={`w-8 h-8 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium text-foreground">Dark</span>
                    {theme === "dark" && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" />}
                  </button>

                  <button
                    onClick={() => setTheme("system")}
                    className={`relative flex flex-col items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                      theme === "system" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-foreground/20 bg-card"
                    }`}
                  >
                    <Monitor className={`w-8 h-8 ${theme === "system" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium text-foreground">System</span>
                    {theme === "system" && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" />}
                  </button>
                </div>
              </section>

              {/* Accent Color */}
              <section className="space-y-4 pt-6 border-t border-border">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Accent Color</h2>
                  <p className="text-sm text-muted-foreground">Choose a primary color for your workspace.</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setColor(opt.name)}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${opt.twClass} ${
                        color === opt.name ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110 shadow-md" : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      title={opt.label}
                    >
                      {color === opt.name && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "dashboard" && (
            <>
              {/* Landing Page Settings */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Default Landing Page</h2>
                  <p className="text-sm text-muted-foreground">Where should Studora take you right after you log in?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: "/dashboard", label: "Dashboard" },
                    { val: "/assignments", label: "Assignments" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => preferences.updatePreference("landingPage", opt.val as LandingPage)}
                      className={`px-4 py-3 border rounded-lg text-sm font-medium text-left transition-all ${
                        preferences.landingPage === opt.val 
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" 
                          : "border-border hover:border-foreground/20 text-foreground bg-card"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Widget Toggles */}
              <section className="space-y-4 pt-6 border-t border-border">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Dashboard Widgets</h2>
                  <p className="text-sm text-muted-foreground">Customize which sections appear on your main dashboard.</p>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-card cursor-pointer hover:border-foreground/20 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Recent Activity</p>
                      <p className="text-sm text-muted-foreground">Show a feed of everything happening in your rooms.</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={preferences.showRecentActivity}
                        onChange={(e) => preferences.updatePreference("showRecentActivity", e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-card cursor-pointer hover:border-foreground/20 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Upcoming Deadlines</p>
                      <p className="text-sm text-muted-foreground">Show assignments that are due soon.</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={preferences.showUpcomingDeadlines}
                        onChange={(e) => preferences.updatePreference("showUpcomingDeadlines", e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                </div>
              </section>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              {/* Notification Toggles */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                    Email Notifications
                    {savingPrefs && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                  </h2>
                  <p className="text-sm text-muted-foreground">Manage the alerts Studora sends to your inbox.</p>
                </div>
                
                {loadingPrefs ? (
                  <div className="py-8 text-center text-muted-foreground animate-pulse">Loading preferences...</div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-card cursor-pointer hover:border-foreground/20 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">Deadline Reminders</p>
                        <p className="text-sm text-muted-foreground">Receive 24-hour and 4-hour warnings before an assignment is due.</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={emailReminders}
                          onChange={(e) => handleToggleNotification("emailReminders", e.target.checked)}
                          disabled={savingPrefs}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 border border-border rounded-lg bg-card cursor-pointer hover:border-foreground/20 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">Room Activity</p>
                        <p className="text-sm text-muted-foreground">Receive an email when someone joins your room, uploads material, or submits an assignment.</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={emailRoomActivity}
                          onChange={(e) => handleToggleNotification("emailRoomActivity", e.target.checked)}
                          disabled={savingPrefs}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                    </label>
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
