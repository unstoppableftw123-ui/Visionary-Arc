import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, Lock } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Switch } from "../ui/switch";
import {
  RoomProvider,
  useStorage,
  useMutation,
  useStatus,
  LOBBY_ROOM_ID,
  getLobbyInitialStorage,
} from "../../liveblocks.config";

const SUBJECT_TAGS = ["Math", "Science", "English", "SAT/ACT", "Other"];
const MAX_MEMBERS_OPTIONS = [2, 5, 10];

function generateRoomId() {
  return `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_ROOMS = [
  {
    id: "room-mock-1",
    name: "SAT Math Prep",
    tag: "SAT/ACT",
    createdBy: { id: "user-1", name: "Alex Rivera", avatar: "" },
    memberCount: 3,
    maxMembers: 5,
    isPrivate: false,
    memberIds: ["user-1", "user-2", "user-3"],
  },
  {
    id: "room-mock-2",
    name: "AP Chemistry Study",
    tag: "Science",
    createdBy: { id: "user-2", name: "Jordan Lee", avatar: "" },
    memberCount: 2,
    maxMembers: 5,
    isPrivate: false,
    memberIds: ["user-2", "user-4"],
  },
  {
    id: "room-mock-3",
    name: "Essay Workshop",
    tag: "English",
    createdBy: { id: "user-3", name: "Sam Chen", avatar: "" },
    memberCount: 5,
    maxMembers: 5,
    isPrivate: false,
    memberIds: ["user-3", "user-5", "user-6", "user-7", "user-8"],
  },
  {
    id: "room-mock-4",
    name: "Calculus BC",
    tag: "Math",
    createdBy: { id: "user-5", name: "Morgan Blake", avatar: "" },
    memberCount: 1,
    maxMembers: 2,
    isPrivate: true,
    memberIds: ["user-5"],
  },
];

function LobbyContent({ currentUser }) {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [tag, setTag] = useState("Math");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(5);
  const [mockRooms, setMockRooms] = useState(MOCK_ROOMS);

  const status = useStatus();
  const isMock = status !== "connected";

  const liveRooms = useStorage((root) => {
    const list = root?.rooms;
    if (!list) return [];
    return Array.from(list);
  }) ?? [];

  const rooms = isMock ? mockRooms : liveRooms;

  const addRoom = useMutation(({ storage }, room) => {
    const list = storage.get("rooms");
    if (!list) return;
    list.push(room);
  }, []);

  const handleCreate = () => {
    if (!roomName.trim()) return;
    const id = generateRoomId();
    const user = currentUser || {};
    const room = {
      id,
      name: roomName.trim(),
      tag,
      createdBy: {
        id: user.id || user.userId || "anon",
        name: user.name || "You",
        avatar: user.avatar || "",
      },
      memberCount: 1,
      maxMembers,
      isPrivate,
      memberIds: [user.id || user.userId || "anon"],
    };
    if (isMock) {
      setMockRooms((prev) => [room, ...prev]);
    } else {
      addRoom(room);
    }
    setRoomName("");
    setTag("Math");
    setIsPrivate(false);
    setMaxMembers(5);
    setCreateOpen(false);
    navigate(`/community/room/${id}`);
  };

  const handleJoin = (room) => {
    if (room.memberCount >= room.maxMembers) return;
    navigate(`/community/room/${room.id}`, {
      state: { roomName: room.name, tag: room.tag },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Study Rooms
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Study Room</DialogTitle>
              <DialogDescription>Set up a new collaborative study room.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="room-name">Room name</Label>
                <Input
                  id="room-name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. SAT Math Prep"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUBJECT_TAGS.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={tag === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTag(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="privacy">Invite only</Label>
                <Switch
                  id="privacy"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
              <div>
                <Label>Max members</Label>
                <div className="flex gap-2 mt-2">
                  {MAX_MEMBERS_OPTIONS.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={maxMembers === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxMembers(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create & Enter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isMock && (
        <p className="text-sm md:text-xs text-muted-foreground mb-2 italic">
          Demo mode — rooms are local only (Liveblocks not connected)
        </p>
      )}

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-2">
          {rooms.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No rooms yet. Create one to get started.
            </p>
          )}
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              layout
              className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {room.name}
                    </span>
                    <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {room.tag}
                    </span>
                    {room.isPrivate && (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={room.createdBy?.avatar} />
                      <AvatarFallback className="text-sm md:text-[10px]">
                        {(room.createdBy?.name || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm md:text-xs text-muted-foreground">
                      {room.memberCount}/{room.maxMembers}
                    </span>
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleJoin(room)}
                  disabled={room.memberCount >= room.maxMembers}
                >
                  Join
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function StudyRoomList({ currentUser }) {
  return (
    <RoomProvider
      id={LOBBY_ROOM_ID}
      initialPresence={{}}
      initialStorage={() => getLobbyInitialStorage()}
    >
      <LobbyContent currentUser={currentUser} />
    </RoomProvider>
  );
}
