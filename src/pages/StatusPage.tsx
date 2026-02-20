import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Eye, Clock, Image as ImageIcon, X, Radio } from "lucide-react";
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
  createdAt: any;
  viewedBy: string[];
}

const BG_COLORS = [
  "bg-primary", "bg-emerald-600", "bg-blue-600", "bg-purple-600",
  "bg-pink-600", "bg-orange-600", "bg-red-600", "bg-teal-600",
];

const StatusPage = () => {
  const { user, profile } = useAuthStore();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedBg, setSelectedBg] = useState(0);
  const [viewingStatus, setViewingStatus] = useState<Status | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    // Subscribe to statuses from last 24 hours
    const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, "statuses"),
      where("createdAt", ">=", twentyFourHoursAgo),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: Status[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Status));
      setStatuses(items);
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!statusText.trim() || !user || !profile) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "statuses"), {
        uid: user.uid,
        userName: profile.name,
        userPic: profile.profilePic || "",
        text: statusText.trim(),
        backgroundColor: BG_COLORS[selectedBg],
        createdAt: serverTimestamp(),
        viewedBy: [],
      });
      setStatusText("");
      setShowCompose(false);
    } catch (e) {
      console.error("Post status error:", e);
    }
    setPosting(false);
  };

  const myStatuses = statuses.filter((s) => s.uid === user?.uid);
  const otherStatuses = statuses.filter((s) => s.uid !== user?.uid);

  // Group by user
  const groupedStatuses = otherStatuses.reduce((acc, s) => {
    if (!acc[s.uid]) acc[s.uid] = { userName: s.userName, userPic: s.userPic, statuses: [] };
    acc[s.uid].statuses.push(s);
    return acc;
  }, {} as Record<string, { userName: string; userPic: string; statuses: Status[] }>);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch { return ""; }
  };

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
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.profilePic ? (
                  <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-semibold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">My Status</p>
              <p className="text-xs text-muted-foreground">
                {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""} · ${formatTime(myStatuses[0]?.createdAt)}` : "Tap to add status update"}
              </p>
            </div>
          </button>
        </div>

        {/* Recent Updates */}
        {Object.keys(groupedStatuses).length > 0 && (
          <div className="px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent updates</p>
            {Object.entries(groupedStatuses).map(([uid, data]) => (
              <button
                key={uid}
                onClick={() => setViewingStatus(data.statuses[0])}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {data.userPic ? (
                    <img src={data.userPic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold">
                      {data.userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{data.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.statuses.length} update{data.statuses.length > 1 ? "s" : ""} · {formatTime(data.statuses[0]?.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {otherStatuses.length === 0 && myStatuses.length === 0 && (
          <div className="text-center py-12 px-4">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No status updates yet</p>
            <button onClick={() => setShowCompose(true)} className="mt-3 text-primary text-sm font-medium hover:underline">
              Post your first status
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCompose(true)}
        className="absolute bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-10"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Compose Status */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowCompose(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Create Status</h3>
                <button onClick={() => setShowCompose(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                <div className={`${BG_COLORS[selectedBg]} rounded-xl p-6 min-h-[200px] flex items-center justify-center mb-4`}>
                  <textarea
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent text-white placeholder:text-white/60 text-center text-lg font-medium outline-none resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 mb-4">
                  {BG_COLORS.map((bg, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBg(i)}
                      className={`w-8 h-8 rounded-full ${bg} ${selectedBg === i ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handlePost}
                  disabled={!statusText.trim() || posting}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {posting ? "Posting..." : "Post Status"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Status */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            onClick={() => setViewingStatus(null)}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <button onClick={() => setViewingStatus(null)} className="text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {viewingStatus.userPic ? (
                  <img src={viewingStatus.userPic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-semibold text-xs">
                    {viewingStatus.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{viewingStatus.userName}</p>
                <p className="text-white/60 text-xs">{formatTime(viewingStatus.createdAt)}</p>
              </div>
            </div>
            <div className={`flex-1 ${viewingStatus.backgroundColor} flex items-center justify-center p-8`}>
              <p className="text-white text-xl font-medium text-center">{viewingStatus.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusPage;
