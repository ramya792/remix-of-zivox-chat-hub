import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  User, Camera, Edit3, Phone, Mail, QrCode, Key, Trash2, LogOut, Shield, Eye, EyeOff,
  Lock, Smartphone, Fingerprint, MessageSquare, Palette, Type, Image, Archive,
  Database, Bell, BellOff, Volume2, Vibrate, Download, Wifi, HardDrive, Radio,
  Clock, Info, FileText, Code, HelpCircle, Bug, HeadphonesIcon, Moon, Sun,
  ChevronRight, Globe, Paintbrush, ArrowLeft, Check, X, Save,
  Users, Megaphone, Accessibility, UserCircle, CircleDashed, Search
} from "lucide-react";

type PrivacyOption = "everyone" | "contacts" | "nobody";
type SectionId = "profile" | "account" | "privacy" | "avatar" | "lists" | "chats" | "broadcasts" | "notifications" | "storage" | "accessibility" | "language" | "help" | "about" | "tos" | "privacy_policy" | "licenses" | null;

const SettingsPage = () => {
  const { profile, logout, updateUserProfile, updateProfilePic, changePassword, deleteAccount } = useAuthStore();
  const [activeSection, setActiveSection] = useState<SectionId>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const wallpaperRef = useRef<HTMLInputElement>(null);

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
    wallpaper: profile?.wallpaper || "#0b141a",
  });

  // Sync settings state with profile updates
  useEffect(() => {
    if (profile) {
      setSettings({
        lastSeen: (profile.lastSeenVisibility || "everyone") as PrivacyOption,
        onlineStatus: profile.onlineStatusVisible !== false,
        profilePhoto: (profile.profilePhotoVisibility || "everyone") as PrivacyOption,
        about: (profile.aboutVisibility || "everyone") as PrivacyOption,
        readReceipts: profile.readReceipts !== false,
        groupsAddMe: (profile.groupsAddMe || "everyone") as PrivacyOption,
        enterIsSend: profile.enterIsSend !== false,
        fontSize: (profile.fontSize || "medium") as "small" | "medium" | "large",
        archivedChats: (profile.archivedChats || "keep") as "keep" | "auto",
        messageSound: profile.messageSound !== false,
        messageVibrate: profile.messageVibrate !== false,
        messagePopup: profile.messagePopup !== false,
        groupNotifications: profile.groupNotifications !== false,
        callNotifications: profile.callNotifications !== false,
        muteAll: profile.muteAll === true,
        autoDownloadWifi: profile.autoDownloadWifi !== false,
        autoDownloadMobile: profile.autoDownloadMobile === true,
        dataSaver: profile.dataSaver === true,
        statusVisibility: (profile.statusVisibility || "everyone") as PrivacyOption,
        statusAutoDelete: profile.statusAutoDelete !== false,
        darkMode: profile.darkMode !== false,
        appLanguage: profile.appLanguage || "English",
        wallpaper: profile.wallpaper || "#0b141a",
      });
    }
  }, [profile]);

  // Helper: update local state + persist to Firestore
  const updateSetting = (localKey: string, firestoreKey: string, value: any) => {
    setSettings(s => ({ ...s, [localKey]: value }));
    updateUserProfile({ [firestoreKey]: value } as any).catch(err => console.error("Setting save error:", err));
  };

  const { updateWallpaper } = useAuthStore();
  const handleWallpaperSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateWallpaper(file).catch(err => alert("Failed to upload wallpaper: " + err.message));
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
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Privacy" onBack={goBack} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-3">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider">Who can see my personal info</p>
        </div>
        
        <MenuItem 
          label="Last seen and online" 
          detail={settings.lastSeen.charAt(0).toUpperCase() + settings.lastSeen.slice(1)} 
          onClick={() => openSection("last_seen")} 
        />
        <MenuItem 
          label="Profile picture" 
          detail={settings.profilePhoto === "everyone" ? "Everyone" : settings.profilePhoto === "contacts" ? "My contacts" : "Nobody"} 
          onClick={() => openSection("profile_pic_privacy")} 
        />
        <MenuItem 
          label="About" 
          detail={settings.about === "everyone" ? "Everyone" : settings.about === "contacts" ? "My contacts" : "Nobody"} 
          onClick={() => openSection("about_privacy")} 
        />
        <MenuItem 
          label="Status" 
          detail={settings.statusVisibility === "everyone" ? "Everyone" : settings.statusVisibility === "contacts" ? "My contacts" : "Nobody"} 
          onClick={() => openSection("status_privacy")} 
        />

        <div className="border-t border-border mt-2" />
        
        <Toggle 
          label="Read receipts" 
          value={settings.readReceipts} 
          onChange={(v) => updateSetting("readReceipts", "readReceipts", v)} 
          description="If turned off, you won't send or receive Read receipts. Read receipts are always sent for group chats." 
        />

        <div className="border-t border-border mt-2" />
        <div className="px-4 py-3">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Disappearing messages</p>
        </div>
        <MenuItem label="Default message timer" detail="Off" />
        <p className="px-4 text-[12px] text-muted-foreground pb-3 leading-snug">Start new chats with disappearing messages set to your timer</p>
        
        <div className="border-t border-border mt-2" />
        <MenuItem label="Groups" detail="Everyone" />
        <MenuItem label="Live location" detail="None" />
        <MenuItem label="Calls" detail="Silence unknown callers" />
        <MenuItem label="Blocked contacts" detail="None" />
        <MenuItem label="App lock" detail="Disabled" />
      </div>
    </div>
  );

  const renderLastSeen = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Last seen and online" onBack={() => openSection("privacy")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-4">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider">Who can see my last seen</p>
        </div>
        <SelectOption 
          label="" 
          value={settings.lastSeen} 
          options={[
            {label: "Everyone", value: "everyone"},
            {label: "My contacts", value: "contacts"},
            {label: "My contacts except...", value: "except"},
            {label: "Nobody", value: "nobody"}
          ]} 
          onChange={(v) => updateSetting("lastSeen", "lastSeenVisibility", v)} 
        />
        
        <div className="border-t border-border mt-4" />
        <div className="px-4 py-4">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider">Who can see when I'm online</p>
        </div>
        <SelectOption 
          label="" 
          value={settings.onlineStatus ? "everyone" : "same"} 
          options={[
            {label: "Everyone", value: "everyone"},
            {label: "Same as last seen", value: "same"}
          ]} 
          onChange={(v) => updateSetting("onlineStatus", "onlineStatusVisible", v === "everyone")} 
        />
        <p className="px-4 py-4 text-[13px] text-muted-foreground leading-relaxed">
          If you don't share when you were last seen or online, you won't be able to see when other people were last seen or online.
        </p>
      </div>
    </div>
  );

  const renderProfilePicPrivacy = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Profile picture" onBack={() => openSection("privacy")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-4">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider">Who can see my profile picture</p>
        </div>
        <SelectOption 
          label="" 
          value={settings.profilePhoto} 
          options={[
            {label: "Everyone", value: "everyone"},
            {label: "My contacts", value: "contacts"},
            {label: "My contacts except...", value: "except"},
            {label: "Nobody", value: "nobody"}
          ]} 
          onChange={(v) => updateSetting("profilePhoto", "profilePhotoVisibility", v)} 
        />
      </div>
    </div>
  );

  const renderAboutPrivacy = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="About" onBack={() => openSection("privacy")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-4">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider">Who can see my About</p>
        </div>
        <SelectOption 
          label="" 
          value={settings.about} 
          options={[
            {label: "Everyone", value: "everyone"},
            {label: "My contacts", value: "contacts"},
            {label: "My contacts except...", value: "except"},
            {label: "Nobody", value: "nobody"}
          ]} 
          onChange={(v) => updateSetting("about", "aboutVisibility", v)} 
        />
      </div>
    </div>
  );

  const renderStatusPrivacy = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Status privacy" onBack={() => openSection("privacy")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-4">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-wider">Who can see my status updates</p>
        </div>
        <SelectOption 
          label="" 
          value={settings.statusVisibility} 
          options={[
            {label: "My contacts", value: "contacts"},
            {label: "My contacts except...", value: "except"},
            {label: "Only share with...", value: "everyone"} // Mapping for demo
          ]} 
          onChange={(v) => updateSetting("statusVisibility", "statusVisibility", v)} 
        />

        <div className="border-t border-border mt-6" />
        <Toggle 
          label="Allow sharing" 
          value={settings.statusAutoDelete} 
          onChange={(v) => updateSetting("statusAutoDelete", "statusAutoDelete", v)} 
          description="Let people who can see your status reshare and forward it."
        />
        <p className="px-4 py-4 text-[13px] text-muted-foreground leading-relaxed">
          Changes to your privacy settings won't affect status updates that you shared already.
        </p>
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
        <SelectOption 
          label="Chat wallpaper" 
          value={settings.wallpaper} 
          options={[
            {label:"Default Dark", value:"#0b141a"}, 
            {label:"Teal Green", value:"#075e54"}, 
            {label:"Deep Blue", value:"#054d80"},
            {label:"Dark Grey", value:"#1a1d21"},
            {label:"Burgundy", value:"#4a0e0e"}
          ]} 
          onChange={(v) => updateSetting("wallpaper", "wallpaper", v)} 
        />
        <div className="px-4 pb-4">
          <input ref={wallpaperRef} type="file" accept="image/*" onChange={handleWallpaperSelect} className="hidden" />
          <button 
            onClick={() => wallpaperRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-primary font-medium text-sm transition-colors border border-border/50"
          >
            <Image className="w-4 h-4" /> Choose from Gallery
          </button>
        </div>
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
        <SelectOption 
          label="App Language" 
          value={settings.appLanguage} 
          options={[{label:"English", value:"English"}, {label:"Spanish", value:"Spanish"}]} 
          onChange={(v) => updateSetting("appLanguage", "appLanguage", v)} 
        />
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
        <MenuItem icon={FileText} label="Terms of Service" onClick={() => openSection("tos")} />
        <MenuItem icon={Shield} label="Privacy Policy" onClick={() => openSection("privacy_policy")} />
        <MenuItem icon={FileText} label="Open source licenses" onClick={() => openSection("licenses")} />
        <div className="border-t border-border" />
        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">Made by Ramya</p>
          <p className="text-xs text-muted-foreground text-center mt-1">© 2026 ZIVOX. All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  const renderTOS = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Terms of Service" onBack={() => openSection("about")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">1. Agreement to Terms</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">By accessing or using ZIVOX, you agree to be bound by these terms. If you do not agree, please do not use the service.</p>
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">2. User Conduct</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">You agree not to use ZIVOX for any unlawful purpose or to engage in any conduct that harms other users or the service itself.</p>
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">3. Data Usage</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">ZIVOX uses end-to-end encryption for your messages. We do not store your private conversations on our servers in an unencrypted format.</p>
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">4. Account Responsibility</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</p>
      </div>
    </div>
  );

  const renderPrivacyPolicy = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Privacy Policy" onBack={() => openSection("about")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Information We Collect</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">We collect minimal information to provide the service, including your phone number (if applicable), name, and basic profile info.</p>
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Security</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Your privacy is our priority. We use Firebase and other secure technologies to protect your data.</p>
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Your Rights</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">You have the right to delete your account and all associated data at any time through the settings in this app.</p>
      </div>
    </div>
  );

  const renderLicenses = () => (
    <div className="flex flex-col h-full bg-background">
      <PanelHeader title="Open Source Licenses" onBack={() => openSection("about")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <p className="p-4 text-xs text-muted-foreground">ZIVOX is built with the following open-source software:</p>
        <div className="border-t border-border" />
        <MenuItem label="React" detail="MIT License" />
        <MenuItem label="Tailwind CSS" detail="MIT License" />
        <MenuItem label="Lucide React" detail="ISC License" />
        <MenuItem label="Framer Motion" detail="MIT License" />
        <MenuItem label="Firebase" detail="Apache 2.0" />
        <MenuItem label="Zustand" detail="MIT License" />
        <div className="p-4 text-[10px] text-muted-foreground">
          Detailed license info available on our GitHub repository.
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile": return renderProfile();
      case "account": return renderAccount();
      case "privacy": return renderPrivacy();
      case "last_seen": return renderLastSeen();
      case "profile_pic_privacy": return renderProfilePicPrivacy();
      case "about_privacy": return renderAboutPrivacy();
      case "status_privacy": return renderStatusPrivacy();
      case "avatar": return <div className="flex flex-col h-full"><PanelHeader title="Avatar" onBack={goBack} /><div className="p-8 text-center text-muted-foreground">Avatar settings coming soon...</div></div>;
      case "lists": return <div className="flex flex-col h-full"><PanelHeader title="Lists" onBack={goBack} /><div className="p-8 text-center text-muted-foreground">Manage your people and groups here...</div></div>;
      case "chats": return renderChats();
      case "broadcasts": return <div className="flex flex-col h-full"><PanelHeader title="Broadcasts" onBack={goBack} /><div className="p-8 text-center text-muted-foreground">Broadcast lists coming soon...</div></div>;
      case "notifications": return renderNotifications();
      case "storage": return renderStorage();
      case "accessibility": return <div className="flex flex-col h-full"><PanelHeader title="Accessibility" onBack={goBack} /><div className="p-8 text-center text-muted-foreground">Accessibility options coming soon...</div></div>;
      case "language": return <div className="flex flex-col h-full"><PanelHeader title="App Language" onBack={goBack} /><div className="p-8 text-center text-muted-foreground">Language settings...</div></div>;
      case "help": return renderHelp();
      case "about": return renderAbout();
      case "tos": return renderTOS();
      case "privacy_policy": return renderPrivacyPolicy();
      case "licenses": return renderLicenses();
      default: return null;
    }
  };

  const sections: { id: SectionId; icon: any; label: string; detail: string }[] = [
    { id: "account", icon: Key, label: "Account", detail: "Security notifications, change number" },
    { id: "privacy", icon: Lock, label: "Privacy", detail: "Block contacts, disappearing messages" },
    { id: "avatar", icon: UserCircle, label: "Avatar", detail: "Create, edit, profile photo" },
    { id: "lists", icon: Users, label: "Lists", detail: "Manage people and groups" },
    { id: "chats", icon: MessageSquare, label: "Chats", detail: "Theme, wallpapers, chat history" },
    { id: "broadcasts", icon: Megaphone, label: "Broadcasts", detail: "Manage lists and send broadcasts" },
    { id: "notifications", icon: Bell, label: "Notifications", detail: "Message, group & call tones" },
    { id: "storage", icon: Database, label: "Storage and data", detail: "Network usage, auto-download" },
    { id: "accessibility", icon: Accessibility, label: "Accessibility", detail: "Increase contrast, animation" },
    { id: "language", icon: Globe, label: "App language", detail: "English (device's language)" },
    { id: "help", icon: HelpCircle, label: "Help and feedback", detail: "Help centre, contact us, privacy policy" },
  ];

  const renderMainMenu = () => (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <button className="p-2 rounded-full hover:bg-secondary text-muted-foreground mr-1">
          <Search className="w-5 h-5 transition-transform active:scale-90" />
        </button>
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
              <h3 className="text-[17px] font-semibold text-foreground leading-tight">{profile?.name || "User"}</h3>
              <p className="text-[14px] text-muted-foreground truncate mt-0.5">{profile?.bio || "Hey there! I'm using ZIVOX"}</p>
            </div>
            <QrCode className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Menu Items */}
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => openSection(section.id)}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-left"
          >
            <section.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-foreground leading-tight">{section.label}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{section.detail}</p>
            </div>
          </button>
        ))}

        {/* About Section at the bottom */}
        <button
          onClick={() => openSection("about")}
          className="w-full flex items-center gap-4 px-4 py-4 mt-2 hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-left border-t border-border/50"
        >
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-foreground">About ZIVOX</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">Version, legal, licenses</p>
          </div>
        </button>

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

// Reusable components moved outside for stability
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
        <div
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
        </div>
      ))}
    </div>
  </div>
);

const MenuItem = ({ icon: Icon, label, onClick, danger, detail }: { icon?: any; label: string; onClick?: () => void; danger?: boolean; detail?: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 py-3 px-4 hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-left ${danger ? "text-destructive" : ""}`}
  >
    {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${danger ? "" : "text-muted-foreground"}`} />}
    <div className="flex-1 min-w-0">
      <p className={`text-[15px] ${danger ? "" : "text-foreground"}`}>{label}</p>
      {detail && <p className="text-[13px] text-muted-foreground mt-0.5">{detail}</p>}
    </div>
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

export default SettingsPage;
