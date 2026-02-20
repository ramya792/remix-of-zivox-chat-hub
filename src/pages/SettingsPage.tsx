import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  User, Camera, Edit3, Phone, Mail, QrCode, Key, Trash2, LogOut, Shield, Eye, EyeOff,
  Lock, Smartphone, Fingerprint, MessageSquare, Palette, Type, Image, Archive,
  Database, Bell, BellOff, Volume2, Vibrate, Download, Wifi, HardDrive, Radio,
  Clock, Info, FileText, Code, HelpCircle, Bug, HeadphonesIcon, Moon, Sun,
  ChevronRight, Globe, Paintbrush
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PrivacyOption = "everyone" | "contacts" | "nobody";

const SettingsPage = () => {
  const { profile, logout } = useAuthStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Settings state (local - would persist to Firebase in production)
  const [settings, setSettings] = useState({
    // Privacy
    lastSeen: "everyone" as PrivacyOption,
    onlineStatus: true,
    profilePhoto: "everyone" as PrivacyOption,
    about: "everyone" as PrivacyOption,
    readReceipts: true,
    groupsAddMe: "everyone" as PrivacyOption,
    // Chats
    enterIsSend: true,
    fontSize: "medium" as "small" | "medium" | "large",
    archivedChats: "keep" as "keep" | "auto",
    // Notifications
    messageSound: true,
    messageVibrate: true,
    messagePopup: true,
    groupNotifications: true,
    callNotifications: true,
    muteAll: false,
    // Storage
    autoDownloadWifi: true,
    autoDownloadMobile: false,
    dataSaver: false,
    // Status
    statusVisibility: "everyone" as PrivacyOption,
    statusAutoDelete: true,
    // Appearance
    darkMode: true,
    appLanguage: "English",
  });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SettingToggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );

  const SettingSelect = ({ label, value, options, onChange }: {
    label: string; value: string; options: { label: string; value: string }[]; onChange: (v: any) => void;
  }) => (
    <div className="py-2.5">
      <span className="text-sm text-foreground block mb-2">{label}</span>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === opt.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, id }: { icon: any; title: string; id: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm text-foreground">{title}</span>
      </div>
      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === id ? "rotate-90" : ""}`} />
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Profile Card */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.profilePic ? (
                  <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-xl">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{profile?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground truncate">{profile?.bio || "Hey there! I'm using ZIVOX"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile */}
        <SectionHeader icon={User} title="Profile" id="profile" />
        <AnimatePresence>
          {expandedSection === "profile" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-3 border-b border-border">
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-foreground">Name</p><p className="text-xs text-muted-foreground">{profile?.name}</p></div>
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-foreground">Bio / About</p><p className="text-xs text-muted-foreground">{profile?.bio || "Hey there! I'm using ZIVOX"}</p></div>
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm text-foreground">Email</p><p className="text-xs text-muted-foreground">{profile?.email}</p></div>
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account */}
        <SectionHeader icon={Key} title="Account" id="account" />
        <AnimatePresence>
          {expandedSection === "account" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Key className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Change password</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Mail className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Email settings</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left text-destructive"><Trash2 className="w-4 h-4" /><span className="text-sm">Delete account</span></button>
                <button onClick={logout} className="w-full flex items-center gap-3 py-2.5 text-left text-destructive"><LogOut className="w-4 h-4" /><span className="text-sm">Logout</span></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy */}
        <SectionHeader icon={Shield} title="Privacy" id="privacy" />
        <AnimatePresence>
          {expandedSection === "privacy" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <SettingSelect label="Last seen" value={settings.lastSeen} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => setSettings(s=>({...s,lastSeen:v}))} />
                <SettingToggle label="Online status" value={settings.onlineStatus} onChange={(v) => setSettings(s=>({...s,onlineStatus:v}))} />
                <SettingSelect label="Profile photo" value={settings.profilePhoto} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => setSettings(s=>({...s,profilePhoto:v}))} />
                <SettingSelect label="About" value={settings.about} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => setSettings(s=>({...s,about:v}))} />
                <SettingToggle label="Read receipts (Blue ticks)" value={settings.readReceipts} onChange={(v) => setSettings(s=>({...s,readReceipts:v}))} />
                <SettingSelect label="Who can add me to groups" value={settings.groupsAddMe} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => setSettings(s=>({...s,groupsAddMe:v}))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security */}
        <SectionHeader icon={Lock} title="Security" id="security" />
        <AnimatePresence>
          {expandedSection === "security" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Shield className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">End-to-end encryption info</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Smartphone className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Device login activity</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><LogOut className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Logout from all devices</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Fingerprint className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">App lock / PIN / Biometric</span></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chats */}
        <SectionHeader icon={MessageSquare} title="Chats" id="chats" />
        <AnimatePresence>
          {expandedSection === "chats" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Palette className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Chat wallpaper</span></button>
                <SettingToggle label="Enter is send" value={settings.enterIsSend} onChange={(v) => setSettings(s=>({...s,enterIsSend:v}))} />
                <SettingSelect label="Font size" value={settings.fontSize} options={[{label:"Small",value:"small"},{label:"Medium",value:"medium"},{label:"Large",value:"large"}]} onChange={(v) => setSettings(s=>({...s,fontSize:v}))} />
                <SettingSelect label="Archived chats" value={settings.archivedChats} options={[{label:"Keep archived",value:"keep"},{label:"Auto unarchive",value:"auto"}]} onChange={(v) => setSettings(s=>({...s,archivedChats:v}))} />
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Database className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Chat backup (Firebase)</span></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <SectionHeader icon={Bell} title="Notifications" id="notifications" />
        <AnimatePresence>
          {expandedSection === "notifications" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <SettingToggle label="Message sound" value={settings.messageSound} onChange={(v) => setSettings(s=>({...s,messageSound:v}))} />
                <SettingToggle label="Message vibrate" value={settings.messageVibrate} onChange={(v) => setSettings(s=>({...s,messageVibrate:v}))} />
                <SettingToggle label="Message popup" value={settings.messagePopup} onChange={(v) => setSettings(s=>({...s,messagePopup:v}))} />
                <SettingToggle label="Group notifications" value={settings.groupNotifications} onChange={(v) => setSettings(s=>({...s,groupNotifications:v}))} />
                <SettingToggle label="Call notifications" value={settings.callNotifications} onChange={(v) => setSettings(s=>({...s,callNotifications:v}))} />
                <SettingToggle label="Mute all" value={settings.muteAll} onChange={(v) => setSettings(s=>({...s,muteAll:v}))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Storage & Data */}
        <SectionHeader icon={HardDrive} title="Storage & Data" id="storage" />
        <AnimatePresence>
          {expandedSection === "storage" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <SettingToggle label="Auto download on WiFi" value={settings.autoDownloadWifi} onChange={(v) => setSettings(s=>({...s,autoDownloadWifi:v}))} />
                <SettingToggle label="Auto download on Mobile" value={settings.autoDownloadMobile} onChange={(v) => setSettings(s=>({...s,autoDownloadMobile:v}))} />
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><HardDrive className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Storage usage</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left text-destructive"><Trash2 className="w-4 h-4" /><span className="text-sm">Clear cache</span></button>
                <SettingToggle label="Data saver mode" value={settings.dataSaver} onChange={(v) => setSettings(s=>({...s,dataSaver:v}))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status / Stories */}
        <SectionHeader icon={Radio} title="Status / Stories" id="status" />
        <AnimatePresence>
          {expandedSection === "status" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <SettingSelect label="Who can see my status" value={settings.statusVisibility} options={[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}]} onChange={(v) => setSettings(s=>({...s,statusVisibility:v}))} />
                <SettingToggle label="Auto delete after 24 hrs" value={settings.statusAutoDelete} onChange={(v) => setSettings(s=>({...s,statusAutoDelete:v}))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appearance */}
        <SectionHeader icon={Paintbrush} title="Appearance" id="appearance" />
        <AnimatePresence>
          {expandedSection === "appearance" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <SettingToggle label="Dark mode" value={settings.darkMode} onChange={(v) => setSettings(s=>({...s,darkMode:v}))} />
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Palette className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Theme color</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Type className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Font style</span></button>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Language</span></div>
                  <span className="text-xs text-muted-foreground">{settings.appLanguage}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help */}
        <SectionHeader icon={HelpCircle} title="Help" id="help" />
        <AnimatePresence>
          {expandedSection === "help" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><HelpCircle className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Help center</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><Bug className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Report a problem</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><HeadphonesIcon className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Contact support</span></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* About ZIVOX */}
        <SectionHeader icon={Info} title="About ZIVOX" id="about" />
        <AnimatePresence>
          {expandedSection === "about" && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-4 py-2 space-y-1 border-b border-border">
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Terms & Privacy Policy</span></button>
                <button className="w-full flex items-center gap-3 py-2.5 text-left"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Licenses</span></button>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3"><Code className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Version</span></div>
                  <span className="text-xs text-muted-foreground">1.0.0</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3"><Info className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Developer</span></div>
                  <span className="text-xs text-muted-foreground">ZIVOX Team</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4" />
      </div>
    </div>
  );
};

export default SettingsPage;
