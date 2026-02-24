import { useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  User, Camera, Edit3, Phone, Mail, QrCode, Key, Trash2, LogOut, Shield, Eye, EyeOff,
  Lock, Smartphone, Fingerprint, MessageSquare, Palette, Type, Image, Archive,
  Database, Bell, BellOff, Volume2, Vibrate, Download, Wifi, HardDrive, Radio,
  Clock, Info, FileText, Code, HelpCircle, Bug, HeadphonesIcon, Moon, Sun,
  ChevronRight, Globe, Paintbrush, ArrowLeft, Check, X, Save
} from "lucide-react";

type PrivacyOption = "everyone" | "contacts" | "nobody";
type SectionId = "profile" | "account" | "privacy" | "security" | "chats" | "notifications" | "storage" | "status" | "appearance" | "help" | "about" | null;

const SettingsPage = () => {
  const { profile, logout, updateUserProfile, updateProfilePic, changePassword, deleteAccount } = useAuthStore();
  const [activeSection, setActiveSection] = useState<SectionId>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  // Editable profile fields
  const [editName, setEditName] = useState(profile?.name || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Settings state — initialized from profile (Firestore)
  const [settings, setSettings] = useState({
    lastSeen: (profile?.lastSeenVisibility || "everyone") as PrivacyOption,
    onlineStatus: profile?.onlineStatusVisible !== false,
    profilePhoto: (profile?.profilePhotoVisibility || "everyone") as PrivacyOption,
    about: (profile?.aboutVisibility || "everyone") as PrivacyOption,
    readReceipts: profile?.readReceipts !== false,
    groupsAddMe: (profile?.groupsAddMe || "everyone") as PrivacyOption,
    enterIsSend: profile?.enterIsSend !== false,
    fontSize: (profile?.fontSize || "medium") as "small" | "medium" | "large",
    archivedChats: (profile?.archivedChats || "keep") as "keep" | "auto",
    messageSound: profile?.messageSound !== false,
    messageVibrate: profile?.messageVibrate !== false,
    messagePopup: profile?.messagePopup !== false,
    groupNotifications: profile?.groupNotifications !== false,
    callNotifications: profile?.callNotifications !== false,
    muteAll: profile?.muteAll === true,
    autoDownloadWifi: profile?.autoDownloadWifi !== false,
    autoDownloadMobile: profile?.autoDownloadMobile === true,
    dataSaver: profile?.dataSaver === true,
    statusVisibility: (profile?.statusVisibility || "everyone") as PrivacyOption,
    statusAutoDelete: profile?.statusAutoDelete !== false,
    darkMode: profile?.darkMode !== false,
    appLanguage: profile?.appLanguage || "English",
  });

  // Helper: update local state + persist to Firestore
  const updateSetting = (localKey: string, firestoreKey: string, value: any) => {
    setSettings(s => ({ ...s, [localKey]: value }));
    updateUserProfile({ [firestoreKey]: value } as any).catch(err => console.error("Setting save error:", err));
  };

  // Error state
  const [saveError, setSaveError] = useState("");

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateProfilePic(file);
    } catch (err: any) {
      console.error("Failed to update profile pic:", err);
      setSaveError("Failed to update photo. Please try again.");
      setTimeout(() => setSaveError(""), 4000);
    }
    setSaving(false);
    if (profilePicRef.current) profilePicRef.current.value = "";
  };

  const handleSaveField = async (field: "name" | "bio") => {
    setSaving(true);
    setSaveError("");
    try {
      if (field === "name" && editName.trim()) {
        await updateUserProfile({ name: editName.trim() });
      } else if (field === "bio") {
        await updateUserProfile({ bio: editBio.trim() });
      }
      setEditingField(null);
    } catch (err: any) {
      console.error("Failed to save:", err);
      setSaveError("Failed to save. Please try again.");
      setTimeout(() => setSaveError(""), 4000);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword) { setPasswordError("Fill in both fields"); return; }
    if (newPassword.length < 6) { setPasswordError("New password must be at least 6 characters"); return; }
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(""); }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deletePassword) { setDeleteError("Enter your password"); return; }
    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
    }
  };

  const openSection = (id: SectionId) => {
    setActiveSection(id);
    if (id === "profile") {
      setEditName(profile?.name || "");
      setEditBio(profile?.bio || "");
      setEditingField(null);
    }
    if (id === "account") {
      setShowPasswordForm(false);
      setShowDeleteConfirm(false);
    }
  };

  const goBack = () => setActiveSection(null);

  // Reusable components
  const Toggle = ({ label, value, onChange, description }: { label: string; value: boolean; onChange: (v: boolean) => void; description?: string }) => (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex-1 min-w-0 mr-3">
        <span className="text-sm text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${value ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  const SelectOption = ({ label, value, options, onChange }: {
    label: string; value: string; options: { label: string; value: string }[]; onChange: (v: any) => void;
  }) => (
    <div className="py-3 px-4">
      <span className="text-sm text-foreground block mb-2.5">{label}</span>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              value === opt.value ? "bg-primary/10" : "hover:bg-secondary/60"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              value === opt.value ? "border-primary" : "border-muted-foreground/40"
            }`}>
              {value === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <span className={`text-sm ${value === opt.value ? "text-foreground font-medium" : "text-muted-foreground"}`}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const MenuItem = ({ icon: Icon, label, onClick, danger, detail }: { icon: any; label: string; onClick?: () => void; danger?: boolean; detail?: string }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 px-4 hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-left ${danger ? "text-destructive" : ""}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${danger ? "" : "text-muted-foreground"}`} />
      <span className={`text-sm flex-1 ${danger ? "" : "text-foreground"}`}>{label}</span>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </button>
  );

  const PanelHeader = ({ title, onBack: onBackClick }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background z-10">
      <button onClick={onBackClick} className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );

  // Section content renderers
  const renderProfile = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Profile" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Profile pic */}
        <div className="flex flex-col items-center py-6 border-b border-border">
          <input ref={profilePicRef} type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.profilePic ? (
                <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-3xl">{profile?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => profilePicRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          {saving && <p className="text-xs text-primary mt-2 animate-pulse">Saving...</p>}
          {saveError && <p className="text-xs text-red-500 mt-2">{saveError}</p>}
        </div>

        {/* Name */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              {editingField === "name" ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-secondary rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
                    autoFocus
                  />
                  <button onClick={() => handleSaveField("name")} className="p-1 text-primary"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingField(null)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="text-sm text-foreground">{profile?.name}</p>
              )}
            </div>
            {editingField !== "name" && (
              <button onClick={() => { setEditName(profile?.name || ""); setEditingField("name"); }} className="p-1 text-muted-foreground hover:text-foreground">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">About</p>
              {editingField === "bio" ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="flex-1 bg-secondary rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
                    autoFocus
                  />
                  <button onClick={() => handleSaveField("bio")} className="p-1 text-primary"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingField(null)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="text-sm text-foreground">{profile?.bio || "Hey there! I'm using ZIVOX"}</p>
              )}
            </div>
            {editingField !== "bio" && (
              <button onClick={() => { setEditBio(profile?.bio || ""); setEditingField("bio"); }} className="p-1 text-muted-foreground hover:text-foreground">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-foreground">{profile?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Account" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Change Password */}
        <MenuItem icon={Key} label="Change password" onClick={() => setShowPasswordForm(!showPasswordForm)} />
        {showPasswordForm && (
          <div className="px-4 py-3 bg-secondary/30 border-b border-border space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs text-primary">{passwordSuccess}</p>}
            <button
              onClick={handleChangePassword}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Update Password
            </button>
          </div>
        )}

        <MenuItem icon={Mail} label="Email settings" detail={profile?.email} />

        <div className="border-t border-border mt-2" />

        {/* Delete Account */}
        <MenuItem icon={Trash2} label="Delete account" danger onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} />
        {showDeleteConfirm && (
          <div className="px-4 py-3 bg-destructive/5 border-b border-border space-y-3">
            <p className="text-xs text-destructive">This action is permanent. Enter your password to confirm.</p>
            <input
              type="password"
              placeholder="Enter password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
            <button
              onClick={handleDeleteAccount}
              className="w-full py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90"
            >
              Permanently Delete Account
            </button>
          </div>
        )}

        <MenuItem icon={LogOut} label="Logout" danger onClick={logout} />
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Privacy" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <SelectOption label="Last seen" value={settings.lastSeen} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => updateSetting("lastSeen", "lastSeenVisibility", v)} />
        <Toggle label="Online status" value={settings.onlineStatus} onChange={(v) => updateSetting("onlineStatus", "onlineStatusVisible", v)} description="Show when you're online" />
        <div className="border-t border-border" />
        <SelectOption label="Profile photo visible to" value={settings.profilePhoto} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => updateSetting("profilePhoto", "profilePhotoVisibility", v)} />
        <SelectOption label="About visible to" value={settings.about} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => updateSetting("about", "aboutVisibility", v)} />
        <div className="border-t border-border" />
        <Toggle label="Read receipts" value={settings.readReceipts} onChange={(v) => updateSetting("readReceipts", "readReceipts", v)} description="Show blue ticks when messages are read" />
        <SelectOption label="Who can add me to groups" value={settings.groupsAddMe} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => updateSetting("groupsAddMe", "groupsAddMe", v)} />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Security" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <MenuItem icon={Shield} label="End-to-end encryption" />
        <p className="px-4 text-xs text-muted-foreground pb-3">Messages are secured with end-to-end encryption. Only you and the recipient can read them.</p>
        <div className="border-t border-border" />
        <MenuItem icon={Smartphone} label="Active sessions" />
        <MenuItem icon={Fingerprint} label="App lock / Biometric" />
        <div className="border-t border-border" />
        <MenuItem icon={LogOut} label="Logout from all devices" danger onClick={logout} />
      </div>
    </div>
  );

  const renderChats = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Chats" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Toggle label="Enter is send" value={settings.enterIsSend} onChange={(v) => updateSetting("enterIsSend", "enterIsSend", v)} description="Use Enter key to send messages" />
        <div className="border-t border-border" />
        <SelectOption label="Font size" value={settings.fontSize} options={[{label:"Small",value:"small"},{label:"Medium",value:"medium"},{label:"Large",value:"large"}]} onChange={(v) => updateSetting("fontSize", "fontSize", v)} />
        <div className="border-t border-border" />
        <MenuItem icon={Palette} label="Chat wallpaper" />
        <SelectOption label="Archived chats" value={settings.archivedChats} options={[{label:"Keep archived",value:"keep"},{label:"Auto unarchive",value:"auto"}]} onChange={(v) => updateSetting("archivedChats", "archivedChats", v)} />
        <div className="border-t border-border" />
        <MenuItem icon={Database} label="Chat backup" />
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Notifications" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Toggle label="Mute all notifications" value={settings.muteAll} onChange={(v) => updateSetting("muteAll", "muteAll", v)} />
        <div className="border-t border-border" />
        <p className="px-4 pt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Messages</p>
        <Toggle label="Sound" value={settings.messageSound} onChange={(v) => updateSetting("messageSound", "messageSound", v)} />
        <Toggle label="Vibrate" value={settings.messageVibrate} onChange={(v) => updateSetting("messageVibrate", "messageVibrate", v)} />
        <Toggle label="Popup notification" value={settings.messagePopup} onChange={(v) => updateSetting("messagePopup", "messagePopup", v)} />
        <div className="border-t border-border" />
        <p className="px-4 pt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Groups & Calls</p>
        <Toggle label="Group notifications" value={settings.groupNotifications} onChange={(v) => updateSetting("groupNotifications", "groupNotifications", v)} />
        <Toggle label="Call notifications" value={settings.callNotifications} onChange={(v) => updateSetting("callNotifications", "callNotifications", v)} />
      </div>
    </div>
  );

  const renderStorage = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Storage & Data" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <p className="px-4 pt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-download media</p>
        <Toggle label="On WiFi" value={settings.autoDownloadWifi} onChange={(v) => updateSetting("autoDownloadWifi", "autoDownloadWifi", v)} />
        <Toggle label="On Mobile data" value={settings.autoDownloadMobile} onChange={(v) => updateSetting("autoDownloadMobile", "autoDownloadMobile", v)} />
        <div className="border-t border-border" />
        <Toggle label="Data saver mode" value={settings.dataSaver} onChange={(v) => updateSetting("dataSaver", "dataSaver", v)} description="Reduce data usage for calls and downloads" />
        <div className="border-t border-border" />
        <MenuItem icon={HardDrive} label="Storage usage" />
        <MenuItem icon={Trash2} label="Clear cache" danger />
      </div>
    </div>
  );

  const renderStatusSettings = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Status / Stories" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <SelectOption label="Who can see my status" value={settings.statusVisibility} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => updateSetting("statusVisibility", "statusVisibility", v)} />
        <div className="border-t border-border" />
        <Toggle label="Auto-delete after 24 hours" value={settings.statusAutoDelete} onChange={(v) => updateSetting("statusAutoDelete", "statusAutoDelete", v)} />
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Appearance" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Toggle label="Dark mode" value={settings.darkMode} onChange={(v) => updateSetting("darkMode", "darkMode", v)} />
        <div className="border-t border-border" />
        <MenuItem icon={Palette} label="Theme color" detail="Green" />
        <MenuItem icon={Type} label="Font style" detail="Default" />
        <MenuItem icon={Globe} label="Language" detail={settings.appLanguage} />
      </div>
    </div>
  );

  const renderHelp = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="Help" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <MenuItem icon={HelpCircle} label="Help center" />
        <MenuItem icon={Bug} label="Report a problem" />
        <MenuItem icon={HeadphonesIcon} label="Contact support" />
        <div className="border-t border-border mt-2" />
        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">Need help? Contact us at support@zivox.app</p>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="flex flex-col h-full">
      <PanelHeader title="About ZIVOX" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">ZIVOX</h3>
          <p className="text-xs text-muted-foreground mt-1">Version 1.0.0</p>
        </div>
        <div className="border-t border-border" />
        <MenuItem icon={FileText} label="Terms of Service" />
        <MenuItem icon={Shield} label="Privacy Policy" />
        <MenuItem icon={FileText} label="Open source licenses" />
        <div className="border-t border-border" />
        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">Made by Ramya</p>
          <p className="text-xs text-muted-foreground text-center mt-1">© 2026 ZIVOX. All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile": return renderProfile();
      case "account": return renderAccount();
      case "privacy": return renderPrivacy();
      case "security": return renderSecurity();
      case "chats": return renderChats();
      case "notifications": return renderNotifications();
      case "storage": return renderStorage();
      case "status": return renderStatusSettings();
      case "appearance": return renderAppearance();
      case "help": return renderHelp();
      case "about": return renderAbout();
      default: return null;
    }
  };

  const sections: { id: SectionId; icon: any; label: string }[] = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "account", icon: Key, label: "Account" },
    { id: "privacy", icon: Shield, label: "Privacy" },
    { id: "security", icon: Lock, label: "Security" },
    { id: "chats", icon: MessageSquare, label: "Chats" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "storage", icon: HardDrive, label: "Storage & Data" },
    { id: "status", icon: Radio, label: "Status / Stories" },
    { id: "appearance", icon: Paintbrush, label: "Appearance" },
    { id: "help", icon: HelpCircle, label: "Help" },
    { id: "about", icon: Info, label: "About ZIVOX" },
  ];

  const renderMainMenu = () => (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Profile Card */}
        <div className="px-4 py-4 border-b border-border">
          <button onClick={() => openSection("profile")} className="w-full flex items-center gap-4 text-left active:opacity-80">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.profilePic ? (
                  <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-xl">{profile?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{profile?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground truncate">{profile?.bio || "Hey there! I'm using ZIVOX"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <QrCode className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Menu Items */}
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => openSection(section.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-left"
          >
            <section.icon className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-medium text-sm text-foreground flex-1">{section.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 mt-2 hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-left text-destructive font-semibold border-t border-border"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">Logout</span>
        </button>

        <div className="h-4" />
      </div>
    </div>
  );

  return (
    <div className="h-full relative overflow-hidden">
      {/* Main Menu */}
      <div
        className="h-full absolute inset-0 transition-transform duration-200 ease-in-out"
        style={{ transform: activeSection ? "translateX(-100%)" : "translateX(0)" }}
      >
        {renderMainMenu()}
      </div>

      {/* Detail Panel - slides in from right */}
      <div
        className="h-full absolute inset-0 bg-background transition-transform duration-200 ease-in-out"
        style={{ transform: activeSection ? "translateX(0)" : "translateX(100%)" }}
      >
        {activeSection && renderSectionContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
