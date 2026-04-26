import { useState, useCallback, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import { AuthContext } from "../App";
import { useFeatureGate } from "../hooks/useFeatureGate";
import LockedFeatureOverlay from "../components/LockedFeatureOverlay";
import CompetitionsLobby from "../components/competitions/CompetitionsLobby";
import WaitingRoom from "../components/competitions/WaitingRoom";
import VocabJamGame, { VocabJamResults } from "../components/competitions/VocabJamGame";
import KnowledgeBlitzGame from "../components/competitions/KnowledgeBlitzGame";
import AccuracyDuelGame from "../components/competitions/AccuracyDuelGame";
import { useGameXP } from "../components/competitions/useGameXP";
import { generateGameContent } from "../components/competitions/gameAI";
import apiService from "../services/apiService";
import * as jamBus from "../components/competitions/jamBus";
import { awardActivityXP } from "../services/xpService";

const BOT_NAMES = ["Alex M.", "Jordan K.", "Sam R.", "Casey L.", "Riley T."];
const QUESTION_COUNTS = { vocabJam: 5, knowledgeBlitz: 10, accuracyDuel: 7 };
const MAX_HP = 10;

function makeBots(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${i}`,
    name: BOT_NAMES[i % BOT_NAMES.length],
    avatar: BOT_NAMES[i % BOT_NAMES.length].split(" ").map((w) => w[0]).join(""),
    isBot: true,
    score: 0,
  }));
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Competitions() {
  const { user, setUser } = useContext(AuthContext);
  const [showLevelUp, setShowLevelUp] = useState(null);

  const {
    playerStats,
    setPlayerStats,
    addXP,
    addCoins,
    setStreak,
    incrementStreak,
  } = useGameXP(
    {
      xp: user?.xp ?? 1250,
      level: user?.level ?? 3,
      coins: user?.coins ?? 350,
      streak: user?.streak ?? 12,
    },
    (newLevel) => setShowLevelUp(newLevel)
  );

  const [gameState, setGameState] = useState({
    mode: null,
    phase: "lobby",
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    myHP: MAX_HP,
    opponentHP: MAX_HP,
    players: [],
    roomCode: null,
    topic: null,
    difficulty: "Medium",
    loadingError: null,
    jamId: null,
  });
  const jamIdRef = useRef(null);

  const goToLobby = useCallback(() => {
    jamIdRef.current = null;
    setGameState({
      mode: null,
      phase: "lobby",
      questions: [],
      currentIndex: 0,
      score: 0,
      streak: 0,
      myHP: MAX_HP,
      opponentHP: MAX_HP,
      players: [],
      roomCode: null,
      topic: null,
      difficulty: "Medium",
      loadingError: null,
      jamId: null,
    });
  }, []);

  const handlePlaySolo = useCallback(
    async (mode, opts) => {
      const topic = opts?.topic ?? "ai_picks";
      const difficulty = opts?.difficulty === "quick" ? "Easy" : opts?.difficulty === "endurance" ? "Hard" : "Medium";
      const count = QUESTION_COUNTS[mode] ?? 5;
      setGameState((prev) => ({
        ...prev,
        mode,
        phase: "loading",
        topic,
        difficulty,
        questions: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        myHP: MAX_HP,
        opponentHP: MAX_HP,
        loadingError: null,
      }));
      try {
        const questions = await generateGameContent(mode, topic, count, difficulty);
        setGameState((prev) => ({
          ...prev,
          phase: "playing",
          questions,
          currentIndex: 0,
          score: 0,
          streak: 0,
        }));
      } catch (err) {
        toast.error(err.message || "Failed to load questions");
        setGameState((prev) => ({ ...prev, phase: "lobby", loadingError: err.message }));
      }
    },
    []
  );

  const handleCreateRoom = useCallback((opts) => {
    const code = generateRoomCode();
    const botCount = Math.min(3, Math.max(1, (opts?.maxPlayers ?? 8) - 1));
    const bots = makeBots(botCount);
    const players = [
      { id: "me", name: user?.name || "You", avatar: "U", isHost: true, score: 0 },
      ...bots,
    ];
    setGameState((prev) => ({
      ...prev,
      mode: opts?.mode ?? "knowledgeBlitz",
      phase: "waiting",
      roomCode: code,
      players,
      topic: opts?.topic ?? "ai_picks",
      difficulty: opts?.difficulty ?? "standard",
      questions: [],
      currentIndex: 0,
      score: 0,
    }));
  }, [user?.name]);

  const handleJoinRoom = useCallback((code) => {
    const bots = makeBots(2 + Math.floor(Math.random() * 2));
    const players = [
      ...bots,
      { id: "me", name: user?.name || "You", avatar: "U", isHost: false, score: 0 },
    ];
    setGameState((prev) => ({
      ...prev,
      phase: "waiting",
      roomCode: code.slice(0, 6).toUpperCase(),
      players,
    }));
  }, [user?.name]);

  const handleJoinPublicMatch = useCallback(() => {
    const bots = makeBots(3 + Math.floor(Math.random() * 3));
    const players = [
      { id: "me", name: user?.name || "You", avatar: "U", isHost: false, score: 0 },
      ...bots,
    ];
    setGameState((prev) => ({
      ...prev,
      mode: "knowledgeBlitz",
      phase: "waiting",
      roomCode: generateRoomCode(),
      players,
      topic: "ai_picks",
      difficulty: "standard",
    }));
  }, [user?.name]);

  const handleJoinJam = useCallback(async (code) => {
    const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    setGameState((prev) => ({ ...prev, phase: "loading" }));
    try {
      const res = await axios.get(`${API_BASE}/api/jams/${code.toUpperCase()}`);
      const { jamId, wordSet } = res.data;
      if (!jamId || !wordSet) throw new Error('Jam not found');
      // Populate room with current user + simulated classmates
      const botNames = ['Maya L.', 'Diego R.', 'Priya N.', 'Ethan W.'];
      jamBus.joinPlayer(jamId, { id: 'me', name: user?.name || 'You', isBot: false });
      botNames.slice(0, 3).forEach((name, i) => jamBus.joinPlayer(jamId, { id: `bot-${i}`, name, isBot: true }));
      jamBus.startBots(jamId, wordSet.words.length);
      jamIdRef.current = jamId;
      setGameState((prev) => ({
        ...prev,
        phase: "playing",
        mode: "vocabJam",
        jamId,
        questions: wordSet.words,
        currentIndex: 0,
        score: 0,
        streak: 0,
      }));
    } catch (err) {
      const notFound = err?.response?.status === 404 || err?.message?.toLowerCase().includes('not found');
      toast.error(notFound ? 'Jam not found — check the code and try again.' : 'Failed to join jam');
      setGameState((prev) => ({ ...prev, phase: "lobby" }));
    }
  }, [user?.name]);

  const handleJoinCompetition = useCallback(
    async (competition) => {
      const typeToMode = {
        speed: "knowledgeBlitz",
        accuracy: "accuracyDuel",
        vocab: "vocabJam",
      };
      const mode = typeToMode[competition.competition_type] || "knowledgeBlitz";
      const diffMap = { easy: "Easy", medium: "Medium", hard: "Hard" };
      const difficulty = diffMap[competition.difficulty] || "Medium";
      const count = QUESTION_COUNTS[mode] ?? 5;
      setGameState((prev) => ({
        ...prev,
        mode,
        phase: "loading",
        topic: "ai_picks",
        difficulty,
        questions: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        myHP: MAX_HP,
        opponentHP: MAX_HP,
        loadingError: null,
      }));
      try {
        await apiService.competitions.joinCompetition(competition.competition_id);
        const questions = await generateGameContent(mode, "ai_picks", count, difficulty);
        const needsOpponent = mode === "accuracyDuel";
        const players = needsOpponent
          ? [{ id: "me", name: user?.name || "You", avatar: "U", isBot: false, score: 0 }, ...makeBots(1)]
          : [{ id: "me", name: user?.name || "You", avatar: "U", isBot: false, score: 0 }];
        setGameState((prev) => ({
          ...prev,
          phase: "playing",
          questions,
          currentIndex: 0,
          score: 0,
          streak: 0,
          players,
        }));
      } catch (err) {
        toast.error(err?.message || "Failed to join competition");
        setGameState((prev) => ({ ...prev, phase: "lobby", loadingError: err?.message }));
      }
    },
    [user?.name]
  );

  const handleStartGame = useCallback(async () => {
    const { mode, topic, players } = gameState;
    const count = mode === "accuracyDuel" ? QUESTION_COUNTS.accuracyDuel : QUESTION_COUNTS.knowledgeBlitz;
    const difficulty = gameState.difficulty === "quick" ? "Easy" : gameState.difficulty === "endurance" ? "Hard" : "Medium";
    setGameState((prev) => ({ ...prev, phase: "loading" }));
    try {
      const questions = await generateGameContent(mode, topic, count, difficulty);
      setGameState((prev) => ({
        ...prev,
        phase: "playing",
        questions,
        currentIndex: 0,
        score: 0,
        players: prev.players?.map((p) => ({ ...p, score: 0 })) ?? [],
      }));
    } catch (err) {
      toast.error(err.message || "Failed to load questions");
      setGameState((prev) => ({ ...prev, phase: "waiting" }));
    }
  }, [gameState.mode, gameState.topic, gameState.difficulty, gameState.players]);

  const updatePlayerScore = useCallback((playerId, points) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players?.map((p) => (p.id === playerId ? { ...p, score: (p.score || 0) + points } : p)) ?? [],
    }));
  }, []);

  const handleVocabAnswer = useCallback((payload) => {
    if (payload?.advance) {
      setGameState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      return;
    }
    setGameState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      streak: payload?.newStreak ?? 0,
    }));
  }, []);

  const handleVocabComplete = useCallback(async (payload) => {
    const jamId = jamIdRef.current;
    if (jamId) {
      jamBus.stopBots(jamId);
      try {
        const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const players = jamBus.getPlayers(jamId);
        await axios.post(`${API_BASE}/api/jams/${jamId}/results`, {
          results: players.map(p => ({ playerId: p.id, name: p.id === 'me' ? (user?.name || 'You') : p.name, score: p.score })),
        });
        // Award coins to all participants; extra to winner
        await axios.post(`${API_BASE}/api/coins/award`, { amount: 10, reason: 'Vocab Jam participant' });
        const winner = players[0]; // already sorted desc
        if (winner?.id === 'me') {
          await axios.post(`${API_BASE}/api/coins/award`, { amount: 15, reason: 'Vocab Jam winner bonus' });
          toast.success('You won the Vocab Jam! +25 coins');
        } else {
          toast.success('Jam complete! +10 coins');
        }
      } catch (_) {}
    }
    if (user?.id) {
      const reward = await awardActivityXP(user.id, 'vocab', null).catch(() => null);
      if (reward?.awarded) {
        setUser((prev) => prev ? ({
          ...prev,
          xp: (prev.xp ?? 0) + reward.xpGained,
          coins: (prev.coins ?? 0) + reward.coinsGained,
        }) : prev);
      }
    }
    setGameState((prev) => ({ ...prev, phase: "results", score: payload?.score ?? prev.score }));
  }, [setUser, user?.id, user?.name]);

  const handleBlitzAnswer = useCallback(() => {
    setGameState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
  }, []);

  const handleBlitzComplete = useCallback(() => {
    setGameState((prev) => ({ ...prev, phase: "results" }));
  }, []);

  const handleDuelRoundResult = useCallback((payload) => {
    if (payload?.advance) {
      setGameState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      return;
    }
    setGameState((prev) => ({
      ...prev,
      myHP: payload?.myNewHP ?? prev.myHP,
      opponentHP: payload?.opponentNewHP ?? prev.opponentHP,
    }));
  }, []);

  const handleDuelComplete = useCallback((opts) => {
    if (opts?.rematch) {
      const topic = gameState.topic || "ai_picks";
      const count = QUESTION_COUNTS.accuracyDuel;
      setGameState((prev) => ({
        ...prev,
        questions: [],
        currentIndex: 0,
        myHP: MAX_HP,
        opponentHP: MAX_HP,
        phase: "loading",
      }));
      generateGameContent("accuracyDuel", topic, count, "Medium")
        .then((questions) => {
          setGameState((prev) => ({ ...prev, questions, phase: "playing" }));
        })
        .catch(() => goToLobby());
    } else {
      goToLobby();
    }
  }, [goToLobby, gameState.topic]);

  const phase = gameState.phase;
  const mode = gameState.mode;
  const gate = useFeatureGate('competitions');

  return (
    <>
    <div className="relative flex flex-1 flex-col overflow-auto bg-background" data-testid="competitions-page">
      {!gate.loading && !gate.unlocked && (
        <LockedFeatureOverlay
          featureName="Guild Competitions"
          threshold={gate.threshold}
          currentUsers={gate.currentUsers}
        />
      )}
        {phase === "lobby" && (
          <CompetitionsLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onJoinPublicMatch={handleJoinPublicMatch}
            onPlaySolo={handlePlaySolo}
            onJoinCompetition={handleJoinCompetition}
            onJoinJam={handleJoinJam}
            userDisplayName={user?.name || "You"}
          />
        )}

        {phase === "waiting" && (
          <WaitingRoom
            roomCode={gameState.roomCode}
            players={gameState.players}
            isHost={gameState.players?.some((p) => p.id === "me" && p.isHost)}
            onStart={handleStartGame}
            onCopyLink={() => {}}
          />
        )}

        {phase === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <p className="text-[var(--text-primary)] font-medium mb-4">AI is preparing your challenge...</p>
            <motion.div
              className="h-2 w-full max-w-xs rounded-full bg-[var(--surface-2)] overflow-hidden"
              initial={{ width: "100%" }}
            >
              <motion.div
                className="h-full bg-[#6e5ff0]"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
            </motion.div>
          </div>
        )}

        {phase === "playing" && mode === "vocabJam" && (
          <VocabJamGame
            questions={gameState.questions}
            currentIndex={gameState.currentIndex}
            score={gameState.score}
            streak={gameState.streak}
            onAnswer={handleVocabAnswer}
            onComplete={handleVocabComplete}
            addXP={addXP}
            addCoins={addCoins}
            jamId={gameState.jamId}
            myName={user?.name}
          />
        )}

        {phase === "playing" && mode === "knowledgeBlitz" && (
          <KnowledgeBlitzGame
            questions={gameState.questions}
            players={gameState.players}
            currentIndex={gameState.currentIndex}
            onAnswer={handleBlitzAnswer}
            onComplete={handleBlitzComplete}
            onBack={goToLobby}
            addXP={addXP}
            addCoins={addCoins}
            updatePlayerScore={updatePlayerScore}
          />
        )}

        {phase === "playing" && mode === "accuracyDuel" && (
          <AccuracyDuelGame
            questions={gameState.questions}
            opponent={gameState.players?.find((p) => p.isBot)}
            currentIndex={gameState.currentIndex}
            myHP={gameState.myHP}
            opponentHP={gameState.opponentHP}
            myWins={Math.max(0, MAX_HP - gameState.opponentHP)}
            opponentWins={Math.max(0, MAX_HP - gameState.myHP)}
            onRoundResult={handleDuelRoundResult}
            onDuelComplete={handleDuelComplete}
            addXP={addXP}
            addCoins={addCoins}
          />
        )}

        {phase === "results" && mode === "vocabJam" && (
          <VocabJamResults score={gameState.score} totalRounds={gameState.questions?.length} onBack={goToLobby} />
        )}

        {phase === "results" && (mode === "knowledgeBlitz" || mode === "accuracyDuel") && (
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={goToLobby}
              className="px-6 py-2 rounded-lg bg-[#6e5ff0] text-[var(--text-primary)] font-medium hover:bg-[#6e5ff0]/90"
            >
              Back to Lobby
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowLevelUp(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center px-8 py-12 rounded-2xl bg-[var(--bg-base)] border border-[#6e5ff0]/50"
            >
              <p className="text-4xl font-bold text-[#f59e0b] mb-2">LEVEL UP!</p>
              <p className="text-2xl text-[var(--text-primary)]">Level {showLevelUp}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-4">Click to continue</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
