import { motion } from "framer-motion";

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-2">
    <div className="bg-chat-bubble-other rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/50"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  </div>
);

export default TypingIndicator;
