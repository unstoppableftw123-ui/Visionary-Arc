import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Brain,
  Zap,
  FileEdit,
  Search,
  FileText,
  Lightbulb,
  Swords,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import ToolCard from "../../components/ai-tools/ToolCard";
import ToolModal from "../../components/ai-tools/ToolModal";
import AITutorTool from "../../components/ai-tools/student/AITutorTool";
import StudyBotTool from "../../components/ai-tools/student/StudyBotTool";
import QuizMeTool from "../../components/ai-tools/student/QuizMeTool";
import WritingFeedbackStudentTool from "../../components/ai-tools/student/WritingFeedbackStudentTool";
import ResearchAssistantTool from "../../components/ai-tools/student/ResearchAssistantTool";
import ChatWithDocsTool from "../../components/ai-tools/student/ChatWithDocsTool";
import ExpandIdeaTool from "../../components/ai-tools/student/ExpandIdeaTool";
import DebatePartnerTool from "../../components/ai-tools/student/DebatePartnerTool";
import StepByStepTool from "../../components/ai-tools/student/StepByStepTool";

const TOOLS = [
  {
    id: "ai-tutor",
    name: "AI Tutor",
    description: "Ask anything. Get patient, step-by-step guidance tailored to how you learn.",
    subtitle: "Your always-on, never-judgmental study guide.",
    icon: GraduationCap,
    subject: "General",
    category: "Study",
    xpReward: 10,
    component: AITutorTool,
  },
  {
    id: "study-bot",
    name: "Study Bot",
    description: "Your personal study partner. Get quizzed, or have concepts explained in your style.",
    subtitle: "Study smarter, not longer — your exam is waiting.",
    icon: Brain,
    subject: "General",
    category: "Study",
    xpReward: 15,
    component: StudyBotTool,
  },
  {
    id: "quiz-me",
    name: "Quiz Me",
    description: "Generate a custom practice quiz on any topic. Multiple choice, short answer, or mixed.",
    subtitle: "Test yourself before it counts.",
    icon: Zap,
    subject: "General",
    category: "Study",
    xpReward: 20,
    component: QuizMeTool,
  },
  {
    id: "writing-feedback",
    name: "Writing Feedback",
    description: "Get targeted coaching on your writing before you submit — what's working and what to fix.",
    subtitle: "Find out what's great and what to fix — before you hit submit.",
    icon: FileEdit,
    subject: "ELA",
    category: "Writing",
    xpReward: 10,
    component: WritingFeedbackStudentTool,
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    description: "Get an overview, key points, and specific source suggestions for any research topic.",
    subtitle: "From blank page to research roadmap in seconds.",
    icon: Search,
    subject: "General",
    category: "Research",
    xpReward: 10,
    component: ResearchAssistantTool,
  },
  {
    id: "chat-with-docs",
    name: "Chat with Docs",
    description: "Paste any document and ask it questions. Get answers grounded only in the text.",
    subtitle: "Ask anything about any document. Get straight answers.",
    icon: FileText,
    subject: "General",
    category: "Research",
    xpReward: 5,
    component: ChatWithDocsTool,
  },
  {
    id: "expand-idea",
    name: "Expand My Idea",
    description: "Turn a rough idea into something bigger — 3 different directions to take your writing.",
    subtitle: "Turn a rough idea into something you're proud of.",
    icon: Lightbulb,
    subject: "ELA",
    category: "Writing",
    xpReward: 10,
    component: ExpandIdeaTool,
  },
  {
    id: "debate-partner",
    name: "Debate Partner",
    description: "Practice arguing your position against an AI that takes the opposite side.",
    subtitle: "Defend your argument against the toughest opponent — AI.",
    icon: Swords,
    subject: "ELA",
    category: "Creative",
    xpReward: 20,
    component: DebatePartnerTool,
  },
  {
    id: "step-by-step",
    name: "Step by Step",
    description: "Break down any assignment into clear, ordered steps so you know exactly how to start.",
    subtitle: "When you don't know where to start, start here.",
    icon: ListOrdered,
    subject: "General",
    category: "Study",
    xpReward: 5,
    component: StepByStepTool,
  },
];

const CATEGORIES = ["All", "Study", "Writing", "Research", "Creative"];

export default function StudentAIToolsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openTool, setOpenTool] = useState(null);

  const filtered = useMemo(() => {
    return TOOLS.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const activeTool = TOOLS.find((t) => t.id === openTool);

  // Total XP for the page header
  const totalXP = TOOLS.reduce((sum, t) => sum + (t.xpReward ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold">AI Study Toolkit</h1>
                <p className="text-sm text-muted-foreground">
                  Smarter studying. Faster learning. Real results.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-sm md:text-xs text-muted-foreground leading-none">Earn up to</p>
                <p className="font-bold text-primary text-sm">{totalXP} XP</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="relative mb-4"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="pl-9"
          />
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide"
        >
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-sm md:text-xs"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </motion.div>

        {/* Tool Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No tools match your search.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => { setSearch(""); setActiveCategory("All"); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool, i) => (
              <ToolCard
                key={tool.id}
                name={tool.name}
                description={tool.description}
                icon={tool.icon}
                subject={tool.subject}
                category={tool.category}
                xpReward={tool.xpReward}
                index={i}
                onOpen={() => setOpenTool(tool.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tool Modal */}
      <ToolModal
        isOpen={!!openTool}
        onClose={() => setOpenTool(null)}
        title={activeTool?.name ?? ""}
        icon={activeTool?.icon}
        description={activeTool?.description}
        subtitle={
          activeTool
            ? `${activeTool.subtitle ?? activeTool.description}${activeTool.xpReward ? ` · ⚡ +${activeTool.xpReward} XP` : ""}`
            : ""
        }
      >
        {activeTool && (
          <activeTool.component key={activeTool.id} />
        )}
      </ToolModal>
    </div>
  );
}
