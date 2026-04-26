import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Table2,
  MessageSquare,
  PenLine,
  Unplug,
  HeartHandshake,
  AlignLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import ToolCard from "../../components/ai-tools/ToolCard";
import ToolModal from "../../components/ai-tools/ToolModal";
import LessonPlanTool from "../../components/ai-tools/teacher/LessonPlanTool";
import QuizGeneratorTool from "../../components/ai-tools/teacher/QuizGeneratorTool";
import RubricGeneratorTool from "../../components/ai-tools/teacher/RubricGeneratorTool";
import ReportCardTool from "../../components/ai-tools/teacher/ReportCardTool";
import WritingFeedbackTool from "../../components/ai-tools/teacher/WritingFeedbackTool";
import StandardsUnpackerTool from "../../components/ai-tools/teacher/StandardsUnpackerTool";
import AccommodationsTool from "../../components/ai-tools/teacher/AccommodationsTool";
import TextLevelerTool from "../../components/ai-tools/teacher/TextLevelerTool";

const TOOLS = [
  {
    id: "lesson-plan",
    name: "Lesson Plan Generator",
    description: "Generate structured lesson plans with hooks, instruction, practice, and exit tickets.",
    subtitle: "Build lessons your students will remember long after the bell.",
    icon: BookOpen,
    subject: "General",
    category: "Lesson Planning",
    component: LessonPlanTool,
  },
  {
    id: "quiz-generator",
    name: "Multiple Choice Quiz Generator",
    description: "Create ready-to-use quizzes with answer keys for any topic or standard.",
    subtitle: "Build a quiz your students will actually want to take.",
    icon: ClipboardList,
    subject: "General",
    category: "Assessment",
    component: QuizGeneratorTool,
  },
  {
    id: "rubric",
    name: "Rubric Generator",
    description: "Build detailed grading rubrics as markdown tables with observable descriptors.",
    subtitle: "Set the standard before a single word is written.",
    icon: Table2,
    subject: "General",
    category: "Assessment",
    component: RubricGeneratorTool,
  },
  {
    id: "report-card",
    name: "Report Card Comments",
    description: "Generate professional, personalized report card comments for any student.",
    subtitle: "Find the words that tell every student's unique story.",
    icon: MessageSquare,
    subject: "General",
    category: "Grading",
    component: ReportCardTool,
  },
  {
    id: "writing-feedback",
    name: "Writing Feedback",
    description: "Get detailed, structured feedback on student writing based on your criteria.",
    subtitle: "Give feedback that actually moves the needle.",
    icon: PenLine,
    subject: "ELA",
    category: "Grading",
    component: WritingFeedbackTool,
  },
  {
    id: "standards-unpacker",
    name: "Standards Unpacker",
    description: "Break down any academic standard into I can statements, vocabulary, and formative ideas.",
    subtitle: "Translate bureaucratic standards into moments of real learning.",
    icon: Unplug,
    subject: "General",
    category: "Lesson Planning",
    component: StandardsUnpackerTool,
  },
  {
    id: "accommodations",
    name: "Accommodation Suggestions",
    description: "Get practical, in-classroom accommodations grouped by instructional, assessment, environmental, and tech.",
    subtitle: "Meet every learner exactly where they are.",
    icon: HeartHandshake,
    subject: "General",
    category: "Student Support",
    component: AccommodationsTool,
  },
  {
    id: "text-leveler",
    name: "Text Leveler",
    description: "Rewrite any text for a target reading level while preserving all content and facts.",
    subtitle: "One text, every reading level — no student left behind.",
    icon: AlignLeft,
    subject: "ELA",
    category: "Student Support",
    component: TextLevelerTool,
  },
];

const CATEGORIES = ["All", "Lesson Planning", "Assessment", "Student Support", "Grading", "Communication"];

export default function TeacherAIToolsPage() {
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">AI Teacher Toolkit</h1>
              <p className="text-sm text-muted-foreground">
                Generate, scaffold, and personalize — connected to your classes.
              </p>
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
        subtitle={activeTool?.subtitle}
      >
        {activeTool && (
          <activeTool.component key={activeTool.id} />
        )}
      </ToolModal>
    </div>
  );
}
