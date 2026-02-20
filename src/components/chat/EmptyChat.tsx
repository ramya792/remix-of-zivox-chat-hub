import { MessageCircle } from "lucide-react";

const EmptyChat = () => (
  <div className="flex-1 flex items-center justify-center bg-chat-bg chat-pattern">
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-10 h-10 text-primary/60" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-1">ZIVOX</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        Select a conversation or start a new chat to begin messaging
      </p>
    </div>
  </div>
);

export default EmptyChat;
