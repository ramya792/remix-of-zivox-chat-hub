import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  callerPic: string;
  receiverId: string;
  receiverName: string;
  receiverPic: string;
  type: "voice" | "video";
  status: "missed" | "incoming" | "outgoing";
  duration: number; // seconds
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
      where("participants", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: CallRecord[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallRecord));
      setCalls(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch { return ""; }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCallIcon = (status: string) => {
    switch (status) {
      case "missed": return <PhoneMissed className="w-4 h-4 text-destructive" />;
      case "incoming": return <PhoneIncoming className="w-4 h-4 text-primary" />;
      case "outgoing": return <PhoneOutgoing className="w-4 h-4 text-primary" />;
      default: return <Phone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Calls</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Phone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No call history yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Your call history will appear here</p>
          </div>
        ) : (
          calls.map((call) => {
            const isOutgoing = call.callerId === user?.uid;
            const otherName = isOutgoing ? call.receiverName : call.callerName;
            const otherPic = isOutgoing ? call.receiverPic : call.callerPic;

            return (
              <div
                key={call.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {otherPic ? (
                    <img src={otherPic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold text-sm">
                      {otherName?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${call.status === "missed" ? "text-destructive" : "text-foreground"}`}>
                    {otherName || "Unknown"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getCallIcon(call.status)}
                    <span className="text-xs text-muted-foreground">{formatTime(call.createdAt)}</span>
                    {call.duration > 0 && (
                      <span className="text-xs text-muted-foreground">· {formatDuration(call.duration)}</span>
                    )}
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                  {call.type === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CallsPage;
