import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, FileText, Video, Link2, Download,
  ThumbsUp, MessageSquare, Share2, Bookmark, Plus,
  ChevronUp, Filter, TrendingUp, Clock, Star, Tag,
  ExternalLink, X, Send, MoreHorizontal,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

/* ─── Mock Data ──────────────────────────────────────────────── */
const LIBRARY_CATEGORIES = [
  { key: "all",          label: "All",          color: "#007aff" },
  { key: "lesson-plans", label: "Lesson Plans", color: "#34c759" },
  { key: "worksheets",   label: "Worksheets",   color: "#ff9500" },
  { key: "videos",       label: "Videos",       color: "#ff3b30" },
  { key: "assessments",  label: "Assessments",  color: "#af52de" },
  { key: "templates",    label: "Templates",    color: "#5ac8fa" },
];

const LIBRARY_ITEMS = [
  {
    id: 1, category: "lesson-plans", title: "Quadratic Equations — Full Unit Plan",
    description: "5-day scaffolded unit with warm-ups, direct instruction, and exit tickets.",
    subject: "Math", grade: "9–10", type: "pdf", downloads: 1240, rating: 4.9, starred: true,
    color: "#34c759",
  },
  {
    id: 2, category: "worksheets", title: "Cell Division Diagram Worksheet",
    description: "Label-and-color mitosis/meiosis worksheet with answer key included.",
    subject: "Biology", grade: "11", type: "pdf", downloads: 890, rating: 4.7, starred: false,
    color: "#ff9500",
  },
  {
    id: 3, category: "videos", title: "Crash Course: The French Revolution",
    description: "18-min video with guided notes template and discussion questions.",
    subject: "History", grade: "8–10", type: "video", downloads: 3100, rating: 4.8, starred: true,
    color: "#ff3b30",
  },
  {
    id: 4, category: "assessments", title: "Figurative Language Quick Check",
    description: "10-question formative assessment — metaphor, simile, alliteration, personification.",
    subject: "ELA", grade: "6–7", type: "pdf", downloads: 670, rating: 4.6, starred: false,
    color: "#af52de",
  },
  {
    id: 5, category: "templates", title: "Socratic Seminar Discussion Rubric",
    description: "Ready-to-use editable rubric with participation, reasoning, and evidence categories.",
    subject: "Any", grade: "All", type: "doc", downloads: 2400, rating: 4.9, starred: true,
    color: "#5ac8fa",
  },
  {
    id: 6, category: "lesson-plans", title: "Intro to Python — Hour of Code",
    description: "Beginner-friendly 60-min coding lesson with slides, activity, and reflection.",
    subject: "CS", grade: "6–12", type: "pdf", downloads: 1780, rating: 4.8, starred: false,
    color: "#34c759",
  },
  {
    id: 7, category: "worksheets", title: "World Map Regions Activity",
    description: "Blank and labeled map printouts with continent and country identification tasks.",
    subject: "Geography", grade: "5–7", type: "pdf", downloads: 1050, rating: 4.5, starred: false,
    color: "#ff9500",
  },
  {
    id: 8, category: "assessments", title: "Algebra I End-of-Unit Test (2 forms)",
    description: "Two parallel forms covering linear equations, inequalities, and graphing.",
    subject: "Math", grade: "8–9", type: "pdf", downloads: 560, rating: 4.7, starred: false,
    color: "#af52de",
  },
];

const TYPE_ICON = {
  pdf:   <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  doc:   <FileText className="w-4 h-4" />,
  link:  <Link2 className="w-4 h-4" />,
};

const FORUM_TAGS = ["All", "Tips", "Strategies", "Tools", "Curriculum", "Assessment", "Classroom Mgmt", "Differentiation"];

const FORUM_POSTS = [
  {
    id: 1,
    author: "Ms. Patel",
    avatar: "P",
    avatarColor: "#007aff",
    time: "2h ago",
    tag: "Strategies",
    title: "Exit tickets changed my class — here's my full system",
    body: "After 3 years of trial and error I finally have a system that works. I use a 3-question format: 1 recall, 1 application, 1 reflection. Takes students 4 minutes max and I can sort the stacks in under 10. Sharing my template below.",
    upvotes: 142,
    comments: [
      { author: "Mr. Torres", avatar: "T", avatarColor: "#34c759", time: "1h ago", text: "This is exactly what I needed. Do you do anything different for ELL students?" },
      { author: "Ms. Kim", avatar: "K", avatarColor: "#af52de", time: "45m ago", text: "Love the 3-question structure. I've been doing 5 questions and it's way too long." },
    ],
    upvoted: false, bookmarked: true,
  },
  {
    id: 2,
    author: "Coach Rivera",
    avatar: "R",
    avatarColor: "#ff9500",
    time: "5h ago",
    tag: "Tools",
    title: "Anyone tried using AI to differentiate assignments? My honest take.",
    body: "Been using AI tools to generate 3 versions of the same assignment (on-level, support, extension) and it saves me about 2 hours a week. The key is writing a really good base prompt. Happy to share my prompt template if people are interested.",
    upvotes: 98,
    comments: [
      { author: "Ms. Johnson", avatar: "J", avatarColor: "#ff3b30", time: "4h ago", text: "Yes please share the prompt! I've tried this but the output is always too generic." },
    ],
    upvoted: true, bookmarked: false,
  },
  {
    id: 3,
    author: "Dr. Nguyen",
    avatar: "N",
    avatarColor: "#af52de",
    time: "1d ago",
    tag: "Curriculum",
    title: "Vertical alignment meeting hack — the 'parking lot' method",
    body: "Every cross-grade meeting I run now uses a parking lot wall. Each teacher writes 3 things on sticky notes: what they're teaching, what students should already know, what gaps they're seeing. Pattern recognition happens fast and the conversation gets productive immediately.",
    upvotes: 213,
    comments: [
      { author: "Ms. Patel", avatar: "P", avatarColor: "#007aff", time: "22h ago", text: "We did this at our last PD and it was genuinely one of the most useful hours I've spent in a meeting." },
      { author: "Coach Rivera", avatar: "R", avatarColor: "#ff9500", time: "20h ago", text: "Do you keep the sticky notes somewhere after? Or is it just the conversation that matters?" },
      { author: "Dr. Nguyen", avatar: "N", avatarColor: "#af52de", time: "18h ago", text: "We photograph them and drop them in a shared folder. Sometimes we revisit them mid-year." },
    ],
    upvoted: false, bookmarked: true,
  },
  {
    id: 4,
    author: "Mr. Torres",
    avatar: "T",
    avatarColor: "#34c759",
    time: "2d ago",
    tag: "Classroom Mgmt",
    title: "The '2x10' relationship strategy — research backed and it works",
    body: "For your most challenging student: spend 2 minutes a day for 10 consecutive days having a genuine conversation about anything but academics. Research shows it significantly reduces behavior issues and improves engagement. I was skeptical. I was wrong.",
    upvotes: 387,
    comments: [
      { author: "Ms. Kim", avatar: "K", avatarColor: "#af52de", time: "2d ago", text: "I've heard about this but never actually tried it consistently. Starting Monday." },
      { author: "Ms. Johnson", avatar: "J", avatarColor: "#ff3b30", time: "1d ago", text: "What do you talk about? I feel awkward with the open-ended part." },
      { author: "Mr. Torres", avatar: "T", avatarColor: "#34c759", time: "1d ago", text: "Sports, games, food — anything they care about. The topic doesn't matter, the consistency does." },
    ],
    upvoted: true, bookmarked: false,
  },
];

/* ─── Sub-components ────────────────────────────────────────── */
function LibraryCard({ item, onStar }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
    >
      {/* Colour bar */}
      <div className="h-1.5 w-full" style={{ background: item.color }} />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-sm md:text-xs text-muted-foreground">
            <span style={{ color: item.color }}>{TYPE_ICON[item.type]}</span>
            <span className="capitalize">{item.type}</span>
          </div>
          <button
            onClick={() => onStar(item.id)}
            className={`transition-colors ${item.starred ? "text-brand-orange" : "text-muted-foreground hover:text-brand-orange"}`}
          >
            <Star className="w-4 h-4" fill={item.starred ? "currentColor" : "none"} />
          </button>
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-1.5">{item.title}</h3>
        <p className="text-sm md:text-xs text-muted-foreground leading-relaxed flex-1 mb-3">{item.description}</p>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Badge variant="secondary" className="text-sm md:text-[10px] px-2 py-0.5">{item.subject}</Badge>
          <Badge variant="outline" className="text-sm md:text-[10px] px-2 py-0.5">Gr {item.grade}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm md:text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" /> {item.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-brand-orange" fill="currentColor" /> {item.rating}
            </span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-sm md:text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3 h-3" /> Open
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ForumPost({ post, onUpvote, onBookmark }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments);

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      { author: "You", avatar: "Y", avatarColor: "#007aff", time: "just now", text: commentText.trim() },
    ]);
    setCommentText("");
  };

  const tagColor = {
    Tips: "text-blue-500 bg-blue-500/10",
    Strategies: "text-green-500 bg-green-500/10",
    Tools: "text-orange-500 bg-orange-500/10",
    Curriculum: "text-brand-deep bg-brand-deep/10",
    Assessment: "text-pink-500 bg-pink-500/10",
    "Classroom Mgmt": "text-red-500 bg-red-500/10",
    Differentiation: "text-cyan-500 bg-cyan-500/10",
  }[post.tag] || "text-muted-foreground bg-secondary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-primary)] text-sm md:text-xs font-bold shrink-0"
            style={{ background: post.avatarColor }}
          >
            {post.avatar}
          </div>
          <span className="text-sm font-medium">{post.author}</span>
          <span className="text-sm md:text-xs text-muted-foreground">{post.time}</span>
          <span className={`ml-auto text-sm md:text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColor}`}>
            {post.tag}
          </span>
        </div>

        {/* Body */}
        <h3
          className="font-semibold text-sm mb-2 cursor-pointer hover:text-primary transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{post.body}</p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={() => onUpvote(post.id)}
            className={`flex items-center gap-1.5 text-sm md:text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              post.upvoted
                ? "bg-primary/10 text-primary"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChevronUp className="w-4 h-4" />
            {post.upvotes + (post.upvoted ? 0 : 0)}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-sm md:text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {comments.length}
          </button>
          <button
            onClick={() => onBookmark(post.id)}
            className={`flex items-center gap-1.5 text-sm md:text-xs px-2.5 py-1.5 rounded-lg transition-colors ml-auto ${
              post.bookmarked
                ? "text-brand-orange"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={post.bookmarked ? "currentColor" : "none"} />
          </button>
          <button className="flex items-center gap-1.5 text-sm md:text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-3 space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-primary)] text-sm md:text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: c.avatarColor }}
                  >
                    {c.avatar}
                  </div>
                  <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm md:text-xs font-semibold">{c.author}</span>
                      <span className="text-sm md:text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-sm md:text-xs text-foreground leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div className="flex gap-2 pt-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[var(--text-primary)] text-sm md:text-[10px] font-bold shrink-0 mt-0.5">
                  Y
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="Add a comment…"
                    className="h-8 text-sm md:text-xs rounded-xl"
                  />
                  <Button size="sm" className="h-8 w-8 p-0 rounded-xl shrink-0" onClick={handleComment}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function TeacherResources() {
  const [tab, setTab] = useState("library");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [forumTag, setForumTag] = useState("All");
  const [forumSort, setForumSort] = useState("top");
  const [libraryItems, setLibraryItems] = useState(LIBRARY_ITEMS);
  const [forumPosts, setForumPosts] = useState(FORUM_POSTS);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "", tag: "Tips" });

  /* Library filtering */
  const filteredLibrary = libraryItems.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.subject.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  /* Forum filtering + sorting */
  const filteredForum = forumPosts
    .filter((p) => {
      const matchTag = forumTag === "All" || p.tag === forumTag;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase());
      return matchTag && matchSearch;
    })
    .sort((a, b) => forumSort === "top" ? b.upvotes - a.upvotes : 0);

  const handleStar = (id) =>
    setLibraryItems((prev) => prev.map((i) => i.id === id ? { ...i, starred: !i.starred } : i));

  const handleUpvote = (id) =>
    setForumPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, upvoted: !p.upvoted, upvotes: p.upvoted ? p.upvotes - 1 : p.upvotes + 1 } : p
    ));

  const handleBookmark = (id) =>
    setForumPosts((prev) => prev.map((p) => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));

  const handleSubmitPost = () => {
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    setForumPosts((prev) => [{
      id: Date.now(), author: "You", avatar: "Y", avatarColor: "#007aff",
      time: "just now", tag: newPost.tag, title: newPost.title.trim(),
      body: newPost.body.trim(), upvotes: 0, comments: [], upvoted: false, bookmarked: false,
    }, ...prev]);
    setNewPost({ title: "", body: "", tag: "Tips" });
    setShowNewPost(false);
    setTab("forum");
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-border bg-card/60 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-semibold text-xl">Resources</h1>
            <p className="text-sm md:text-xs text-muted-foreground mt-0.5">Curated materials and community knowledge</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources…"
                className="pl-9 h-9 w-56 text-sm rounded-xl"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {tab === "forum" && (
              <Button size="sm" className="h-9 gap-1.5 rounded-xl" onClick={() => setShowNewPost(true)}>
                <Plus className="w-4 h-4" /> Post
              </Button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-4 bg-secondary/60 rounded-xl p-1 w-fit">
          {[
            { key: "library", label: "Library", icon: <BookOpen className="w-3.5 h-3.5" /> },
            { key: "forum",   label: "Forum",   icon: <MessageSquare className="w-3.5 h-3.5" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ══ LIBRARY TAB ════════════════════════════════════════ */}
        {tab === "library" && (
          <div className="p-6">
            {/* Category pills */}
            <div className="flex gap-2 flex-wrap mb-6">
              {LIBRARY_CATEGORIES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-3.5 py-1.5 rounded-full text-sm md:text-xs font-semibold border transition-all ${
                    activeCategory === key
                      ? "text-[var(--text-primary)] border-transparent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                  style={activeCategory === key ? { background: color, borderColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filteredLibrary.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No resources match your search.
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredLibrary.map((item) => (
                    <LibraryCard key={item.id} item={item} onStar={handleStar} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* ══ FORUM TAB ═════════════════════════════════════════ */}
        {tab === "forum" && (
          <div className="p-6 max-w-2xl mx-auto">
            {/* Sort + tag filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex gap-1 bg-secondary/60 rounded-xl p-1">
                {[
                  { key: "top",   label: "Top",   icon: <TrendingUp className="w-3 h-3" /> },
                  { key: "new",   label: "New",   icon: <Clock className="w-3 h-3" /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setForumSort(key)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm md:text-xs font-medium transition-all ${
                      forumSort === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {FORUM_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForumTag(t)}
                    className={`px-2.5 py-1 rounded-full text-sm md:text-[11px] font-semibold border transition-all ${
                      forumTag === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* New post form */}
            <AnimatePresence>
              {showNewPost && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">New Post</span>
                      <button onClick={() => setShowNewPost(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      placeholder="Title — what did you learn or want to share?"
                      value={newPost.title}
                      onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                      className="rounded-xl text-sm"
                    />
                    <textarea
                      placeholder="Share your insight, strategy, or question…"
                      value={newPost.body}
                      onChange={(e) => setNewPost((p) => ({ ...p, body: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newPost.tag}
                        onChange={(e) => setNewPost((p) => ({ ...p, tag: e.target.value }))}
                        className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {FORUM_TAGS.filter((t) => t !== "All").map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <Button className="rounded-xl" onClick={handleSubmitPost}>Post</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts */}
            <div className="space-y-3">
              {filteredForum.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  No posts match your filter.
                </div>
              ) : (
                filteredForum.map((post) => (
                  <ForumPost
                    key={post.id}
                    post={post}
                    onUpvote={handleUpvote}
                    onBookmark={handleBookmark}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
