import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  callerPic: string;
  receiverId: string;
  receiverName: string;
  receiverPic: string;
  type: "voice" | "video";
  status: "outgoing" | "incoming" | "missed";
  duration: number;
  participants: string[];
  createdAt: any;
}

const CallsPage = () => {
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "calls"),
      where("participants", "array-contains", user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallRecord));
        data.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setCalls(data);
        setLoading(false);
      },
      (err) => {
        console.error("Calls sub error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "calls", id));
    } catch (e) {
      console.error("Delete call error:", e);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      if (isToday(d)) return format(d, "h:mm a");
      if (isYesterday(d)) return "Yesterday";
      return format(d, "MMM d");
    } catch {
      return "";
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === "missed") return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (call.callerId === user?.uid) return <PhoneOutgoing className="w-4 h-4 text-primary" />;
    return <PhoneIncoming className="w-4 h-4 text-primary" />;
  };

  const getCallLabel = (call: CallRecord) => {
    if (call.status === "missed") return "Missed";
    if (call.callerId === user?.uid) return "Outgoing";
    return "Incoming";
  };

  const getOtherUser = (call: CallRecord) => {
    if (call.callerId === user?.uid) {
      return { name: call.receiverName, pic: call.receiverPic };
    }
    return { name: call.callerName, pic: call.callerPic };
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Calls</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your call history</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Phone className="w-7 h-7 text-primary/40" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No calls yet</p>
            <p className="text-muted-foreground/70 text-sm">Call history will appear here when you make or receive calls from a chat.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {calls.map((call) => {
              const other = getOtherUser(call);
              return (
                <div key={call.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors group">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-primary/10">
                    {other.pic ? (
                      <img src={other.pic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-base">{other.name?.charAt(0).toUpperCase() || "?"}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${call.status === "missed" ? "text-destructive" : "text-foreground"}`}>
                      {other.name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getCallIcon(call)}
                      <span className={`text-xs ${call.status === "missed" ? "text-destructive/70" : "text-muted-foreground"}`}>
                        {getCallLabel(call)}
                      </span>
                      {call.duration > 0 && (
                        <>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <Clock className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground/60">{formatDuration(call.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time & actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{formatTime(call.createdAt)}</span>
                    <button onClick={() => handleDelete(call.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {call.type === "video" ? (
                      <Video className="w-5 h-5 text-primary" />
                    ) : (
                      <Phone className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsPage;
