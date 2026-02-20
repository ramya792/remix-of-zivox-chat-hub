import { MessageCircle, Radio, Phone, Settings } from "lucide-react";
import { motion } from "framer-motion";

export type TabId = "chats" | "status" | "calls" | "settings";

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: "chats" as TabId, label: "Chats", icon: MessageCircle },
  { id: "status" as TabId, label: "Status", icon: Radio },
  { id: "calls" as TabId, label: "Calls", icon: Phone },
  { id: "settings" as TabId, label: "Settings", icon: Settings },
];

const BottomNav = ({ activeTab, onTabChange }: Props) => {
  return (
    <div className="flex-shrink-0 bg-card border-t border-border px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium relative z-10 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
