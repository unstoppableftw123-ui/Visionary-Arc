/**
 * AIToolsPanel — Reusable AI tools grid panel.
 * Embeds the full search + filter + tool grid + modals without a page header.
 * Used in: profile card Sheet (Sidebar) and Settings page.
 */
import { useState, useMemo, useContext } from "react";
import {
  BookOpen, ClipboardList, Table2, MessageSquare, PenLine, Unplug, HeartHandshake, AlignLeft,
  GraduationCap, Brain, Zap, FileEdit, Search, FileText, Lightbulb, Swords, ListOrdered,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolCard from "./ToolCard";
import ToolModal from "./ToolModal";
import { AuthContext } from "../../App";

// ── Teacher tool components ──────────────────────────────────────────────────
import LessonPlanTool from "./teacher/LessonPlanTool";
import QuizGeneratorTool from "./teacher/QuizGeneratorTool";
import RubricGeneratorTool from "./teacher/RubricGeneratorTool";
import ReportCardTool from "./teacher/ReportCardTool";
import WritingFeedbackTool from "./teacher/WritingFeedbackTool";
import StandardsUnpackerTool from "./teacher/StandardsUnpackerTool";
import AccommodationsTool from "./teacher/AccommodationsTool";
import TextLevelerTool from "./teacher/TextLevelerTool";

// ── Student tool components ──────────────────────────────────────────────────
import AITutorTool from "./student/AITutorTool";
import StudyBotTool from "./student/StudyBotTool";
import QuizMeTool from "./student/QuizMeTool";
import WritingFeedbackStudentTool from "./student/WritingFeedbackStudentTool";
import ResearchAssistantTool from "./student/ResearchAssistantTool";
import ChatWithDocsTool from "./student/ChatWithDocsTool";
import ExpandIdeaTool from "./student/ExpandIdeaTool";
import DebatePartnerTool from "./student/DebatePartnerTool";
import StepByStepTool from "./student/StepByStepTool";

// ── Tool configs ─────────────────────────────────────────────────────────────
const TEACHER_TOOLS = [
  {
    id: "lesson-plan",
    name: "Lesson Plan Generator",
    description: "Generate structured lesson plans with hooks, instruction, practice, and exit tickets.",
    subtitle: "Build lessons your students will remember long after the bell.",
    icon: BookOpen, subject: "General", category: "Lesson Planning",
    component: LessonPlanTool,
  },
  {
    id: "quiz-generator",
    name: "Multiple Choice Quiz Generator",
    description: "Create ready-to-use quizzes with answer keys for any topic or standard.",
    subtitle: "Build a quiz your students will actually want to take.",
    icon: ClipboardList, subject: "General", category: "Assessment",
    component: QuizGeneratorTool,
  },
  {
    id: "rubric",
    name: "Rubric Generator",
    description: "Build detailed grading rubrics as markdown tables with observable descriptors.",
    subtitle: "Set the standard before a single word is written.",
    icon: Table2, subject: "General", category: "Assessment",
    component: RubricGeneratorTool,
  },
  {
    id: "report-card",
    name: "Report Card Comments",
    description: "Generate professional, personalized report card comments for any student.",
    subtitle: "Find the words that tell every student's unique story.",
    icon: MessageSquare, subject: "General", category: "Grading",
    component: ReportCardTool,
  },
  {
    id: "writing-feedback",
    name: "Writing Feedback",
    description: "Get detailed, structured feedback on student writing based on your criteria.",
    subtitle: "Give feedback that actually moves the needle.",
    icon: PenLine, subject: "ELA", category: "Grading",
    component: WritingFeedbackTool,
  },
  {
    id: "standards-unpacker",
    name: "Standards Unpacker",
    description: "Break down any academic standard into I can statements, vocabulary, and formative ideas.",
    subtitle: "Translate bureaucratic standards into moments of real learning.",
    icon: Unplug, subject: "General", category: "Lesson Planning",
    component: StandardsUnpackerTool,
  },
  {
    id: "accommodations",
    name: "Accommodation Suggestions",
    description: "Get practical, in-classroom accommodations grouped by instructional, assessment, environmental, and tech.",
    subtitle: "Meet every learner exactly where they are.",
    icon: HeartHandshake, subject: "General", category: "Student Support",
    component: AccommodationsTool,
  },
  {
    id: "text-leveler",
    name: "Text Leveler",
    description: "Rewrite any text for a target reading level while preserving all content and facts.",
    subtitle: "One text, every reading level — no student left behind.",
    icon: AlignLeft, subject: "ELA", category: "Student Support",
    component: TextLevelerTool,
  },
];

const STUDENT_TOOLS = [
  {
    id: "ai-tutor",
    name: "AI Tutor",
    description: "Ask anything. Get patient, step-by-step guidance tailored to how you learn.",
    subtitle: "Your always-on, never-judgmental study guide.",
    icon: GraduationCap, subject: "General", category: "Study", xpReward: 10,
    component: AITutorTool,
  },
  {
    id: "study-bot",
    name: "Study Bot",
    description: "Your personal study partner. Get quizzed, or have concepts explained in your style.",
    subtitle: "Study smarter, not longer — your exam is waiting.",
    icon: Brain, subject: "General", category: "Study", xpReward: 15,
    component: StudyBotTool,
  },
  {
    id: "quiz-me",
    name: "Quiz Me",
    description: "Generate a custom practice quiz on any topic. Multiple choice, short answer, or mixed.",
    subtitle: "Test yourself before it counts.",
    icon: Zap, subject: "General", category: "Study", xpReward: 20,
    component: QuizMeTool,
  },
  {
    id: "writing-feedback",
    name: "Writing Feedback",
    description: "Get targeted coaching on your writing before you submit — what's working and what to fix.",
    subtitle: "Find out what's great and what to fix — before you hit submit.",
    icon: FileEdit, subject: "ELA", category: "Writing", xpReward: 10,
    component: WritingFeedbackStudentTool,
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    description: "Get an overview, key points, and specific source suggestions for any research topic.",
    subtitle: "From blank page to research roadmap in seconds.",
    icon: Search, subject: "General", category: "Research", xpReward: 10,
    component: ResearchAssistantTool,
  },
  {
    id: "chat-with-docs",
    name: "Chat with Docs",
    description: "Paste any document and ask it questions. Get answers grounded only in the text.",
    subtitle: "Ask anything about any document. Get straight answers.",
    icon: FileText, subject: "General", category: "Research", xpReward: 5,
    component: ChatWithDocsTool,
  },
  {
    id: "expand-idea",
    name: "Expand My Idea",
    description: "Turn a rough idea into something bigger — 3 different directions to take your writing.",
    subtitle: "Turn a rough idea into something you're proud of.",
    icon: Lightbulb, subject: "ELA", category: "Writing", xpReward: 10,
    component: ExpandIdeaTool,
  },
  {
    id: "debate-partner",
    name: "Debate Partner",
    description: "Practice arguing your position against an AI that takes the opposite side.",
    subtitle: "Defend your argument against the toughest opponent — AI.",
    icon: Swords, subject: "ELA", category: "Creative", xpReward: 20,
    component: DebatePartnerTool,
  },
  {
    id: "step-by-step",
    name: "Step by Step",
    description: "Break down any assignment into clear, ordered steps so you know exactly how to start.",
    subtitle: "When you don't know where to start, start here.",
    icon: ListOrdered, subject: "General", category: "Study", xpReward: 5,
    component: StepByStepTool,
  },
];

const TEACHER_CATEGORIES = ["All", "Lesson Planning", "Assessment", "Student Support", "Grading"];
const STUDENT_CATEGORIES = ["All", "Study", "Writing", "Research", "Creative"];

// ─────────────────────────────────────────────────────────────────────────────

export default function AIToolsPanel({ gridCols = "grid-cols-1 sm:grid-cols-2" }) {
  const { isTeacher } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openTool, setOpenTool] = useState(null);

  const tools = isTeacher ? TEACHER_TOOLS : STUDENT_TOOLS;
  const categories = isTeacher ? TEACHER_CATEGORIES : STUDENT_CATEGORIES;

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tools, search, activeCategory]);

  const activeTool = tools.find((t) => t.id === openTool);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools…"
          className="pl-9"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-sm md:text-xs shrink-0"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Tool grid */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No tools match your search.
          <button
            type="button"
            className="block mx-auto mt-2 text-sm md:text-xs text-primary hover:underline"
            onClick={() => { setSearch(""); setActiveCategory("All"); }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 ${gridCols}`}>
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

      {/* Tool modal */}
      <ToolModal
        isOpen={!!openTool}
        onClose={() => setOpenTool(null)}
        title={activeTool?.name ?? ""}
        icon={activeTool?.icon}
        description={activeTool?.description}
        subtitle={activeTool?.subtitle}
      >
        {activeTool && <activeTool.component key={activeTool.id} />}
      </ToolModal>
    </div>
  );
}
