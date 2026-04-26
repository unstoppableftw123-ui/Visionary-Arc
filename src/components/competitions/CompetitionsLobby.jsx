import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiService from "../../services/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { PlayerAvatar } from "./shared";
import { cn } from "../../lib/utils";
import PageHeader from "../PageHeader";
import {
  Waves,
  Zap,
  Swords,
  Users,
  Trophy,
  Copy,
  ChevronRight,
  Calendar,
  Loader2,
} from "lucide-react";

const DIFFICULTIES = [
  { value: "quick", label: "Quick 5min" },
  { value: "standard", label: "Standard 10min" },
  { value: "endurance", label: "Endurance 20min" },
];
const TOPIC_OPTIONS = [
  { value: "ai_picks", label: "AI Picks" },
  { value: "my_material", label: "My Material" },
  { value: "custom", label: "Custom Topic" },
];

const GAME_MODES = [
  {
    id: "vocabJam",
    name: "Vocab Jam",
    description: "Match terms to definitions. Speed + accuracy = XP multiplier.",
    icon: <Waves className="w-6 h-6" />,
  },
  {
    id: "knowledgeBlitz",
    name: "Knowledge Blitz",
    description: "Multiple choice race. Faster correct answer = more points.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "accuracyDuel",
    name: "Accuracy Duel",
    description: "1v1 battle. First correct answer wins the round.",
    icon: <Swords className="w-6 h-6" />,
  },
];

function formatCompetitionTime(startTime, endTime) {
  if (!startTime || !endTime) return "";
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (start <= now && end >= now) return "Live now";
  if (start > now) {
    const mins = Math.round((start - now) / 60000);
    if (mins < 60) return `Starts in ${mins} min`;
    const hours = Math.round((start - now) / 3600000);
    if (hours < 24) return `Starts in ${hours}h`;
    return `Starts ${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return "Ended";
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Alex M.", level: 5, xp: 5200, winRate: "78%" },
  { rank: 2, name: "Jordan K.", level: 4, xp: 4100, winRate: "72%" },
  { rank: 3, name: "Sam R.", level: 4, xp: 3800, winRate: "68%" },
  { rank: 4, name: "You", level: 3, xp: 1250, winRate: "65%", isCurrentUser: true },
  { rank: 5, name: "Casey L.", level: 3, xp: 1100, winRate: "62%" },
  { rank: 6, name: "Riley T.", level: 3, xp: 980, winRate: "58%" },
  { rank: 7, name: "Morgan P.", level: 2, xp: 720, winRate: "55%" },
  { rank: 8, name: "Quinn W.", level: 2, xp: 600, winRate: "52%" },
  { rank: 9, name: "Drew H.", level: 2, xp: 480, winRate: "48%" },
  { rank: 10, name: "Blake F.", level: 1, xp: 320, winRate: "45%" },
];

function GameModeCard({ mode, onPlay, onCreateRoom }) {
  const [difficulty, setDifficulty] = useState("standard");
  const [topicType, setTopicType] = useState("ai_picks");
  const [customTopic, setCustomTopic] = useState("");
  const topic = topicType === "custom" ? customTopic : topicType;

  const handlePlay = () => {
    if (topicType === "custom" && !customTopic.trim()) return;
    onPlay(mode.id, {
      difficulty,
      topic: topicType === "custom" ? customTopic.trim() : topic,
    });
  };

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-base)] overflow-hidden hover:border-[#6e5ff0]/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#6e5ff0]/20 flex items-center justify-center text-[#6e5ff0]">
            {mode.icon}
          </div>
          <div>
            <CardTitle className="text-[var(--text-primary)] text-lg">{mode.name}</CardTitle>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{mode.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-2">
          <Label className="text-sm md:text-xs text-[var(--text-secondary)]">Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-[var(--surface-2)] border-[var(--border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label className="text-sm md:text-xs text-[var(--text-secondary)]">Topic</Label>
          <Select value={topicType} onValueChange={setTopicType}>
            <SelectTrigger className="bg-[var(--surface-2)] border-[var(--border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPIC_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.value === "ai_picks" && "🎲 "}
                  {t.value === "my_material" && "📚 "}
                  {t.value === "custom" && "✏️ "}
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {topicType === "custom" && (
            <Input
              placeholder="e.g. World War II"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="bg-[var(--surface-2)] border-[var(--border)] mt-1"
            />
          )}
        </div>
        <Button
          onClick={handlePlay}
          className="w-full bg-[#6e5ff0] hover:bg-[#6e5ff0]/90 hover:shadow-[0_0_20px_rgba(110,95,240,0.4)]"
        >
          Play Now <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CompetitionsLobby({
  onCreateRoom,
  onJoinRoom,
  onJoinPublicMatch,
  onPlaySolo,
  onJoinCompetition,
  onJoinJam,
  userDisplayName,
}) {
  const [joinCode, setJoinCode] = useState("");
  const [jamCode, setJamCode] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState("knowledgeBlitz");
  const [createTopic, setCreateTopic] = useState("ai_picks");
  const [createDifficulty, setCreateDifficulty] = useState("standard");
  const [createMaxPlayers, setCreateMaxPlayers] = useState("8");
  const [upcomingCompetitions, setUpcomingCompetitions] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiService.competitions
      .getCompetitions()
      .then((list) => {
        if (!cancelled) setUpcomingCompetitions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setUpcomingCompetitions([]);
      })
      .finally(() => {
        if (!cancelled) setUpcomingLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCreateRoom = () => {
    onCreateRoom({
      mode: createMode,
      topic: createTopic,
      difficulty: createDifficulty,
      maxPlayers: parseInt(createMaxPlayers, 10),
    });
    setCreateModalOpen(false);
  };

  const handleJoin = () => {
    if (joinCode.trim().length >= 4) onJoinRoom(joinCode.trim().toUpperCase());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-6">
      <PageHeader
        title="Competitions"
        subtitle="Challenge yourself. Climb the ranks. Earn XP."
      />

      <Tabs defaultValue="solo" className="w-full">
        <TabsList className="bg-[var(--surface-2)] border border-[var(--border)] mb-6 grid grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="solo" className="data-[state=active]:bg-[#6e5ff0]">
            Solo
          </TabsTrigger>
          <TabsTrigger value="multiplayer" className="data-[state=active]:bg-[#6e5ff0]">
            Multiplayer
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#6e5ff0]">
            <Calendar className="w-4 h-4 mr-1.5" />
            Upcoming
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solo" className="mt-0 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_MODES.map((mode) => (
              <GameModeCard key={mode.id} mode={mode} onPlay={onPlaySolo} />
            ))}
          </div>
          <Card className="border-border bg-card border-dashed">
            <CardContent className="py-8 px-6 text-center">
              <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium text-foreground">Multiplayer & Leaderboards</p>
              <p className="text-sm text-muted-foreground mt-1">Coming Soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0 space-y-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Join a scheduled competition to play that game mode with AI-generated questions.
          </p>
          {upcomingLoading ? (
            <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              Loading competitions…
            </div>
          ) : upcomingCompetitions.length === 0 ? (
            <Card className="border-[var(--border)] bg-[var(--bg-base)]">
              <CardContent className="py-8 px-6 text-center text-[var(--text-secondary)]">
                No upcoming competitions right now. Check back later or play Solo / Multiplayer.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingCompetitions.map((comp) => (
                <Card
                  key={comp.competition_id}
                  className="border-[var(--border)] bg-[var(--bg-base)] overflow-hidden hover:border-[#6e5ff0]/40 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-[var(--text-primary)] text-base">{comp.title}</CardTitle>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{comp.description}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm md:text-xs font-medium px-2 py-1 rounded",
                          comp.start_time && new Date(comp.start_time).getTime() <= Date.now() &&
                          comp.end_time && new Date(comp.end_time).getTime() >= Date.now()
                            ? "bg-green-500/20 text-green-400"
                            : "bg-[#6e5ff0]/20 text-[#6e5ff0]"
                        )}
                      >
                        {formatCompetitionTime(comp.start_time, comp.end_time)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex flex-wrap gap-2 text-sm md:text-xs text-[var(--text-secondary)]">
                      <span>{comp.current_participants ?? 0}/{comp.max_participants ?? 0} joined</span>
                      <span className="capitalize">{comp.difficulty}</span>
                    </div>
                    {onJoinCompetition && (
                      <Button
                        size="sm"
                        className="w-full bg-[#6e5ff0] hover:bg-[#6e5ff0]/90"
                        onClick={() => onJoinCompetition(comp)}
                      >
                        Join <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="multiplayer" className="mt-0 space-y-6">
          <p className="text-sm text-[var(--text-secondary)]">
            👾 Playing with AI opponents — invite friends to play for real!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#6e5ff0] hover:bg-[#6e5ff0]/90">
                  <Users className="w-4 h-4 mr-2" /> Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[var(--bg-base)] border-[var(--border)] max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-[var(--text-primary)]">Create game room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[var(--text-secondary)] text-sm md:text-xs">Game mode</Label>
                    <Select value={createMode} onValueChange={setCreateMode}>
                      <SelectTrigger className="mt-1 bg-[var(--surface-2)] border-[var(--border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocabJam">Vocab Jam</SelectItem>
                        <SelectItem value="knowledgeBlitz">Knowledge Blitz</SelectItem>
                        <SelectItem value="accuracyDuel">Accuracy Duel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)] text-sm md:text-xs">Topic</Label>
                    <Select value={createTopic} onValueChange={setCreateTopic}>
                      <SelectTrigger className="mt-1 bg-[var(--surface-2)] border-[var(--border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai_picks">🎲 AI Picks</SelectItem>
                        <SelectItem value="custom">✏️ Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)] text-sm md:text-xs">Difficulty</Label>
                    <Select value={createDifficulty} onValueChange={setCreateDifficulty}>
                      <SelectTrigger className="mt-1 bg-[var(--surface-2)] border-[var(--border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[var(--text-secondary)] text-sm md:text-xs">Max players</Label>
                    <Select value={createMaxPlayers} onValueChange={setCreateMaxPlayers}>
                      <SelectTrigger className="mt-1 bg-[var(--surface-2)] border-[var(--border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[4, 6, 8, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateRoom} className="w-full bg-[#6e5ff0]">
                    Create & get code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Input
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.slice(0, 8))}
                className="bg-[var(--surface-2)] border-[var(--border)] flex-1"
                maxLength={8}
              />
              <Button variant="secondary" onClick={handleJoin} className="border-[var(--border)]">
                Join Room
              </Button>
            </div>

            <Button
              variant="outline"
              className="border-[var(--va-border)] text-foreground hover:bg-[var(--va-surface)]"
              onClick={onJoinPublicMatch}
            >
              Join Public Match
            </Button>
          </div>

          <Card className="border-[#6e5ff0]/30 bg-[var(--bg-base)] overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#6e5ff0]/20 flex items-center justify-center shrink-0">
                  <Waves className="w-4 h-4 text-[#6e5ff0]" />
                </div>
                <p className="font-medium text-[var(--text-primary)]">Join a Vocab Jam</p>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">Enter the code your teacher shared to join a class Vocab Jam.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="6-char code"
                  value={jamCode}
                  onChange={e => setJamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  className="bg-[var(--surface-2)] border-[var(--border)] font-mono tracking-widest uppercase flex-1"
                  maxLength={6}
                  onKeyDown={e => { if (e.key === 'Enter' && jamCode.length >= 4) onJoinJam?.(jamCode); }}
                />
                <Button
                  className="bg-[#6e5ff0] hover:bg-[#6e5ff0]/90 shrink-0"
                  onClick={() => { if (jamCode.trim().length >= 4) onJoinJam?.(jamCode.trim()); }}
                  disabled={jamCode.trim().length < 4}
                >
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-[var(--border)] text-[var(--text-primary)]">
                <Trophy className="w-4 h-4 mr-2" /> District Leaderboard
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--bg-base)] border-[var(--border)] max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-[var(--text-primary)]">District Leaderboard</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="all" className="flex-1 min-h-0 flex flex-col">
                <TabsList className="bg-[var(--surface-2)] border border-[var(--border)] w-full grid grid-cols-1 sm:grid-cols-4">
                  <TabsTrigger value="week" className="text-sm md:text-xs">This Week</TabsTrigger>
                  <TabsTrigger value="all" className="text-sm md:text-xs">All Time</TabsTrigger>
                  <TabsTrigger value="school" className="text-sm md:text-xs">My School</TabsTrigger>
                  <TabsTrigger value="district" className="text-sm md:text-xs">District</TabsTrigger>
                </TabsList>
                <TabsContent value="week" className="flex-1 overflow-auto mt-3">
                  <LeaderboardList list={MOCK_LEADERBOARD} currentName={userDisplayName} />
                </TabsContent>
                <TabsContent value="all" className="flex-1 overflow-auto mt-3">
                  <LeaderboardList list={MOCK_LEADERBOARD} currentName={userDisplayName} />
                </TabsContent>
                <TabsContent value="school" className="flex-1 overflow-auto mt-3">
                  <LeaderboardList list={MOCK_LEADERBOARD} currentName={userDisplayName} />
                </TabsContent>
                <TabsContent value="district" className="flex-1 overflow-auto mt-3">
                  <LeaderboardList list={MOCK_LEADERBOARD} currentName={userDisplayName} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardList({ list, currentName }) {
  return (
    <ul className="space-y-2">
      {list.map((row) => (
        <motion.li
          key={row.rank}
          layout
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-colors",
            row.isCurrentUser ? "bg-[#6e5ff0]/20 border border-[#6e5ff0]/40" : "bg-[var(--surface-2)]"
          )}
        >
          <span className="w-6 text-center font-bold text-[var(--text-secondary)]">
            {row.rank === 1 && "🥇"}
            {row.rank === 2 && "🥈"}
            {row.rank === 3 && "🥉"}
            {row.rank > 3 && row.rank}
          </span>
          <PlayerAvatar name={row.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">{row.name}</p>
            <p className="text-sm md:text-xs text-[var(--text-secondary)]">Lvl {row.level} · {row.xp} XP · {row.winRate} wins</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
