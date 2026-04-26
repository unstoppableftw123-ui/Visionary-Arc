import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "../App";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  ARTIFACT_DIFFICULTIES,
  ARTIFACT_TRACKS,
  generateArtifactChallenge,
  getChallengeHistory,
  submitArtifact,
} from "../services/artifactService";

function SkeletonCard() {
  return <div className="h-32 rounded-xl bg-white/5 animate-pulse" />;
}

export default function ArtifactChallengesPage({ embedded = false }) {
  const { user, setUser } = useContext(AuthContext);
  const [track, setTrack] = useState("builder");
  const [difficulty, setDifficulty] = useState("patch");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [file, setFile] = useState(null);
  const [lastReview, setLastReview] = useState(null);

  const trackMeta = useMemo(
    () => ARTIFACT_TRACKS.find((item) => item.key === track) ?? ARTIFACT_TRACKS[0],
    [track],
  );
  const difficultyMeta = useMemo(
    () => ARTIFACT_DIFFICULTIES.find((item) => item.key === difficulty) ?? ARTIFACT_DIFFICULTIES[0],
    [difficulty],
  );

  useEffect(() => {
    return () => {
      if (activeChallenge?.downloadUrl) {
        URL.revokeObjectURL(activeChallenge.downloadUrl);
      }
    };
  }, [activeChallenge]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!user?.id) return;
      setHistoryLoading(true);
      try {
        const rows = await getChallengeHistory(user.id);
        if (active) setHistory(rows);
      } catch {
        if (active) toast.error("Could not load artifact history.");
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleGenerate = async () => {
    if (!user?.id) return;
    setLoading(true);
    setLastReview(null);

    try {
      if (activeChallenge?.downloadUrl) {
        URL.revokeObjectURL(activeChallenge.downloadUrl);
      }

      const challenge = await generateArtifactChallenge(user.id, track, difficulty);
      setActiveChallenge(challenge);
      setFile(null);
      toast.success("Broken artifact generated. Download it, patch it, then upload your fix.");
    } catch (error) {
      toast.error(error?.message ?? "Failed to generate artifact.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !activeChallenge?.challengeId || !file) return;
    setSubmitting(true);

    try {
      const result = await submitArtifact(activeChallenge.challengeId, user.id, file);
      setLastReview(result);
      setActiveChallenge(null);
      setFile(null);
      setUser?.((prev) => (
        prev
          ? {
              ...prev,
              xp: (prev.xp ?? 0) + result.xpAwarded,
            }
          : prev
      ));
      toast.success(`Artifact reviewed. +${result.xpAwarded} XP`);
      const rows = await getChallengeHistory(user.id);
      setHistory(rows);
    } catch (error) {
      toast.error(error?.message ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const wrapperClassName = embedded
    ? "space-y-6"
    : "min-h-screen bg-[var(--bg-base)] px-4 py-8 text-[var(--text-primary)]";

  const innerClassName = embedded ? "space-y-6" : "mx-auto max-w-6xl space-y-6";

  return (
    <div className={wrapperClassName}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={innerClassName}
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/45">
                Artifact Arena
              </p>
              <h2 className="font-[Clash_Display] text-3xl text-white">Fix Broken Work. Earn Real XP.</h2>
              <p className="mt-2 max-w-2xl font-[Satoshi] text-sm text-white/65">
                Generate a broken artifact, repair it in your own tools, and upload your fix for an AI review. A 3-day streak doubles the XP payout.
              </p>
            </div>

            <div
              className="rounded-xl border border-white/10 px-4 py-3"
              style={{ background: `${trackMeta.accent}12` }}
            >
              <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/45">
                Current Reward
              </p>
              <p className="mt-1 font-[Clash_Display] text-2xl text-white">
                {difficultyMeta.xp} XP
              </p>
              <p className="font-[Satoshi] text-xs text-white/55">+150 reviewer bonus if you catch extra issues</p>
            </div>
          </div>
        </div>

        <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <CardHeader>
            <CardTitle className="font-[Clash_Display] text-white">Generate Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-5">
              {ARTIFACT_TRACKS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTrack(item.key)}
                  className="rounded-xl border px-3 py-3 text-left transition-all"
                  style={{
                    borderColor: track === item.key ? item.accent : "rgba(255,255,255,0.1)",
                    background: track === item.key ? `${item.accent}22` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <p className="font-[Clash_Display] text-lg capitalize text-white">{item.key}</p>
                  <p className="mt-1 text-xs text-white/55">{item.fileTypes.map((type) => `.${type}`).join(" ")}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {ARTIFACT_DIFFICULTIES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setDifficulty(item.key)}
                  className="rounded-xl border px-4 py-4 text-left transition-all"
                  style={{
                    borderColor: difficulty === item.key ? trackMeta.accent : "rgba(255,255,255,0.1)",
                    background: difficulty === item.key ? `${trackMeta.accent}1f` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <p className="font-[Clash_Display] text-xl capitalize text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-white/60">{item.xp} XP base reward</p>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-[Satoshi] text-sm text-white/60">
                Selected track file types: {trackMeta.fileTypes.map((type) => `.${type}`).join(", ")}
              </p>
              <p className="mt-1 font-[Satoshi] text-sm text-white/45">
                Upload path: {user?.id || "user-id"}/{activeChallenge?.challengeId || "challenge-id"}.{activeChallenge?.fileType || trackMeta.fileTypes[0]}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate Broken Artifact"}
            </Button>
          </CardContent>
        </Card>

        {activeChallenge && (
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
            <CardHeader>
              <CardTitle className="font-[Clash_Display] text-white">Current Challenge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="font-[Satoshi] text-sm uppercase tracking-[0.18em] text-white/40">Context Brief</p>
                <p className="mt-2 font-[Satoshi] text-sm leading-6 text-white/70">{activeChallenge.contextBrief}</p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <a
                  href={activeChallenge.downloadUrl}
                  download={`${activeChallenge.challengeId}.${activeChallenge.fileType}`}
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 px-4 py-3 font-[Satoshi] text-sm text-white border border-white/10 hover:bg-white/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download .{activeChallenge.fileType} Artifact
                </a>

                <label className="flex-1 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-3 text-sm text-white/65">
                  Upload your fixed file
                  <input
                    type="file"
                    className="mt-2 block w-full text-sm text-white/70"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!file || submitting}
                className="bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
              >
                <Upload className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Upload Fixed Artifact"}
              </Button>
            </CardContent>
          </Card>
        )}

        {lastReview && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
              <CardHeader>
                <CardTitle className="font-[Clash_Display] text-white">Latest Review</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">Summary</p>
                  <p className="mt-2 text-sm text-white/70">{lastReview.review.summary}</p>
                  <p className="mt-3 text-sm text-yellow-300">
                    +{lastReview.xpAwarded} XP
                    {lastReview.streakMultiplier > 1 ? ` (${lastReview.streakMultiplier}x streak boost)` : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">What Changed</p>
                  <p className="mt-2 text-sm text-white/70">{lastReview.review.whatChanged}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">Still Off</p>
                  <p className="mt-2 text-sm text-white/70">{lastReview.review.whatStillOff}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">What You Missed</p>
                  <p className="mt-2 text-sm text-white/70">{lastReview.review.whatTheyMissed}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
          <CardHeader>
            <CardTitle className="font-[Clash_Display] text-white">Challenge History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : history.length === 0 ? (
              <p className="font-[Satoshi] text-sm text-white/60">No artifact attempts yet.</p>
            ) : (
              history.map((item) => {
                const itemTrack = ARTIFACT_TRACKS.find((entry) => entry.key === item.track) ?? ARTIFACT_TRACKS[0];
                const latestSubmission = item.artifact_submissions?.[0];

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                    style={{ boxShadow: `inset 3px 0 0 ${itemTrack.accent}` }}
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-[Clash_Display] text-xl capitalize text-white">
                          {item.track} · {item.difficulty}
                        </p>
                        <p className="mt-1 text-sm text-white/60">{item.context_brief}</p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-sm text-white/70">.{item.file_type}</p>
                        <p className="text-sm text-yellow-300">+{item.xp_awarded ?? 0} XP</p>
                      </div>
                    </div>

                    {latestSubmission && (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Changed</p>
                          <p className="mt-2 text-sm text-white/70">{latestSubmission.what_changed}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Still Off</p>
                          <p className="mt-2 text-sm text-white/70">{latestSubmission.what_still_off}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Missed</p>
                          <p className="mt-2 text-sm text-white/70">{latestSubmission.what_they_missed}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
