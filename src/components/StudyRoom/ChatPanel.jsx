import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useStorage, useMutation, useOthers, useUpdateMyPresence } from "../../liveblocks.config";

export default function ChatPanel({ open, unreadCount, onMarkRead, currentUser }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const messages = useStorage((root) => {
    const list = root?.messages;
    if (!list) return [];
    return Array.from(list);
  }) ?? [];
  const updateMyPresence = useUpdateMyPresence();
  const addMessage = useMutation(({ storage }, text) => {
    const list = storage.get("messages");
    if (!list) return;
    const user = currentUser || {};
    list.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id || user.userId || "",
      name: user.name || "User",
      avatar: user.avatar || "",
      text,
      createdAt: Date.now(),
    });
  }, [currentUser]);
  const others = useOthers();
  const typingOthers = others.filter((o) => o.presence?.isTyping).map((o) => o.presence?.name || "Someone");

  useEffect(() => {
    if (!open) updateMyPresence({ isTyping: false });
  }, [open, updateMyPresence]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    addMessage(text);
    setInput("");
    updateMyPresence({ isTyping: false });
    onMarkRead?.();
  };

  const handleFocus = () => updateMyPresence({ isTyping: true });
  const handleBlur = () => updateMyPresence({ isTyping: false });

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 h-full border-l border-border bg-card overflow-hidden flex flex-col"
        >
          <div className="p-3 border-b border-border shrink-0">
            <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </h2>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-3">
              {(messages || []).map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback className="text-sm md:text-xs bg-primary text-primary-foreground">
                      {(msg.name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {msg.name || "User"}
                      </span>
                      <span className="text-sm md:text-xs text-muted-foreground">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground break-words mt-0.5">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {typingOthers.length > 0 && (
                <p className="text-sm md:text-xs text-muted-foreground italic">
                  {typingOthers.join(", ")} {typingOthers.length === 1 ? "is" : "are"} typing...
                </p>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <form
            onSubmit={handleSend}
            className="p-2 border-t border-border shrink-0 flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
