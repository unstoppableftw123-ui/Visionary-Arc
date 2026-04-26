import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Flame,
  Gift,
  Loader2,
  Search,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { supabase } from "../services/supabaseClient";
import { awardFriendStreakBonus, getTierForXP } from "../services/xpService";
import { getReferralCode } from "../services/referralService";

const AVATAR_SIZES = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
};

function formatDay(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function getConnectionKey(userId, friendId) {
  return [userId, friendId].sort().join(":");
}

function getAvatarTone(name = "") {
  const seed = name.charCodeAt(0) || 65;
  const hue = (seed * 19) % 360;
  return `hsl(${hue} 65% 48%)`;
}

function Avatar({ name, avatar, size = "md" }) {
  return (
    <div
      className={`${AVATAR_SIZES[size]} shrink-0 overflow-hidden rounded-full border border-white/10 flex items-center justify-center text-sm font-semibold text-white`}
      style={{ background: avatar ? "transparent" : getAvatarTone(name) }}
    >
      {avatar ? (
        <img src={avatar} alt={name || "Friend"} className="h-full w-full object-cover" />
      ) : (
        (name?.charAt(0) || "?").toUpperCase()
      )}
    </div>
  );
}

function PanelSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded-full bg-white/5" />
              <div className="h-3 w-44 rounded-full bg-white/5" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-white/5" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyInviteState({ referralCode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-yellow-500/10">
        <Users className="h-7 w-7 text-yellow-400" />
      </div>
      <h3 className="mt-4 font-[Clash_Display] text-2xl text-white">Build your circle</h3>
      <p className="mx-auto mt-2 max-w-md font-[Satoshi] text-sm leading-6 text-white/60">
        Add classmates by name, search with a referral code, or invite friends to start earning
        shared streak rewards together.
      </p>
      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/referral"
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2.5 font-[Satoshi] text-sm font-semibold text-black shadow-[0_0_20px_rgba(234,179,8,0.35)] transition-colors hover:bg-yellow-400"
        >
          <Gift className="h-4 w-4" />
          Invite Friends
        </Link>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 font-[Satoshi] text-sm text-white/70">
          Referral code: <span className="font-semibold text-white">{referralCode}</span>
        </div>
      </div>
    </motion.div>
  );
}

function FriendsTab({ acceptedFriends, loading, referralCode }) {
  if (loading) {
    return <PanelSkeleton rows={3} />;
  }

  if (acceptedFriends.length === 0) {
    return <EmptyInviteState referralCode={referralCode} />;
  }

  return (
    <div className="space-y-3">
      {acceptedFriends.map((friendship, index) => {
        const friend = friendship.friend;
        const tier = getTierForXP(friend?.xp ?? 0);

        return (
          <motion.div
            key={friendship.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={friend?.name} avatar={friend?.avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-[Clash_Display] text-lg text-white">
                    {friend?.name || "Friend"}
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-[Satoshi] text-[11px] uppercase tracking-[0.18em] text-white/45">
                    {tier}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 font-[Satoshi] text-sm text-white/60">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    {(friend?.xp ?? 0).toLocaleString()} XP
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-400" />
                    {friendship.friend_streak ?? 0} day friend streak
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-right">
                <p className="font-[Satoshi] text-[11px] uppercase tracking-[0.18em] text-orange-300/70">
                  Last Shared Day
                </p>
                <p className="mt-1 font-[Clash_Display] text-base text-orange-200">
                  {friendship.last_both_active || "Not yet"}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LeaderboardTab({ rows, loading, userId }) {
  if (loading) {
    return <PanelSkeleton rows={4} />;
  }

  if (rows.length === 0) {
    return (
      <p className="py-12 text-center font-[Satoshi] text-sm text-white/55">
        Add friends to unlock your leaderboard.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const isSelf = row.id === userId;
        const rankLabel = index === 0 ? "1" : index === 1 ? "2" : index === 2 ? "3" : `${index + 1}`;

        return (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className={`rounded-xl border p-4 ${
              isSelf
                ? "border-yellow-500/30 bg-yellow-500/10"
                : "border-white/10 bg-white/5 backdrop-blur-md"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 font-[Clash_Display] text-lg text-white">
                {rankLabel}
              </div>
              <Avatar name={row.name} avatar={row.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-[Clash_Display] text-lg text-white">
                  {row.name || "You"}
                  {isSelf ? " (You)" : ""}
                </p>
                <p className="font-[Satoshi] text-sm text-white/55">
                  {getTierForXP(row.xp ?? 0)} tier
                </p>
              </div>
              <div className="text-right">
                <p className="inline-flex items-center gap-1.5 font-[Clash_Display] text-lg text-white">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  {(row.xp ?? 0).toLocaleString()}
                </p>
                <p className="font-[Satoshi] text-sm text-white/55">XP</p>
              </div>
              <Trophy className={`h-5 w-5 ${index === 0 ? "text-yellow-400" : "text-white/30"}`} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function FindFriendsTab({
  loading,
  pendingRequests,
  searchResults,
  searching,
  query,
  setQuery,
  onSearch,
  onSendRequest,
  onAccept,
  onDecline,
  relationLookup,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearch();
                }
              }}
              placeholder="Search by name or referral code"
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 font-[Satoshi] text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
            />
          </div>
          <button
            type="button"
            disabled={searching || !query.trim()}
            onClick={onSearch}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-3 font-[Satoshi] text-sm font-semibold text-black shadow-[0_0_20px_rgba(234,179,8,0.35)] transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>
      </div>

      {loading ? <PanelSkeleton rows={2} /> : null}

      {!loading && pendingRequests.length > 0 ? (
        <div className="space-y-3">
          <p className="font-[Satoshi] text-xs uppercase tracking-[0.2em] text-white/40">
            Pending Requests
          </p>
          {pendingRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={request.requester?.name} avatar={request.requester?.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[Clash_Display] text-lg text-white">
                    {request.requester?.name || "New friend"}
                  </p>
                  <p className="font-[Satoshi] text-sm text-white/55">
                    {(request.requester?.xp ?? 0).toLocaleString()} XP
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onAccept(request)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 font-[Satoshi] text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecline(request.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-[Satoshi] text-sm text-white/75 transition-colors hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}

      {searchResults.length > 0 ? (
        <div className="space-y-3">
          <p className="font-[Satoshi] text-xs uppercase tracking-[0.2em] text-white/40">Results</p>
          {searchResults.map((profile, index) => {
            const relation = relationLookup.get(getConnectionKey(profile.id, profile.viewerId));

            let actionLabel = "Add Friend";
            let disabled = false;

            if (relation?.status === "accepted") {
              actionLabel = "Friends";
              disabled = true;
            } else if (relation?.direction === "sent") {
              actionLabel = "Pending";
              disabled = true;
            } else if (relation?.direction === "received") {
              actionLabel = "Accept in Requests";
              disabled = true;
            }

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={profile.name} avatar={profile.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-[Clash_Display] text-lg text-white">{profile.name}</p>
                    <p className="font-[Satoshi] text-sm text-white/55">
                      {profile.school || profile.referral_code || "Student"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSendRequest(profile.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-[Satoshi] text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <UserPlus className="h-4 w-4" />
                    {actionLabel}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {!loading && !searching && query.trim() && searchResults.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="font-[Clash_Display] text-xl text-white">No matches yet</p>
          <p className="mt-2 font-[Satoshi] text-sm text-white/55">
            Try a full name, nickname, or referral code.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function FriendsPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [relationLookup, setRelationLookup] = useState(new Map());
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState(null);

  const leaderboardRows = useMemo(() => {
    const friends = acceptedFriends.map((friendship) => friendship.friend).filter(Boolean);
    const rows = [...friends];

    if (profile?.id) {
      rows.push({
        id: profile.id,
        name: profile.name || user?.name || "You",
        avatar: profile.avatar || user?.avatar,
        xp: profile.xp ?? user?.xp ?? 0,
      });
    }

    return rows
      .filter((row, index, array) => array.findIndex((item) => item.id === row.id) === index)
      .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
  }, [acceptedFriends, profile, user?.avatar, user?.name, user?.xp]);

  const refreshFriendsData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    const [profileResult, acceptedResult, pendingResult, relationResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, avatar, xp, referral_code, last_activity_date")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("friends")
        .select(
          "id, user_id, friend_id, status, friend_streak, last_both_active, friend:profiles!friends_friend_id_fkey(id, name, avatar, xp, referral_code, last_activity_date)"
        )
        .eq("user_id", user.id)
        .eq("status", "accepted"),
      supabase
        .from("friends")
        .select("id, user_id, friend_id, requester:profiles!friends_user_id_fkey(id, name, avatar, xp)")
        .eq("friend_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("friends")
        .select("id, user_id, friend_id, status")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
    ]);

    if (profileResult.error) {
      toast.error("Could not load your friends profile.");
    } else {
      setProfile(profileResult.data || null);
    }

    if (acceptedResult.error) {
      setAcceptedFriends([]);
    } else {
      setAcceptedFriends(acceptedResult.data ?? []);
    }

    if (pendingResult.error) {
      setPendingRequests([]);
    } else {
      setPendingRequests(pendingResult.data ?? []);
    }

    if (relationResult.error) {
      setRelationLookup(new Map());
    } else {
      const lookup = new Map();
      for (const relation of relationResult.data ?? []) {
        const key = getConnectionKey(relation.user_id, relation.friend_id);
        const direction = relation.user_id === user.id ? "sent" : "received";
        lookup.set(key, { id: relation.id, status: relation.status, direction });
      }
      setRelationLookup(lookup);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refreshFriendsData();
  }, [refreshFriendsData]);

  useEffect(() => {
    let cancelled = false;

    async function processFriendStreaks() {
      if (!user?.id || !profile?.last_activity_date) return;
      if (profile.last_activity_date !== formatDay()) return;
      if (acceptedFriends.length === 0) return;

      const eligible = acceptedFriends.filter((friendship) => {
        return (
          friendship.friend?.last_activity_date === formatDay() &&
          friendship.last_both_active !== formatDay()
        );
      });

      if (eligible.length === 0) return;

      for (const friendship of eligible) {
        const nextStreak = (friendship.friend_streak ?? 0) + 1;

        const [updateCurrent, updateMirror] = await Promise.all([
          supabase
            .from("friends")
            .update({
              friend_streak: nextStreak,
              last_both_active: formatDay(),
            })
            .eq("id", friendship.id),
          supabase
            .from("friends")
            .update({
              friend_streak: nextStreak,
              last_both_active: formatDay(),
            })
            .eq("user_id", friendship.friend_id)
            .eq("friend_id", user.id)
            .eq("status", "accepted"),
        ]);

        if (updateCurrent.error || updateMirror.error) {
          continue;
        }

        await Promise.all([
          awardFriendStreakBonus(user.id),
          awardFriendStreakBonus(friendship.friend_id),
        ]);

        if (!cancelled) {
          toast.success(`Friend streak with ${friendship.friend?.name || "your friend"} is now ${nextStreak} day${nextStreak === 1 ? "" : "s"}!`);
        }
      }

      if (!cancelled) {
        refreshFriendsData();
      }
    }

    processFriendStreaks();
    return () => {
      cancelled = true;
    };
  }, [acceptedFriends, profile?.last_activity_date, refreshFriendsData, user?.id]);

  const handleSearch = useCallback(async () => {
    if (!user?.id || !query.trim()) return;

    setSearching(true);
    const value = query.trim();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, avatar, xp, school, referral_code")
      .or(`name.ilike.%${value}%,referral_code.ilike.%${value}%`)
      .neq("id", user.id)
      .limit(20);

    if (error) {
      toast.error("Could not search for friends right now.");
      setSearchResults([]);
    } else {
      setSearchResults((data ?? []).map((row) => ({ ...row, viewerId: user.id })));
    }

    setSearching(false);
  }, [query, user?.id]);

  const handleSendRequest = useCallback(
    async (friendId) => {
      if (!user?.id) return;

      const { data: existingRelation } = await supabase
        .from("friends")
        .select("id, status")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .limit(1);

      if ((existingRelation ?? []).length > 0) {
        toast("You already have a connection state with this student.");
        return;
      }

      const { error } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: friendId,
        initiated_by: user.id,
        status: "pending",
      });

      if (error) {
        toast.error("Could not send friend request.");
        return;
      }

      toast.success("Friend request sent.");
      refreshFriendsData();
    },
    [refreshFriendsData, user?.id]
  );

  const handleAccept = useCallback(
    async (request) => {
      if (!user?.id) return;

      const { error: updateError } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", request.id);

      if (updateError) {
        toast.error("Could not accept friend request.");
        return;
      }

      const { error: mirrorError } = await supabase.from("friends").upsert(
        {
          user_id: user.id,
          friend_id: request.user_id,
          initiated_by: request.user_id,
          status: "accepted",
          friend_streak: 0,
          last_both_active: null,
        },
        { onConflict: "user_id,friend_id" }
      );

      if (mirrorError) {
        toast.error("Friend request accepted, but mirror row could not be created.");
        return;
      }

      toast.success(`You and ${request.requester?.name || "your friend"} are now connected.`);
      refreshFriendsData();
    },
    [refreshFriendsData, user?.id]
  );

  const handleDecline = useCallback(
    async (requestId) => {
      const { error } = await supabase.from("friends").delete().eq("id", requestId);
      if (error) {
        toast.error("Could not decline request.");
        return;
      }
      toast("Request declined.");
      refreshFriendsData();
    },
    [refreshFriendsData]
  );

  if (!user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="h-6 w-6 animate-spin text-white/45" />
      </div>
    );
  }

  const referralCode = profile?.referral_code || getReferralCode(profile || user.id);

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-[Satoshi] text-sm uppercase tracking-[0.24em] text-white/45">
                Community Squad
              </p>
              <h1 className="mt-2 font-[Clash_Display] text-3xl text-white sm:text-4xl">Friends</h1>
              <p className="mt-2 max-w-2xl font-[Satoshi] text-sm leading-6 text-white/60">
                Keep your streaks alive together, earn shared rewards, and compete on a private
                leaderboard with the people you invite in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">
                  Friends
                </p>
                <p className="font-[Clash_Display] text-2xl text-white">{acceptedFriends.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="font-[Satoshi] text-xs uppercase tracking-[0.18em] text-white/40">
                  Pending
                </p>
                <p className="font-[Clash_Display] text-2xl text-white">{pendingRequests.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
            <TabsTrigger value="friends" className="font-[Satoshi]">Friends</TabsTrigger>
            <TabsTrigger value="find" className="font-[Satoshi]">Find Friends</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-[Satoshi]">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <FriendsTab
              acceptedFriends={acceptedFriends}
              loading={loading}
              referralCode={referralCode}
            />
          </TabsContent>

          <TabsContent value="find">
            <FindFriendsTab
              loading={loading}
              pendingRequests={pendingRequests}
              searchResults={searchResults}
              searching={searching}
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              onSendRequest={handleSendRequest}
              onAccept={handleAccept}
              onDecline={handleDecline}
              relationLookup={relationLookup}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab rows={leaderboardRows} loading={loading} userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
