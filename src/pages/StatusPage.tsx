import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { statusImageToBase64 } from "@/lib/imageUtils";
import { Plus, X, Image as ImageIcon, Radio, Trash2, Eye, Type, Music, Palette, Bold, Italic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Status {
  id: string;
  uid: string;
  userName: string;
  userPic: string;
  text: string;
  imageUrl?: string;
  backgroundColor: string;
  fontStyle?: string;
  textColor?: string;
  songName?: string;
  createdAt: any;
  viewedBy: string[];
}

const BG_COLORS = [
  "bg-gradient-to-br from-primary to-emerald-700",
  "bg-gradient-to-br from-emerald-500 to-teal-700",
  "bg-gradient-to-br from-blue-500 to-indigo-700",
  "bg-gradient-to-br from-purple-500 to-pink-700",
  "bg-gradient-to-br from-pink-500 to-rose-700",
  "bg-gradient-to-br from-orange-500 to-red-700",
  "bg-gradient-to-br from-red-500 to-pink-700",
  "bg-gradient-to-br from-teal-500 to-cyan-700",
];

const TEXT_COLORS = ["#ffffff", "#000000", "#ff4444", "#ffaa00", "#44ff44", "#4488ff", "#ff44ff", "#44ffff"];

const FONT_STYLES = [
  { label: "Normal", value: "normal", cls: "font-sans" },
  { label: "Bold", value: "bold", cls: "font-sans font-bold" },
  { label: "Italic", value: "italic", cls: "font-sans italic" },
  { label: "Serif", value: "serif", cls: "font-serif" },
  { label: "Mono", value: "mono", cls: "font-mono" },
  { label: "Cursive", value: "cursive", cls: "" },
];

const SONGS = [
  { name: "None", url: "" },
  { name: "Chill Vibes", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Lo-fi Beat", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "Acoustic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { name: "Electronic", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { name: "Jazz", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

interface StoryGroup {
  uid: string;
  userName: string;
  userPic: string;
  statuses: Status[];
}

type StatusPrivacy = "everyone" | "contacts" | "nobody";
const StatusPage = () => {
  const { user, profile } = useAuthStore();
  // Status privacy selection
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false);
  const [statusPrivacy, setStatusPrivacy] = useState<StatusPrivacy>(profile?.statusVisibility || "everyone");

  useEffect(() => {
    if (profile?.statusVisibility) setStatusPrivacy(profile.statusVisibility);
  }, [profile]);

  const handlePrivacyChange = async (val: StatusPrivacy) => {
    setStatusPrivacy(val);
    setShowPrivacyPicker(false);
    // Persist to Firestore via authStore
    if (user && val !== profile?.statusVisibility && typeof window !== 'undefined') {
      try {
        await useAuthStore.getState().updateUserProfile({ statusVisibility: val });
      } catch (e) { alert("Failed to update privacy"); }
    }
  };
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedBg, setSelectedBg] = useState(0);
  const [posting, setPosting] = useState(false);
  const [statusImage, setStatusImage] = useState<File | null>(null);
  const [statusImagePreview, setStatusImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Text editing
  const [selectedFont, setSelectedFont] = useState(0);
  const [selectedTextColor, setSelectedTextColor] = useState(0);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [selectedSong, setSelectedSong] = useState(0);

  // Song playback in viewer
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Story viewer
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeGroupIdx, setActiveGroupIdx] = useState(-1);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const startTimeRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const STORY_DURATION = 5000;

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Subscribe statuses
  useEffect(() => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const q = query(collection(db, "statuses"), where("createdAt", ">=", cutoff), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStatuses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Status)));
    }, (err) => console.error("Status sub error:", err));
    return () => unsub();
  }, []);

  // Build groups
  useEffect(() => {
    if (!user) return;
    const map = new Map<string, StoryGroup>();
    const mine = statuses.filter((s) => s.uid === user.uid);
    if (mine.length > 0) {
      map.set(user.uid, { uid: user.uid, userName: "My Status", userPic: profile?.profilePic || "", statuses: [...mine].reverse() });
    }
    for (const s of statuses) {
      if (s.uid === user.uid) continue;
      if (!map.has(s.uid)) map.set(s.uid, { uid: s.uid, userName: s.userName, userPic: s.userPic, statuses: [] });
      map.get(s.uid)!.statuses.push(s);
    }
    map.forEach((g) => { if (g.uid !== user.uid) g.statuses.reverse(); });

    const groups: StoryGroup[] = [];
    if (map.has(user.uid)) groups.push(map.get(user.uid)!);
    map.forEach((g) => { if (g.uid !== user.uid) groups.push(g); });
    setStoryGroups(groups);
  }, [statuses, user, profile]);

  // Animation-frame based progress
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
    const tick = (now: number) => {
      if (pausedRef.current) {
        startTimeRef.current = now - (progress / 100) * STORY_DURATION;
        timerRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startTimeRef.current;
      const pct = (elapsed / STORY_DURATION) * 100;
      if (pct >= 100) {
        setProgress(100);
        // Auto advance
        advanceRef.current();
        return;
      }
      setProgress(pct);
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { cancelAnimationFrame(timerRef.current); timerRef.current = null; }
  }, []);

  // Advance to next story/group
  const advanceRef = useRef(() => {});
  advanceRef.current = () => {
    const group = storyGroups[activeGroupIdx];
    if (!group) { closeStories(); return; }
    if (activeStoryIdx < group.statuses.length - 1) {
      setActiveStoryIdx(activeStoryIdx + 1);
    } else if (activeGroupIdx < storyGroups.length - 1) {
      setActiveGroupIdx(activeGroupIdx + 1);
      setActiveStoryIdx(0);
    } else {
      closeStories();
    }
  };

  // Restart timer on story change
  useEffect(() => {
    if (activeGroupIdx < 0) return;
    stopTimer();
    setProgress(0);
    startTimer();
    return () => stopTimer();
  }, [activeGroupIdx, activeStoryIdx]);

  // Play song if story has one
  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (activeGroupIdx < 0) return;
    const group = storyGroups[activeGroupIdx];
    const status = group?.statuses[activeStoryIdx] as any;
    if (status?.songUrl) {
      const audio = new Audio(status.songUrl);
      audio.volume = 0.5;
      audio.loop = true;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [activeGroupIdx, activeStoryIdx, storyGroups]);

  // Mark as viewed
  useEffect(() => {
    if (activeGroupIdx < 0 || !user) return;
    const group = storyGroups[activeGroupIdx];
    const status = group?.statuses[activeStoryIdx];
    if (!status || status.uid === user.uid || status.viewedBy?.includes(user.uid)) return;
    updateDoc(doc(db, "statuses", status.id), { viewedBy: arrayUnion(user.uid) }).catch(() => {});
  }, [activeGroupIdx, activeStoryIdx, user]);

  const openStories = useCallback((idx: number) => {
    setActiveGroupIdx(idx);
    setActiveStoryIdx(0);
    setProgress(0);
    setPaused(false);
  }, []);

  const closeStories = useCallback(() => {
    stopTimer();
    setActiveGroupIdx(-1);
    setActiveStoryIdx(0);
    setProgress(0);
    setPaused(false);
  }, [stopTimer]);

  const goNext = useCallback(() => {
    advanceRef.current();
  }, []);

  const goPrev = useCallback(() => {
    if (activeStoryIdx > 0) {
      setActiveStoryIdx((i) => i - 1);
    } else if (activeGroupIdx > 0) {
      const prevGroup = storyGroups[activeGroupIdx - 1];
      setActiveGroupIdx((i) => i - 1);
      setActiveStoryIdx(prevGroup ? prevGroup.statuses.length - 1 : 0);
    }
  }, [activeStoryIdx, activeGroupIdx, storyGroups]);

  const handleStoryTap = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) goPrev();
    else goNext();
  }, [goNext, goPrev]);

  const handlePost = async () => {
    if ((!statusText.trim() && !statusImage) || !user || !profile) return;
    setPosting(true);
    const textVal = statusText.trim();
    const imageFile = statusImage;
    const bgColor = BG_COLORS[selectedBg];
    const fontStyle = FONT_STYLES[selectedFont].value;
    const textColor = TEXT_COLORS[selectedTextColor];
    const songName = SONGS[selectedSong].name !== "None" ? SONGS[selectedSong].name : "";
    const songUrl = SONGS[selectedSong].url;
    setStatusText(""); setStatusImage(null); setStatusImagePreview(null); setShowCompose(false);
    setSelectedFont(0); setSelectedTextColor(0); setSelectedSong(0);
    setShowFontPicker(false); setShowColorPicker(false); setShowSongPicker(false);
    try {
      let imageUrl = "";
      if (imageFile) imageUrl = await statusImageToBase64(imageFile);
      await addDoc(collection(db, "statuses"), {
        uid: user.uid, userName: profile.name, userPic: profile.profilePic || "",
        text: textVal, imageUrl, backgroundColor: imageUrl ? "" : bgColor,
        fontStyle, textColor, songName, songUrl: songUrl || "",
        createdAt: serverTimestamp(), viewedBy: [],
      });
    } catch (e) { console.error("Post error:", e); alert("Failed to post. Try again."); }
    setPosting(false);
  };

  const handleDeleteStatus = async (id: string) => { try { await deleteDoc(doc(db, "statuses", id)); } catch {} };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusImage(file);
    const reader = new FileReader();
    reader.onload = () => setStatusImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const myStatuses = statuses.filter((s) => s.uid === user?.uid);
  const formatTime = (ts: any) => {
    if (!ts) return "";
    try { return formatDistanceToNow(ts.toDate ? ts.toDate() : new Date(ts), { addSuffix: false }); } catch { return ""; }
  };
  const findGroupIdx = (uid: string) => storyGroups.findIndex((g) => g.uid === uid);
  const currentGroup = activeGroupIdx >= 0 ? storyGroups[activeGroupIdx] : null;
  const currentStory = currentGroup?.statuses[activeStoryIdx] || null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Status</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Tap to view · Auto-deletes after 24h</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* My Status */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors">
            <button onClick={() => { const i = findGroupIdx(user?.uid || ""); i >= 0 ? openStories(i) : setShowCompose(true); }} className="relative flex-shrink-0">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden ${myStatuses.length > 0 ? "ring-[2.5px] ring-primary ring-offset-2 ring-offset-background" : "bg-primary/20"}`}>
                {profile?.profilePic ? <img src={profile.profilePic} alt="" className="w-full h-full object-cover" /> : <span className="text-primary font-bold text-lg">{profile?.name?.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3 text-primary-foreground" />
              </div>
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { const i = findGroupIdx(user?.uid || ""); i >= 0 ? openStories(i) : setShowCompose(true); }}>
              <p className="font-semibold text-sm text-foreground">My Status</p>
              <p className="text-xs text-muted-foreground">
                {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""} · ${formatTime(myStatuses[0]?.createdAt)}` : "Tap to add status update"}
              </p>
            </div>
            <button onClick={() => setShowCompose(true)} className="p-2 rounded-lg hover:bg-secondary text-primary" title="Add status">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Others */}
        {storyGroups.filter((g) => g.uid !== user?.uid).length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Recent updates</p>
            {storyGroups.filter((g) => g.uid !== user?.uid).map((group) => {
              const idx = findGroupIdx(group.uid);
              const allViewed = group.statuses.every((s) => s.viewedBy?.includes(user?.uid || ""));
              return (
                <button key={group.uid} onClick={() => openStories(idx)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${allViewed ? "ring-[2.5px] ring-muted-foreground/30 ring-offset-2 ring-offset-background" : "ring-[2.5px] ring-primary ring-offset-2 ring-offset-background"}`}>
                    {group.userPic ? <img src={group.userPic} alt="" className="w-full h-full object-cover" /> : <span className="text-primary font-bold text-lg bg-primary/20 w-full h-full flex items-center justify-center">{group.userName.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{group.userName}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(group.statuses[group.statuses.length - 1]?.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {statuses.length === 0 && (
          <div className="text-center py-12 px-4">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No status updates yet</p>
            <button onClick={() => setShowCompose(true)} className="mt-3 text-primary text-sm font-medium hover:underline">Post your first status</button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowCompose(true)} className="absolute bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-10">
        <Plus className="w-6 h-6" />
      </button>

      {/* ===== Compose ===== */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Create Status</h3>
                <button onClick={() => { setShowCompose(false); setStatusImage(null); setStatusImagePreview(null); setShowFontPicker(false); setShowColorPicker(false); setShowSongPicker(false); }} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
                <div className="p-5">
                  {/* Status Privacy Picker */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowPrivacyPicker((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 text-sm font-medium mb-2"
                    >
                      <span>Who can see my status</span>
                      <span className="text-xs text-muted-foreground">{statusPrivacy === "everyone" ? "Everyone" : statusPrivacy === "contacts" ? "Contacts" : "Nobody"}</span>
                    </button>
                    {showPrivacyPicker && (
                      <div className="mt-2 bg-card border border-border rounded-xl shadow-lg p-3">
                        {[{label:"Everyone",value:"everyone"},{label:"Contacts",value:"contacts"},{label:"Nobody",value:"nobody"}].map(opt => (
                          <label
                            key={opt.value}
                            onClick={() => handlePrivacyChange(opt.value as StatusPrivacy)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${statusPrivacy === opt.value ? "bg-primary/10" : "hover:bg-secondary/60"}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${statusPrivacy === opt.value ? "border-primary" : "border-muted-foreground/40"}`}>
                              {statusPrivacy === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <span className={`text-sm ${statusPrivacy === opt.value ? "text-foreground font-medium" : "text-muted-foreground"}`}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                {statusImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden mb-4">
                    <img src={statusImagePreview} alt="" className="w-full max-h-[250px] object-cover" />
                    <button onClick={() => { setStatusImage(null); setStatusImagePreview(null); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"><X className="w-4 h-4" /></button>
                    <textarea
                      value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="Add a caption..."
                      className={`w-full mt-2 bg-secondary rounded-xl px-4 py-2.5 placeholder:text-muted-foreground text-sm outline-none resize-none ${FONT_STYLES[selectedFont].cls}`}
                      style={{ color: TEXT_COLORS[selectedTextColor], fontFamily: FONT_STYLES[selectedFont].value === "cursive" ? "'Dancing Script', cursive" : undefined }}
                      rows={2}
                    />
                  </div>
                ) : (
                  <div className={`${BG_COLORS[selectedBg]} rounded-xl p-6 min-h-[200px] flex items-center justify-center mb-4`}>
                    <textarea
                      value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="What's on your mind?"
                      className={`w-full bg-transparent placeholder:text-white/60 text-center text-lg outline-none resize-none ${FONT_STYLES[selectedFont].cls}`}
                      style={{ color: TEXT_COLORS[selectedTextColor], fontFamily: FONT_STYLES[selectedFont].value === "cursive" ? "'Dancing Script', cursive" : undefined }}
                      rows={4}
                    />
                  </div>
                )}

                {/* Editing toolbar */}
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => { setShowFontPicker(!showFontPicker); setShowColorPicker(false); setShowSongPicker(false); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${showFontPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                    <Type className="w-3.5 h-3.5" /> Font
                  </button>
                  <button onClick={() => { setShowColorPicker(!showColorPicker); setShowFontPicker(false); setShowSongPicker(false); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${showColorPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                    <Palette className="w-3.5 h-3.5" /> Color
                  </button>
                  <button onClick={() => { setShowSongPicker(!showSongPicker); setShowFontPicker(false); setShowColorPicker(false); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${showSongPicker ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                    <Music className="w-3.5 h-3.5" /> Song
                  </button>
                </div>

                {/* Font picker */}
                <AnimatePresence>
                  {showFontPicker && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                      <div className="grid grid-cols-3 gap-2">
                        {FONT_STYLES.map((f, i) => (
                          <button key={f.value} onClick={() => setSelectedFont(i)} className={`px-3 py-2.5 rounded-xl text-xs transition-colors ${selectedFont === i ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"} ${f.cls}`} style={{ fontFamily: f.value === "cursive" ? "'Dancing Script', cursive" : undefined }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Text color picker */}
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Text color</p>
                      <div className="flex gap-2 flex-wrap">
                        {TEXT_COLORS.map((c, i) => (
                          <button key={c} onClick={() => setSelectedTextColor(i)} className={`w-8 h-8 rounded-full border-2 ${selectedTextColor === i ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Song picker */}
                <AnimatePresence>
                  {showSongPicker && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Add background music</p>
                      <div className="space-y-1">
                        {SONGS.map((s, i) => (
                          <label key={s.name} onClick={() => setSelectedSong(i)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selectedSong === i ? "bg-primary/10" : "hover:bg-secondary/60"}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedSong === i ? "border-primary" : "border-muted-foreground/40"}`}>
                              {selectedSong === i && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <Music className={`w-4 h-4 ${selectedSong === i ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-sm ${selectedSong === i ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.name}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Background colors */}
                {!statusImagePreview && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {BG_COLORS.map((bg, i) => <button key={i} onClick={() => setSelectedBg(i)} className={`w-8 h-8 rounded-full ${bg} ${selectedBg === i ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`} />)}
                  </div>
                )}

                {/* Selected song indicator */}
                {selectedSong > 0 && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-primary/10 text-sm">
                    <Music className="w-4 h-4 text-primary" />
                    <span className="text-foreground flex-1">{SONGS[selectedSong].name}</span>
                    <button onClick={() => setSelectedSong(0)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <button onClick={() => imageInputRef.current?.click()} className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm hover:bg-secondary/80 flex items-center justify-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4" /> Gallery
                </button>
                <button onClick={handlePost} disabled={(!statusText.trim() && !statusImage) || posting} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  {posting ? "Posting..." : "Post Status"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Instagram Story Viewer ===== */}
      <AnimatePresence>
        {activeGroupIdx >= 0 && currentGroup && currentStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[60] bg-black flex flex-col select-none">
            {/* Progress bars */}
            <div className="flex gap-[3px] px-2 pt-2 pb-1 z-20">
              {currentGroup.statuses.map((_, i) => (
                <div key={i} className="flex-1 h-[2.5px] bg-white/25 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: i < activeStoryIdx ? "100%" : i === activeStoryIdx ? `${Math.min(progress, 100)}%` : "0%", transition: "none" }} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2 z-20">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentGroup.userPic ? <img src={currentGroup.userPic} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-sm">{currentGroup.userName.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold">{currentGroup.uid === user?.uid ? "My Status" : currentGroup.userName}</p>
                  {(currentStory as any).songName && (
                    <span className="flex items-center gap-1 text-white/50 text-xs"><Music className="w-3 h-3" />{(currentStory as any).songName}</span>
                  )}
                </div>
                <p className="text-white/50 text-xs">{formatTime(currentStory.createdAt)}</p>
              </div>
              {currentStory.uid === user?.uid && (
                <>
                  <div className="flex items-center gap-1 text-white/60 mr-1"><Eye className="w-4 h-4" /><span className="text-xs">{currentStory.viewedBy?.length || 0}</span></div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteStatus(currentStory.id); goNext(); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><Trash2 className="w-5 h-5" /></button>
                </>
              )}
              <button onClick={(e) => { e.stopPropagation(); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } closeStories(); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><X className="w-5 h-5" /></button>
            </div>

            {/* Song badge */}
            {(currentStory as any).songName && (
              <div className="flex items-center gap-2 px-4 z-20">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                  <Music className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="text-white/80 text-xs font-medium">{(currentStory as any).songName}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div
              className={`flex-1 flex items-center justify-center relative ${currentStory.imageUrl ? "bg-black" : currentStory.backgroundColor}`}
              onClick={handleStoryTap}
              onMouseDown={() => setPaused(true)}
              onMouseUp={() => setPaused(false)}
              onTouchStart={() => setPaused(true)}
              onTouchEnd={() => setPaused(false)}
            >
              {currentStory.imageUrl ? (
                <div className="flex flex-col items-center w-full h-full justify-center relative">
                  <img src={currentStory.imageUrl} alt="" className="w-full h-full object-contain" draggable={false} style={{ maxHeight: 'calc(100vh - 100px)' }} />
                  {currentStory.text && (
                    <p
                      className={`absolute bottom-8 left-0 right-0 text-lg font-medium text-center px-6 drop-shadow-lg bg-black/30 py-3 ${getFontClass(currentStory.fontStyle)}`}
                      style={{ color: currentStory.textColor || "#ffffff", fontFamily: currentStory.fontStyle === "cursive" ? "'Dancing Script', cursive" : undefined }}
                    >
                      {currentStory.text}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-8 w-full flex items-center justify-center">
                  <p
                    className={`text-2xl font-bold text-center max-w-md leading-relaxed drop-shadow-lg ${getFontClass(currentStory.fontStyle)}`}
                    style={{ color: currentStory.textColor || "#ffffff", fontFamily: currentStory.fontStyle === "cursive" ? "'Dancing Script', cursive" : undefined }}
                  >
                    {currentStory.text}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function getFontClass(fontStyle?: string): string {
  switch (fontStyle) {
    case "bold": return "font-sans font-bold";
    case "italic": return "font-sans italic";
    case "serif": return "font-serif";
    case "mono": return "font-mono";
    case "cursive": return "";
    default: return "font-sans";
  }
}

export default StatusPage;
