import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { PanelLeftClose, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { RoomProvider, useStatus, useUpdateMyPresence, getStudyRoomId, getStudyRoomInitialStorage, defaultPresence } from "../../liveblocks.config";
import { useRoomPresence } from "./useStudyRoom";
import { AuthContext } from "../../App";
import RoomTopBar from "./RoomTopBar";
import WhiteboardCanvas from "./WhiteboardCanvas";
import LibraryDrawer from "./LibraryDrawer";
import ChatPanel from "./ChatPanel";
import { buildLibraryCard } from "./LibraryCard";

const WARNING_MS = 25 * 60 * 1000;

function StudyRoomInner() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const updateMyPresence = useUpdateMyPresence();
  const { myColor } = useRoomPresence();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [chatUnread, setChatUnread] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const canvasApiRef = useRef({ addElements: null, getViewport: null });
  const status = useStatus();

  const roomMeta = location.state || {};
  const roomName = roomMeta.roomName || "Study Room";
  const tag = roomMeta.tag || "Other";

  const currentUser = user
    ? { id: user.user_id || user.id, name: user.name || user.email, avatar: user.avatar }
    : { id: "anon", name: "Guest", avatar: "" };

  useEffect(() => {
    updateMyPresence({
      userId: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar || "",
      color: myColor,
      cursor: null,
      isTyping: false,
    });
  }, [currentUser.id, currentUser.name, currentUser.avatar, myColor, updateMyPresence]);

  useEffect(() => {
    const t = setTimeout(() => setShowInactivityWarning(true), WARNING_MS);
    return () => clearTimeout(t);
  }, []);

  const addToCanvas = (fileElementsOrFile, viewport) => {
    const api = canvasApiRef.current;
    if (!api?.addElements) return;
    const v = viewport ?? api.getViewport?.() ?? { scrollX: 0, scrollY: 0, width: 800, height: 600 };
    if (Array.isArray(fileElementsOrFile)) {
      api.addElements(fileElementsOrFile);
    } else {
      const elements = buildLibraryCard(fileElementsOrFile, v);
      api.addElements(elements);
    }
  };

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Room not found.</p>
          <Button onClick={() => navigate("/community")}>Back to Community</Button>
        </div>
      </div>
    );
  }

  if (status === "disconnected" || status === "unavailable") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Could not connect. Check your connection and try again.
          </p>
          <Button onClick={() => navigate("/community")}>Back to Community</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <RoomTopBar roomName={roomName} tag={tag} />

      {showInactivityWarning && (
        <div className="bg-brand-orange/15 border-b border-brand-orange/30 px-4 py-2 text-center text-sm text-brand-tan">
          This room will close after 30 minutes of inactivity.
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <LibraryDrawer
          open={leftOpen}
          onToggle={() => setLeftOpen((o) => !o)}
          addToCanvas={addToCanvas}
        />
        <div className="flex-1 min-w-0 relative">
          <WhiteboardCanvas canvasApiRef={canvasApiRef} />
        </div>
        <div className="relative">
          <ChatPanel
            open={rightOpen}
            unreadCount={chatUnread}
            onMarkRead={() => setChatUnread(0)}
            currentUser={currentUser}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full rounded-r-none border border-r-0 border-border z-20 h-12 w-8"
            onClick={() => setRightOpen((o) => !o)}
            title={rightOpen ? "Close chat" : "Open chat"}
          >
            <MessageCircle className="w-4 h-4" />
            {!rightOpen && chatUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive" />
            )}
          </Button>
        </div>
      </div>

      <div className="absolute left-0 top-[3.5rem] z-20">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-r-none border border-r-0 border-border h-10 w-8"
          onClick={() => setLeftOpen((o) => !o)}
          title={leftOpen ? "Close library" : "Open library"}
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function StudyRoomPage() {
  const { roomId } = useParams();
  const liveblocksRoomId = roomId ? getStudyRoomId(roomId) : null;

  if (!liveblocksRoomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Invalid room.</p>
          <a href="/community" className="text-primary underline">
            Back to Community
          </a>
        </div>
      </div>
    );
  }

  return (
    <RoomProvider
      id={liveblocksRoomId}
      initialPresence={{
        ...defaultPresence,
        userId: "",
        name: "",
        avatar: "",
      }}
      initialStorage={() => getStudyRoomInitialStorage()}
    >
      <StudyRoomInner />
    </RoomProvider>
  );
}
