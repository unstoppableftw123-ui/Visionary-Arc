import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Users, BookOpen, Plus, Hash, Send, Copy, Check, Search,
  FileText, Link as LinkIcon, ExternalLink, Trash2, Pin,
  GraduationCap, Calendar, MessageSquare, Bell, Clock,
  CheckCircle, School, ClipboardList, Award, TrendingUp, Megaphone, Zap, Radio,
  MoreHorizontal, Paperclip, X, Trophy, Target,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Progress } from "../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { teacherProfile, mockStudents, mockAssignments } from "../../data/mockTeacherData";
import { SUBJECTS as PRACTICE_SUBJECTS } from "../../data/mockPracticeData";
import { CLASS_RANK_LEVELS, DEFAULT_CLASS_RANK_TITLES } from "../../data/rewardsProgram";
import { generateClassCode } from "../../utils/generateClassCode";
import { AuthContext } from "../../App";
import { createClass } from "../../services/classService";

// ── Color palette ──────────────────────────────────────────────────────────
const CLASS_COLORS = [
  { dot: "bg-blue-500",    gradient: "from-blue-500 to-blue-600",    text: "text-blue-600",    light: "bg-blue-500/10" },
  { dot: "bg-brand-deep",  gradient: "from-brand-deep to-brand-orange",  text: "text-brand-deep",  light: "bg-brand-deep/10" },
  { dot: "bg-emerald-500", gradient: "from-emerald-500 to-emerald-600", text: "text-emerald-600", light: "bg-emerald-500/10" },
];

// ── Vocab Jam word sets (must match IDs in mockAdapter JAM_WORD_SETS) ──────
const VOCAB_JAM_WORD_SETS = [
  {
    id: 'ws_bio', name: 'Biology Basics',
    words: [
      { term: 'Mitosis', definition: 'Cell division producing two identical daughter cells', distractors: ['Cell death', 'DNA transcription', 'Meiosis'] },
      { term: 'Photosynthesis', definition: 'Process plants use to convert sunlight into food', distractors: ['Cellular respiration', 'Transpiration', 'Fermentation'] },
      { term: 'Osmosis', definition: 'Movement of water through a semipermeable membrane', distractors: ['Active transport', 'Diffusion of solutes', 'Endocytosis'] },
      { term: 'DNA', definition: 'Double-helix molecule carrying genetic instructions', distractors: ['Protein', 'mRNA', 'Carbohydrate'] },
      { term: 'Meiosis', definition: 'Cell division producing four haploid gametes', distractors: ['Mitosis', 'Binary fission', 'Cloning'] },
    ],
  },
  {
    id: 'ws_env', name: 'Environmental Science',
    words: [
      { term: 'Ecosystem', definition: 'Community of organisms interacting with their environment', distractors: ['Biome', 'Population', 'Habitat'] },
      { term: 'Biodiversity', definition: 'Variety of life in an area or on Earth', distractors: ['Biomass', 'Population density', 'Species dominance'] },
      { term: 'Carbon Cycle', definition: 'Circulation of carbon through atmosphere, organisms, and land', distractors: ['Water cycle', 'Nitrogen cycle', 'Phosphorus cycle'] },
      { term: 'Renewable Energy', definition: 'Energy from sources that naturally replenish', distractors: ['Fossil fuels', 'Nuclear energy', 'Coal power'] },
      { term: 'Deforestation', definition: 'Permanent removal of trees and forest cover', distractors: ['Reforestation', 'Afforestation', 'Erosion'] },
    ],
  },
  {
    id: 'ws_sat', name: 'SAT Vocabulary',
    words: [
      { term: 'Ephemeral', definition: 'Lasting for a very short time', distractors: ['Permanent', 'Frequent', 'Substantial'] },
      { term: 'Ubiquitous', definition: 'Present, appearing, or found everywhere', distractors: ['Rare', 'Unique', 'Hidden'] },
      { term: 'Pragmatic', definition: 'Dealing with things sensibly and realistically', distractors: ['Idealistic', 'Theoretical', 'Abstract'] },
      { term: 'Ambiguous', definition: 'Open to more than one interpretation', distractors: ['Clear', 'Definitive', 'Explicit'] },
      { term: 'Tenacious', definition: 'Holding firmly to a goal; persistent', distractors: ['Hesitant', 'Flexible', 'Timid'] },
    ],
  },
];
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// ── Extended mock data ─────────────────────────────────────────────────────
const CLS1_IDS = ["s1", "s2", "s5", "s7", "s9", "s11", "s13", "s17", "s19"];
const CLS2_IDS = ["s3", "s4", "s6", "s10", "s14", "s15", "s18", "s20"];
const CLS3_IDS = ["s8", "s12", "s16", "s1", "s3", "s5"];

const INITIAL_CLASSES = [
  {
    ...teacherProfile.classes[0],
    join_code: "BIO-2841",
    subject: "Biology",
    description: "Introduction to cellular biology, genetics, and evolution.",
    created: "Sep 3, 2025",
    students: mockStudents.filter(s => CLS1_IDS.includes(s.id)),
    assignments: mockAssignments.filter(a => a.classId === "cls1"),
    resources: [
      { id: "r1", title: "Cell Biology Study Guide", type: "pdf", url: "#", author: "Ms. Chen", date: "Mar 1" },
      { id: "r2", title: "Khan Academy: Cell Division", type: "link", url: "#", author: "Ms. Chen", date: "Mar 3" },
      { id: "r3", title: "Mitosis vs Meiosis Notes", type: "note", content: "Key comparison points for exam...", author: "Ms. Chen", date: "Mar 5" },
    ],
    messages: [
      { id: "cm1", sender: "Ms. Chen", isTeacher: true, time: "9:15 AM", text: "Good morning! Lab reports are due Friday. Let me know if you have questions.", pinned: true },
      { id: "cm2", sender: "Aiden Park", isTeacher: false, time: "9:18 AM", text: "Do we need to include a bibliography?", pinned: false },
      { id: "cm3", sender: "Ms. Chen", isTeacher: true, time: "9:20 AM", text: "Yes, at least 3 sources in MLA format.", pinned: false },
      { id: "cm4", sender: "Brianna Torres", isTeacher: false, time: "10:05 AM", text: "Can we submit tomorrow instead?", pinned: false },
      { id: "cm5", sender: "Ms. Chen", isTeacher: true, time: "10:08 AM", text: "One day extension is fine — submit by Saturday 11:59 PM.", pinned: false },
    ],
    activity: [
      { id: "ac1", type: "submission", text: "Carlos Mendez submitted Cell Division Lab Report", time: "2 hours ago" },
      { id: "ac2", type: "submission", text: "Aiden Park submitted Cell Division Lab Report", time: "3 hours ago" },
      { id: "ac3", type: "join", text: "Riley Thompson joined the class", time: "Yesterday" },
      { id: "ac4", type: "message", text: "Brianna Torres sent a message", time: "Yesterday" },
      { id: "ac5", type: "submission", text: "Ethan Williams submitted DNA Replication Worksheet", time: "2 days ago" },
    ],
    assignedSkills: [],
    avgGrade: 82,
    completionRate: 78,
  },
  {
    ...teacherProfile.classes[1],
    join_code: "ENV-5729",
    subject: "AP Environmental Science",
    description: "Advanced study of environmental systems, policy, and sustainability.",
    created: "Sep 3, 2025",
    students: mockStudents.filter(s => CLS2_IDS.includes(s.id)),
    assignments: mockAssignments.filter(a => a.classId === "cls2"),
    resources: [
      { id: "r4", title: "AP Environmental Science Review", type: "pdf", url: "#", author: "Ms. Chen", date: "Feb 20" },
      { id: "r5", title: "EPA.gov Climate Resources", type: "link", url: "#", author: "Ms. Chen", date: "Mar 2" },
    ],
    messages: [
      { id: "cm6", sender: "Ms. Chen", isTeacher: true, time: "8:00 AM", text: "Reminder: Ecosystem essays are due next Thursday. Post questions here!", pinned: true },
      { id: "cm7", sender: "Fatima Hassan", isTeacher: false, time: "8:15 AM", text: "Should our essay focus on a specific biome or any ecosystem?", pinned: false },
      { id: "cm8", sender: "Ms. Chen", isTeacher: true, time: "8:18 AM", text: "Any ecosystem works! Pick something you find interesting.", pinned: false },
    ],
    activity: [
      { id: "ac6", type: "submission", text: "Fatima Hassan submitted Ecosystem Dynamics Essay", time: "1 hour ago" },
      { id: "ac7", type: "submission", text: "Carlos Mendez submitted Ecosystem Dynamics Essay", time: "4 hours ago" },
      { id: "ac8", type: "message", text: "Nina Rossi sent a message in class chat", time: "Yesterday" },
      { id: "ac9", type: "join", text: "Omar Khalil joined the class", time: "3 days ago" },
      { id: "ac10", type: "submission", text: "Sofia Reyes submitted Biodiversity Unit Test", time: "3 days ago" },
    ],
    assignedSkills: [],
    avgGrade: 74,
    completionRate: 64,
  },
  {
    ...teacherProfile.classes[2],
    join_code: "BIO-9163",
    subject: "Biology",
    description: "Introduction to cellular biology, genetics, and evolution.",
    created: "Sep 3, 2025",
    students: mockStudents.filter(s => CLS3_IDS.includes(s.id)),
    assignments: mockAssignments.filter(a => a.classId === "cls3"),
    resources: [
      { id: "r6", title: "Photosynthesis Diagram Notes", type: "pdf", url: "#", author: "Ms. Chen", date: "Mar 8" },
    ],
    messages: [
      { id: "cm9", sender: "Ms. Chen", isTeacher: true, time: "Yesterday", text: "Great work on the quiz! Grades are posted. Review the feedback carefully.", pinned: false },
      { id: "cm10", sender: "Hana Yamamoto", isTeacher: false, time: "Yesterday", text: "Thanks Ms. Chen! Can we go over problem 5 in class tomorrow?", pinned: false },
      { id: "cm11", sender: "Ms. Chen", isTeacher: true, time: "Yesterday", text: "Absolutely! I already added it to tomorrow's agenda.", pinned: false },
    ],
    activity: [
      { id: "ac11", type: "submission", text: "Priya Nair submitted Mitosis vs Meiosis Quiz", time: "5 hours ago" },
      { id: "ac12", type: "submission", text: "Layla Ahmed submitted Photosynthesis Quiz", time: "6 hours ago" },
      { id: "ac13", type: "message", text: "Hana Yamamoto sent a message", time: "Yesterday" },
      { id: "ac14", type: "submission", text: "Hana Yamamoto completed Mitosis vs Meiosis Quiz", time: "2 days ago" },
      { id: "ac15", type: "join", text: "3 new students joined this week", time: "3 days ago" },
    ],
    assignedSkills: [],
    avgGrade: 88,
    completionRate: 94,
  },
];
// ──────────────────────────────────────────────────────────────────────────

const SUBJECTS = ["Math", "Science", "Biology", "AP Environmental Science", "English", "History", "Art", "Other"];
const GRADES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"];
const RESOURCE_TYPES = ["link", "pdf", "note"];
const ASSIGNMENT_TYPES = ["assignment", "quiz", "test"];
const REACTION_EMOJIS = ["👍", "❤️", "🔥", "👏", "🤔"];

function getColor(idx) {
  return CLASS_COLORS[idx % CLASS_COLORS.length];
}

function StatusBadge({ status }) {
  const map = {
    active:    "bg-blue-500/10 text-blue-600",
    graded:    "bg-green-500/10 text-green-600",
    draft:     "bg-secondary text-muted-foreground",
    on_track:  "bg-green-500/10 text-green-600",
    struggling:"bg-brand-orange/10 text-brand-deep",
    at_risk:   "bg-red-500/10 text-red-600",
  };
  return (
    <span className={`text-sm md:text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? "bg-secondary text-muted-foreground"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

export default function Classes() {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialogs
  const [newClassOpen, setNewClassOpen] = useState(false);
  const [newAssignmentOpen, setNewAssignmentOpen] = useState(false);
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [assignSkillOpen, setAssignSkillOpen] = useState(false);

  // Search
  const [studentSearch, setStudentSearch] = useState("");

  // Chat
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [threadOpenByPost, setThreadOpenByPost] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [repliesByPost, setRepliesByPost] = useState({});

  // Copy code feedback
  const [codeCopied, setCodeCopied] = useState(false);

  // Vocab Jam
  const [createJamOpen, setCreateJamOpen] = useState(false);
  const [jamWordSetId, setJamWordSetId] = useState(VOCAB_JAM_WORD_SETS[0].id);
  const [jamCreating, setJamCreating] = useState(false);
  const [jamCreated, setJamCreated] = useState(null); // { jamId, code, wordSetName } after creation
  const [pastJams, setPastJams] = useState([]); // [{ jamId, code, wordSetId, wordSetName, classId, createdAt }]

  // Challenges
  const [challenges, setChallenges] = useState([]);
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  const [completedChallengeIds, setCompletedChallengeIds] = useState(new Set());
  const [rankTitles, setRankTitles] = useState(DEFAULT_CLASS_RANK_TITLES);
  const [rankSaving, setRankSaving] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    goalDescription: "",
    targetValue: "100",
    metric: "flashcards_reviewed",
    deadline: "",
    rewardCoins: "50",
  });

  // New class form
  const [classForm, setClassForm] = useState({ name: "", subject: "Biology", grade: "10th", description: "" });

  // New assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    title: "", type: "assignment", instructions: "", dueDate: "", points: "100", attachmentUrl: "",
  });

  // New resource form
  const [resourceForm, setResourceForm] = useState({ title: "", type: "link", url: "", content: "" });

  // Assign skill form (subjectId, topicId, skillId from PRACTICE_SUBJECTS; assignedTo: "class" | string[]; dueDate)
  const [skillAssignForm, setSkillAssignForm] = useState({
    subjectId: PRACTICE_SUBJECTS[0]?.id ?? "",
    topicId: "",
    skillId: "",
    assignedTo: "class",
    studentIds: [],
    dueDate: "",
  });

  const selectedClass = classes.find(c => c.id === selectedId) ?? null;
  const selectedIdx = classes.findIndex(c => c.id === selectedId);
  const color = selectedIdx >= 0 ? getColor(selectedIdx) : getColor(0);
  const classPosts = selectedClass?.messages ?? [];

  useEffect(() => {
    if (!selectedId) return;
    loadClassPosts(selectedId);
    loadClassMembers(selectedId);
    loadChallenges(selectedId);
    loadRankTitles(selectedId);
    setCompletedChallengeIds(new Set());
  }, [selectedId]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function loadClassPosts(classId) {
    try {
      const { data } = await axios.get(`${API_BASE}/api/classes/${classId}/posts`);
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, messages: data } : c));
    } catch {
      toast.error("Failed to load class feed");
    }
  }

  async function loadClassMembers(classId) {
    try {
      const { data } = await axios.get(`${API_BASE}/api/classes/${classId}/members`);
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: data } : c));
    } catch {
      toast.error("Failed to load class members");
    }
  }

  async function loadRankTitles(classId) {
    setRankTitles({ ...DEFAULT_CLASS_RANK_TITLES });
    try {
      const { data } = await axios.get(`${API_BASE}/api/classes/${classId}/ranks`);
      setRankTitles(data);
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, ranks: data } : c));
    } catch {
      toast.error("Failed to load rank titles");
    }
  }

  async function handleSaveRankTitles() {
    if (!selectedId) return;
    setRankSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(rankTitles).map(([key, value]) => [key, value.trim() || DEFAULT_CLASS_RANK_TITLES[key]])
      );
      const { data } = await axios.patch(`${API_BASE}/api/classes/${selectedId}/ranks`, payload);
      setRankTitles(data);
      setClasses(prev => prev.map(c => c.id === selectedId ? { ...c, ranks: data } : c));
      toast.success("Rank titles updated");
    } catch {
      toast.error("Failed to save rank titles");
    } finally {
      setRankSaving(false);
    }
  }

  function isImageAttachment(attachment) {
    return attachment?.mime_type?.startsWith("image/");
  }

  function getReactionSummary(post, emoji) {
    const count = (post.reactions ?? []).filter(reaction => reaction.emoji === emoji).length;
    const reacted = (post.current_user_reactions ?? []).includes(emoji);
    return { count, reacted };
  }

  function formatMuteUntil(value) {
    if (!value) return "";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    toast.success("Class code copied!");
  }

  async function handleCreateClass() {
    if (!classForm.name.trim()) { toast.error("Class name is required"); return; }
    try {
      const created = await createClass(user?.id, {
        name: classForm.name.trim(),
        subject: classForm.subject,
        grade_level: classForm.grade,
      });
      const newCls = {
        ...created,
        grade: created.grade_level,
        description: classForm.description,
        created: new Date(created.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        students: [],
        assignments: [],
        resources: [],
        messages: [],
        activity: [],
        assignedSkills: [],
        avgGrade: null,
        completionRate: 0,
      };
      setClasses(prev => [...prev, newCls]);
      setSelectedId(newCls.id);
      setActiveTab("overview");
      setNewClassOpen(false);
      setClassForm({ name: "", subject: "Biology", grade: "10th", description: "" });
      toast.success(`Class created! Code: ${created.join_code}`);
    } catch (err) {
      toast.error(err?.message || "Failed to create class");
    }
  }

  function handleCreateAssignment() {
    if (!assignmentForm.title.trim()) { toast.error("Title is required"); return; }
    if (!assignmentForm.dueDate) { toast.error("Due date is required"); return; }
    const newAsgn = {
      id: `asgn_${Date.now()}`,
      title: assignmentForm.title.trim(),
      type: assignmentForm.type,
      classId: selectedId,
      dueDate: assignmentForm.dueDate,
      instructions: assignmentForm.instructions,
      points: parseInt(assignmentForm.points) || 100,
      attachmentUrl: assignmentForm.attachmentUrl,
      status: "active",
      submissionsReceived: 0,
      totalStudents: selectedClass?.students?.length ?? 0,
      avgGrade: null,
      pendingReview: 0,
    };
    setClasses(prev => prev.map(c =>
      c.id === selectedId ? { ...c, assignments: [...c.assignments, newAsgn] } : c
    ));
    setNewAssignmentOpen(false);
    setAssignmentForm({ title: "", type: "assignment", instructions: "", dueDate: "", points: "100", attachmentUrl: "" });
    toast.success("Assignment created!");
  }

  function handleAddResource() {
    if (!resourceForm.title.trim()) { toast.error("Title is required"); return; }
    const newRes = {
      id: `res_${Date.now()}`,
      title: resourceForm.title.trim(),
      type: resourceForm.type,
      url: resourceForm.url || "#",
      content: resourceForm.content,
      author: teacherProfile.name,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    setClasses(prev => prev.map(c =>
      c.id === selectedId ? { ...c, resources: [...c.resources, newRes] } : c
    ));
    setAddResourceOpen(false);
    setResourceForm({ title: "", type: "link", url: "", content: "" });
    toast.success("Resource added!");
  }

  function handleDeleteResource(resId) {
    setClasses(prev => prev.map(c =>
      c.id === selectedId ? { ...c, resources: c.resources.filter(r => r.id !== resId) } : c
    ));
    toast.success("Resource removed");
  }

  async function handleRemoveStudent(studentId) {
    if (!selectedId) return;
    try {
      await axios.post(`${API_BASE}/api/classes/${selectedId}/members/${studentId}/remove`);
      setClasses(prev => prev.map(c =>
        c.id === selectedId ? { ...c, students: c.students.filter(s => s.id !== studentId) } : c
      ));
      toast.success("Student removed from class");
    } catch {
      toast.error("Failed to remove student");
    }
  }

  async function handleMuteStudent(studentId) {
    if (!selectedId) return;
    try {
      const { data } = await axios.post(`${API_BASE}/api/classes/${selectedId}/members/${studentId}/mute`);
      setClasses(prev => prev.map(c =>
        c.id === selectedId
          ? {
              ...c,
              students: c.students.map(student =>
                student.id === studentId ? { ...student, mutedUntil: data.mutedUntil } : student
              ),
            }
          : c
      ));
      toast.success("Student muted for 24 hours");
    } catch {
      toast.error("Failed to mute student");
    }
  }

  async function handleAttachmentSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingAttachment(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/uploads`, formData);
      setPendingAttachments(prev => [...prev, data]);
      toast.success("Attachment uploaded");
    } catch {
      toast.error("Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
      event.target.value = "";
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() && pendingAttachments.length === 0) return;
    try {
      const { data } = await axios.post(`${API_BASE}/api/classes/${selectedId}/posts`, {
        content: newMessage.trim(),
        attachments: pendingAttachments,
        authorId: "teacher_demo_001",
        authorName: teacherProfile.name,
        isTeacher: true,
      });
      setClasses(prev => prev.map(c =>
        c.id === selectedId ? { ...c, messages: [data, ...(c.messages ?? [])] } : c
      ));
      setNewMessage("");
      setPendingAttachments([]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error("Failed to post announcement");
    }
  }

  function handleTogglePin(msgId) {
    setClasses(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m) }
        : c
    ));
  }

  async function handleToggleReaction(postId, emoji) {
    try {
      const { data } = await axios.post(`${API_BASE}/api/posts/${postId}/react`, { emoji });
      setClasses(prev => prev.map(c =>
        c.id === selectedId
          ? { ...c, messages: c.messages.map(message => message.id === postId ? data : message) }
          : c
      ));
    } catch {
      toast.error("Failed to update reaction");
    }
  }

  async function handleToggleThread(postId) {
    const nextOpen = !threadOpenByPost[postId];
    setThreadOpenByPost(prev => ({ ...prev, [postId]: nextOpen }));
    if (nextOpen && !repliesByPost[postId]) {
      try {
        const { data } = await axios.get(`${API_BASE}/api/posts/${postId}/replies`);
        setRepliesByPost(prev => ({ ...prev, [postId]: data }));
      } catch {
        toast.error("Failed to load replies");
      }
    }
  }

  async function handleReplySubmit(postId) {
    const content = replyDrafts[postId]?.trim();
    if (!content) return;
    try {
      const { data } = await axios.post(`${API_BASE}/api/posts/${postId}/replies`, { content });
      const nextReplies = [...(repliesByPost[postId] ?? []), data];
      setRepliesByPost(prev => ({ ...prev, [postId]: nextReplies }));
      setReplyDrafts(prev => ({ ...prev, [postId]: "" }));
      setClasses(prev => prev.map(c =>
        c.id === selectedId
          ? {
              ...c,
              messages: c.messages.map(message =>
                message.id === postId ? { ...message, reply_count: nextReplies.length } : message
              ),
            }
          : c
      ));
    } catch {
      toast.error("Failed to post reply");
    }
  }

  function handleAssignSkill() {
    const subject = PRACTICE_SUBJECTS.find(s => s.id === skillAssignForm.subjectId);
    const topic = subject?.topics?.find(t => t.id === skillAssignForm.topicId);
    const skill = topic?.skills?.find(sk => sk.id === skillAssignForm.skillId);
    if (!subject || !topic || !skill) {
      toast.error("Please select a subject, topic, and skill");
      return;
    }
    const assignedTo = skillAssignForm.assignedTo === "class" ? "class" : skillAssignForm.studentIds;
    if (skillAssignForm.assignedTo !== "class" && (!assignedTo || assignedTo.length === 0)) {
      toast.error("Select at least one student or assign to whole class");
      return;
    }
    const newEntry = {
      id: `asgn_skill_${Date.now()}`,
      skillId: skill.id,
      skillName: skill.name,
      subjectName: subject.name,
      subjectColor: subject.color ?? "#e8722a",
      topicName: topic.name,
      assignedTo,
      dueDate: skillAssignForm.dueDate || null,
      assignedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    setClasses(prev => prev.map(c =>
      c.id === selectedId ? { ...c, assignedSkills: [...(c.assignedSkills ?? []), newEntry] } : c
    ));
    setAssignSkillOpen(false);
    setSkillAssignForm({
      subjectId: PRACTICE_SUBJECTS[0]?.id ?? "",
      topicId: "",
      skillId: "",
      assignedTo: "class",
      studentIds: [],
      dueDate: "",
    });
    toast.success("Practice skill assigned!");
  }

  function handleRemoveAssignedSkill(entryId) {
    setClasses(prev => prev.map(c =>
      c.id === selectedId ? { ...c, assignedSkills: (c.assignedSkills ?? []).filter(as => as.id !== entryId) } : c
    ));
    toast.success("Skill assignment removed");
  }

  async function loadChallenges(classId) {
    try {
      const { data } = await axios.get(`${API_BASE}/api/challenges/class/${classId}`);
      const newlyCompleted = new Set();
      for (const c of data) {
        if (c.currentValue >= c.targetValue && !c.rewardedAt) {
          await axios.post(`${API_BASE}/api/challenges/${c.challenge_id}/complete`);
          c.completed = true;
          c.rewardedAt = new Date().toISOString();
          newlyCompleted.add(c.challenge_id);
        }
      }
      setChallenges(data);
      if (newlyCompleted.size > 0) {
        setCompletedChallengeIds(prev => new Set([...prev, ...newlyCompleted]));
      }
    } catch {
      // silently fail — challenges are non-critical
    }
  }

  async function handleCreateChallenge() {
    if (!challengeForm.title.trim()) { toast.error("Title is required"); return; }
    if (!challengeForm.deadline) { toast.error("Deadline is required"); return; }
    if (!selectedId) return;
    try {
      const { data } = await axios.post(`${API_BASE}/api/challenges`, {
        classId: selectedId,
        title: challengeForm.title.trim(),
        goalDescription: challengeForm.goalDescription.trim(),
        targetValue: parseInt(challengeForm.targetValue) || 100,
        metric: challengeForm.metric,
        deadline: challengeForm.deadline,
        rewardCoins: parseInt(challengeForm.rewardCoins) || 50,
      });
      setChallenges(prev => [...prev, data]);
      setCreateChallengeOpen(false);
      setChallengeForm({ title: "", goalDescription: "", targetValue: "100", metric: "flashcards_reviewed", deadline: "", rewardCoins: "50" });
      toast.success("Class challenge created!");
    } catch {
      toast.error("Failed to create challenge");
    }
  }

  async function handleCreateJam() {
    if (!selectedId) return;
    setJamCreating(true);
    try {
      const res = await axios.post(`${API_BASE}/api/jams/create`, { classId: selectedId, wordSetId: jamWordSetId });
      const { jamId, code, wordSet } = res.data;
      const entry = { jamId, code, wordSetId: jamWordSetId, wordSetName: wordSet.name, classId: selectedId, createdAt: new Date().toLocaleString() };
      setJamCreated({ jamId, code, wordSetName: wordSet.name });
      setPastJams(prev => [entry, ...prev]);
    } catch {
      toast.error("Failed to create jam");
    } finally {
      setJamCreating(false);
    }
  }

  async function handleRunAgain(entry) {
    try {
      const res = await axios.post(`${API_BASE}/api/jams/create`, { classId: selectedId, wordSetId: entry.wordSetId });
      const { jamId, code, wordSet } = res.data;
      const newEntry = { jamId, code, wordSetId: entry.wordSetId, wordSetName: wordSet.name, classId: selectedId, createdAt: new Date().toLocaleString() };
      setPastJams(prev => [newEntry, ...prev]);
      toast.success(`New jam ready! Code: ${code}`);
    } catch {
      toast.error("Failed to create jam");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 overflow-hidden">

      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
      <div className="w-60 shrink-0 flex flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-sm">My Classes</h2>
            <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">Teacher</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setNewClassOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Class
          </Button>
        </div>

        {/* Class list */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-0.5">
            {classes.map((cls, idx) => {
              const c = getColor(idx);
              const isActive = cls.id === selectedId;
              return (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedId(cls.id); setActiveTab("overview"); setStudentSearch(""); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${c.dot}`} />
                  <span className="flex-1 text-sm truncate font-medium">{cls.name}</span>
                  <span className="text-sm md:text-xs text-muted-foreground shrink-0">{cls.students?.length ?? 0}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Join Code chip */}
        {selectedClass && (
          <div className="p-3 border-t border-border">
            <p className="text-sm md:text-xs text-muted-foreground uppercase font-medium mb-1.5">Class Code</p>
            <button
              onClick={() => copyCode(selectedClass.join_code)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors group"
            >
              <span className="font-mono text-sm font-semibold tracking-wide">{selectedClass.join_code}</span>
              {codeCopied
                ? <Check className="w-3.5 h-3.5 text-green-500" />
                : <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              }
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedClass ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            {/* Colored class header */}
            <div className={`bg-gradient-to-r ${color.gradient} px-5 pt-4 pb-0 text-[var(--text-primary)] shrink-0`}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h1 className="font-heading text-xl font-bold">{selectedClass.name}</h1>
                  <p className="text-[color:color-mix(in_srgb,var(--text-primary)_75%,transparent)] text-sm md:text-xs mt-0.5">{selectedClass.subject} · {selectedClass.grade} Grade · {selectedClass.students?.length ?? 0} students</p>
                </div>
              </div>
              <TabsList className="bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] border-0 mt-3 h-9 rounded-t-lg rounded-b-none gap-0 px-0">
                <TabsTrigger value="overview"    className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] rounded-none rounded-tl-lg h-9 px-4">Overview</TabsTrigger>
                <TabsTrigger value="students"    className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] rounded-none h-9 px-4">Students</TabsTrigger>
                <TabsTrigger value="assignments" className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] rounded-none h-9 px-4">Assignments</TabsTrigger>
                <TabsTrigger value="resources"   className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] rounded-none h-9 px-4">Resources</TabsTrigger>
                <TabsTrigger value="skills"      className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] rounded-none h-9 px-4">Skills</TabsTrigger>
                <TabsTrigger value="chat"        className="text-sm md:text-xs text-[color:color-mix(in_srgb,var(--text-primary)_70%,transparent)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] rounded-none h-9 px-4">Chat</TabsTrigger>
              </TabsList>
            </div>

            {/* ── OVERVIEW ── */}
            <TabsContent value="overview" className="flex-1 overflow-auto p-5 mt-0">
              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Total Students", value: selectedClass.students?.length ?? 0, icon: Users, light: "bg-blue-500/10", iconColor: "text-blue-500" },
                  { label: "Avg Grade",      value: selectedClass.avgGrade ? `${selectedClass.avgGrade}%` : "N/A", icon: Award,  light: "bg-brand-deep/10", iconColor: "text-brand-deep" },
                  { label: "Assignments",    value: selectedClass.assignments?.length ?? 0, icon: ClipboardList, light: "bg-brand-orange/10", iconColor: "text-brand-orange" },
                  { label: "Completion Rate", value: `${selectedClass.completionRate}%`, icon: TrendingUp, light: "bg-green-500/10", iconColor: "text-green-500" },
                ].map(stat => (
                  <Card key={stat.label} className="border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${stat.light} flex items-center justify-center shrink-0`}>
                        <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-sm md:text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rank titles</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize the 5 default class rank names used in class-specific rank views.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {CLASS_RANK_LEVELS.map((rank) => (
                      <div key={rank.key} className="space-y-2">
                        <Label htmlFor={`rank-${rank.key}`}>{rank.label}</Label>
                        <Input
                          id={`rank-${rank.key}`}
                          value={rankTitles[rank.key] ?? ""}
                          onChange={(e) =>
                            setRankTitles((prev) => ({ ...prev, [rank.key]: e.target.value }))
                          }
                          placeholder={DEFAULT_CLASS_RANK_TITLES[rank.key]}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveRankTitles} disabled={rankSaving}>
                      {rankSaving ? "Saving..." : "Save rank titles"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Recent Activity */}
                <div>
                  <h3 className="font-heading font-semibold text-sm mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {(selectedClass.activity ?? []).map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === "submission" ? "bg-green-500/10" :
                          item.type === "join" ? "bg-blue-500/10" : "bg-secondary"
                        }`}>
                          {item.type === "submission" && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                          {item.type === "join" && <Users className="w-3.5 h-3.5 text-blue-500" />}
                          {item.type === "message" && <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">{item.text}</p>
                          <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    ))}
                    {(!selectedClass.activity || selectedClass.activity.length === 0) && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-heading font-semibold text-sm mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => {
                        setActiveTab("chat");
                        setTimeout(() => setNewMessage("📢 Announcement: "), 100);
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4 text-brand-orange" />
                      </div>
                      Post Announcement
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => { setActiveTab("assignments"); setNewAssignmentOpen(true); }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-deep/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-brand-deep" />
                      </div>
                      Create Assignment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => { setActiveTab("resources"); setAddResourceOpen(true); }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      Upload Resource
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => { setActiveTab("skills"); setAssignSkillOpen(true); }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-brand-orange" />
                      </div>
                      Assign Practice Skill
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => { setJamCreated(null); setJamWordSetId(VOCAB_JAM_WORD_SETS[0].id); setCreateJamOpen(true); }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-deep/10 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 text-brand-deep" />
                      </div>
                      Create Vocab Jam
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => setCreateChallengeOpen(true)}
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 text-orange-500" />
                      </div>
                      Create Class Challenge
                    </Button>
                  </div>

                  {/* Completion bar */}
                  {selectedClass.completionRate != null && (
                    <div className="mt-5 p-4 rounded-xl border bg-card">
                      <div className="flex justify-between text-sm md:text-xs mb-2">
                        <span className="font-medium">Assignment Completion</span>
                        <span className="text-muted-foreground">{selectedClass.completionRate}%</span>
                      </div>
                      <Progress value={selectedClass.completionRate} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
              {/* ── Active Class Challenge ── */}
              {challenges.filter(c => c.classId === selectedId).length > 0 && (
                <div className="mt-5">
                  <h3 className="font-heading font-semibold text-sm mb-3">Class Challenges</h3>
                  <div className="space-y-3">
                    {challenges.filter(c => c.classId === selectedId).map(c => {
                      const pct = Math.min(100, Math.round((c.currentValue / c.targetValue) * 100));
                      const isComplete = c.currentValue >= c.targetValue;
                      const isNewlyCompleted = completedChallengeIds.has(c.challenge_id);
                      const daysLeft = c.deadline
                        ? Math.ceil((new Date(c.deadline) - Date.now()) / 86400000)
                        : null;
                      const metricLabel = {
                        flashcards_reviewed: "Flashcards Reviewed",
                        quiz_questions_answered: "Quiz Questions Answered",
                        practice_sessions: "Practice Sessions Completed",
                        total_xp: "Total XP Earned",
                      }[c.metric] ?? c.metric;
                      return (
                        <div
                          key={c.challenge_id}
                          className={`rounded-xl border p-4 ${isComplete ? "bg-green-500/5 border-green-500/30" : "bg-card"}`}
                        >
                          {isNewlyCompleted && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                              <Trophy className="w-4 h-4 text-green-500 shrink-0" />
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                Challenge complete! {c.rewardCoins} coins awarded to all students.
                              </p>
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                                <Trophy className={`w-3.5 h-3.5 ${isComplete ? "text-green-500" : "text-orange-500"}`} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-tight">{c.title}</p>
                                {c.goalDescription && (
                                  <p className="text-sm md:text-xs text-muted-foreground">{c.goalDescription}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm md:text-xs font-medium text-orange-500">{c.rewardCoins} coins</p>
                              {daysLeft !== null && !isComplete && (
                                <p className={`text-sm md:text-xs ${daysLeft <= 2 ? "text-red-500" : "text-muted-foreground"}`}>
                                  {daysLeft > 0 ? `${daysLeft}d left` : "Deadline passed"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-sm md:text-xs mb-1.5">
                              <span className="text-muted-foreground">{metricLabel}</span>
                              <span className="font-medium">{c.currentValue} / {c.targetValue}</span>
                            </div>
                            <Progress value={pct} className={`h-2 ${isComplete ? "[&>div]:bg-green-500" : "[&>div]:bg-orange-500"}`} />
                            <p className="text-sm md:text-xs text-right mt-1 text-muted-foreground">{pct}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Vocab Jams */}
              {pastJams.filter(j => j.classId === selectedId).length > 0 && (
                <div className="mt-5">
                  <h3 className="font-heading font-semibold text-sm mb-3">Past Vocab Jams</h3>
                  <div className="space-y-2">
                    {pastJams.filter(j => j.classId === selectedId).map(jam => (
                      <div key={jam.jamId} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="w-7 h-7 rounded-full bg-brand-deep/10 flex items-center justify-center shrink-0">
                          <Radio className="w-3.5 h-3.5 text-brand-deep" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{jam.wordSetName}</p>
                          <p className="text-sm md:text-xs text-muted-foreground font-mono">{jam.code} · {jam.createdAt}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-sm md:text-xs shrink-0"
                          onClick={() => handleRunAgain(jam)}
                        >
                          Run again
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── STUDENTS ── */}
            <TabsContent value="students" className="flex-1 overflow-auto p-5 mt-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="pl-9"
                  />
                </div>
                <span className="text-sm text-muted-foreground">{selectedClass.students?.length ?? 0} students</span>
              </div>

              {selectedClass.students?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                    <Users className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">No students yet</p>
                  <p className="text-sm text-muted-foreground">Share your class code to get students!</p>
                  <button
                    onClick={() => copyCode(selectedClass.join_code)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" /> Copy Code: {selectedClass.join_code}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-secondary/30">
                        <th className="text-left p-3 text-sm md:text-xs font-medium text-muted-foreground">Student</th>
                        <th className="text-left p-3 text-sm md:text-xs font-medium text-muted-foreground hidden md:table-cell">Grade</th>
                        <th className="text-left p-3 text-sm md:text-xs font-medium text-muted-foreground hidden lg:table-cell">Last Active</th>
                        <th className="text-left p-3 text-sm md:text-xs font-medium text-muted-foreground">Avg Grade</th>
                        <th className="text-left p-3 text-sm md:text-xs font-medium text-muted-foreground">Status</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.students
                        .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                        .map(student => (
                          <tr key={student.id} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-sm md:text-xs">
                                    {student.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{student.name}</p>
                                  <p className="text-sm md:text-xs text-muted-foreground hidden sm:block">{student.grade} grade</p>
                                  {student.mutedUntil && (
                                    <p className="text-sm md:text-[11px] text-brand-deep hidden sm:block">
                                      Muted until {formatMuteUntil(student.mutedUntil)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 hidden md:table-cell">
                              <span className="font-medium">{student.currentGrade}</span>
                            </td>
                            <td className="p-3 text-muted-foreground hidden lg:table-cell">{student.lastActive}</td>
                            <td className="p-3">
                              <span className="font-medium">{student.currentGrade}</span>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={student.status} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-sm md:text-xs"
                                  onClick={() => toast.info("Student messaging coming soon!")}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleMuteStudent(student.id)}>
                                      Mute (can't post for 24h)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleRemoveStudent(student.id)}
                                    >
                                      Remove from class
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── ASSIGNMENTS ── */}
            <TabsContent value="assignments" className="flex-1 overflow-auto p-5 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">{selectedClass.assignments?.length ?? 0} Assignments</h3>
                <Dialog open={newAssignmentOpen} onOpenChange={setNewAssignmentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> New Assignment</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                          value={assignmentForm.title}
                          onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="Assignment title"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Type</Label>
                          <select
                            value={assignmentForm.type}
                            onChange={e => setAssignmentForm(p => ({ ...p, type: e.target.value }))}
                            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            {ASSIGNMENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={assignmentForm.points}
                            onChange={e => setAssignmentForm(p => ({ ...p, points: e.target.value }))}
                            placeholder="100"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={assignmentForm.dueDate}
                          onChange={e => setAssignmentForm(p => ({ ...p, dueDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Instructions</Label>
                        <Textarea
                          value={assignmentForm.instructions}
                          onChange={e => setAssignmentForm(p => ({ ...p, instructions: e.target.value }))}
                          placeholder="Describe the assignment..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Attachment URL (optional)</Label>
                        <Input
                          value={assignmentForm.attachmentUrl}
                          onChange={e => setAssignmentForm(p => ({ ...p, attachmentUrl: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <Button onClick={handleCreateAssignment} className="w-full">Create Assignment</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {(selectedClass.assignments ?? []).map(asgn => (
                  <div key={asgn.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm">{asgn.title}</p>
                          <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{asgn.type}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm md:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {asgn.dueDate}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {asgn.submissionsReceived}/{asgn.totalStudents} submitted</span>
                          {asgn.avgGrade && <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Avg {asgn.avgGrade}%</span>}
                        </div>
                      </div>
                      <StatusBadge status={asgn.status} />
                    </div>
                    {asgn.totalStudents > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm md:text-xs text-muted-foreground mb-1">
                          <span>Submissions</span>
                          <span>{Math.round((asgn.submissionsReceived / asgn.totalStudents) * 100)}%</span>
                        </div>
                        <Progress value={(asgn.submissionsReceived / asgn.totalStudents) * 100} className="h-1.5" />
                      </div>
                    )}
                  </div>
                ))}
                {(!selectedClass.assignments || selectedClass.assignments.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">No assignments yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Create your first assignment to get started</p>
                    <Button size="sm" onClick={() => setNewAssignmentOpen(true)}>
                      <Plus className="w-4 h-4 mr-1.5" /> New Assignment
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── RESOURCES ── */}
            <TabsContent value="resources" className="flex-1 overflow-auto p-5 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">{selectedClass.resources?.length ?? 0} Resources</h3>
                <Dialog open={addResourceOpen} onOpenChange={setAddResourceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> Add Resource</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                          value={resourceForm.title}
                          onChange={e => setResourceForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="Resource title"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <select
                          value={resourceForm.type}
                          onChange={e => setResourceForm(p => ({ ...p, type: e.target.value }))}
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          {RESOURCE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                      </div>
                      {resourceForm.type !== "note" && (
                        <div className="space-y-1.5">
                          <Label>URL</Label>
                          <Input
                            value={resourceForm.url}
                            onChange={e => setResourceForm(p => ({ ...p, url: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                      )}
                      {resourceForm.type === "note" && (
                        <div className="space-y-1.5">
                          <Label>Content</Label>
                          <Textarea
                            value={resourceForm.content}
                            onChange={e => setResourceForm(p => ({ ...p, content: e.target.value }))}
                            placeholder="Write your note..."
                            rows={4}
                          />
                        </div>
                      )}
                      <Button onClick={handleAddResource} className="w-full">Add Resource</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {(selectedClass.resources ?? []).map(res => (
                  <div key={res.id} className="rounded-xl border bg-card p-4 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      res.type === "pdf" ? "bg-red-500/10" : res.type === "link" ? "bg-blue-500/10" : "bg-secondary"
                    }`}>
                      {res.type === "pdf"
                        ? <FileText className="w-4.5 h-4.5 text-red-500" />
                        : res.type === "link"
                        ? <LinkIcon className="w-4.5 h-4.5 text-blue-500" />
                        : <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{res.title}</p>
                      <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{res.author} · {res.date}</p>
                      <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase mt-1 inline-block">{res.type}</span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {res.url && res.url !== "#" && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                          <a href={res.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteResource(res.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!selectedClass.resources || selectedClass.resources.length === 0) && (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">No resources yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Upload study guides, links, or notes for your students</p>
                    <Button size="sm" onClick={() => setAddResourceOpen(true)}>
                      <Plus className="w-4 h-4 mr-1.5" /> Add Resource
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── SKILLS (Practice) ── */}
            <TabsContent value="skills" className="flex-1 overflow-auto p-5 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">{selectedClass.assignedSkills?.length ?? 0} Practice Skills</h3>
                <Button size="sm" onClick={() => setAssignSkillOpen(true)}>
                  <Zap className="w-4 h-4 mr-1.5" /> Assign Skill
                </Button>
              </div>

              {(selectedClass.assignedSkills?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-brand-orange" />
                  </div>
                  <p className="font-medium mb-1">No practice skills assigned yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Assign skills from the Practice hub so students know what to work on</p>
                  <Button size="sm" onClick={() => setAssignSkillOpen(true)}>
                    <Zap className="w-4 h-4 mr-1.5" /> Assign Skill
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedClass.assignedSkills ?? []).map((as) => (
                    <div key={as.id} className="rounded-xl border bg-card p-4 flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg"
                        style={{ background: `${as.subjectColor}20`, color: as.subjectColor }}
                      >
                        {PRACTICE_SUBJECTS.find(s => s.name === as.subjectName)?.icon ?? "📚"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{as.skillName}</p>
                        <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{as.subjectName} · {as.topicName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-sm md:text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {as.assignedTo === "class" ? "Whole class" : `${as.assignedTo.length} student(s)`}
                          </span>
                          {as.dueDate && (
                            <span className="text-sm md:text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Due {as.dueDate}
                            </span>
                          )}
                          <span className="text-sm md:text-xs text-muted-foreground">Assigned {as.assignedAt}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveAssignedSkill(as.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── CLASS CHAT ── */}
            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex">
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {classPosts.map(msg => (
                    <div key={msg.id} className={`group rounded-lg ${msg.pinned ? "bg-brand-orange/5 border border-brand-orange/20 p-2" : ""}`}>
                      {msg.pinned && (
                        <div className="absolute">
                          <Pin className="w-3 h-3 text-brand-orange rotate-45 -mt-1 ml-1" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className={`text-sm md:text-xs ${msg.isTeacher ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                            {(msg.sender || msg.authorName).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm">{msg.sender || msg.authorName}</span>
                            {msg.isTeacher && (
                              <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Teacher</span>
                            )}
                            {msg.pinned && (
                              <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-deep font-medium">Pinned</span>
                            )}
                            <span className="text-sm md:text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.text || msg.content}</p>
                          {(msg.attachments ?? []).length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.attachments.map((attachment) => (
                                <div key={`${msg.id}-${attachment.url}`} className="rounded-lg border bg-secondary/20 p-2">
                                  {isImageAttachment(attachment) ? (
                                    <div className="space-y-2">
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-h-56 rounded-md border object-cover"
                                      />
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm md:text-xs text-primary"
                                      >
                                        {attachment.name}
                                      </a>
                                    </div>
                                  ) : (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary"
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>{attachment.name}</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {REACTION_EMOJIS.map((emoji) => {
                              const { count, reacted } = getReactionSummary(msg, emoji);
                              return (
                                <button
                                  key={`${msg.id}-${emoji}`}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm md:text-xs transition-colors ${
                                    reacted
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleToggleThread(msg.id)}
                              className="text-sm md:text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              Reply{msg.reply_count ? ` (${msg.reply_count})` : ""}
                            </button>
                          </div>

                          {threadOpenByPost[msg.id] && (
                            <div className="mt-3 rounded-lg border bg-secondary/10 p-3 space-y-3">
                              {(repliesByPost[msg.id] ?? []).length > 0 ? (
                                <div className="space-y-3">
                                  {(repliesByPost[msg.id] ?? []).map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-2.5">
                                      <Avatar className="w-7 h-7 shrink-0">
                                        <AvatarFallback className={`text-sm md:text-[10px] ${reply.isTeacher ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                                          {reply.user_name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">{reply.user_name}</span>
                                          {reply.isTeacher && (
                                            <span className="text-sm md:text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Teacher</span>
                                          )}
                                        </div>
                                        <p className="text-sm">{reply.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No replies yet</p>
                              )}

                              <div className="flex gap-2">
                                <Input
                                  value={replyDrafts[msg.id] ?? ""}
                                  onChange={e => setReplyDrafts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                  placeholder="Write a reply..."
                                />
                                <Button type="button" size="sm" onClick={() => handleReplySubmit(msg.id)}>
                                  Reply
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
                          title={msg.pinned ? "Unpin" : "Pin"}
                        >
                          <Pin className={`w-3.5 h-3.5 ${msg.pinned ? "text-brand-orange" : "text-muted-foreground"}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border shrink-0">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto space-y-3">
                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pendingAttachments.map((attachment) => (
                        <div key={attachment.url} className="inline-flex items-center gap-2 rounded-full border bg-secondary/20 px-3 py-1 text-sm md:text-xs">
                          <span>{attachment.name}</span>
                          <button
                            type="button"
                            onClick={() => setPendingAttachments(prev => prev.filter(item => item.url !== attachment.url))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedClass.name}...`}
                      className="flex-1"
                    />
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleAttachmentSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={uploadingAttachment}
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button type="submit" size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        ) : classes.length === 0 ? (
          /* ── NO CLASSES YET ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">Create your first class</h2>
              <p className="text-muted-foreground text-sm mb-6">Set up a class, generate a join code, and invite your students to get started.</p>
              <Button onClick={() => setNewClassOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Class
              </Button>
            </div>
          </div>
        ) : (
          /* ── NO CLASS SELECTED ── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <School className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-1">Select a class</h2>
              <p className="text-muted-foreground text-sm">Choose a class from the sidebar to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL (xl+) ──────────────────────────────────────────── */}
      {selectedClass && (
        <div className="hidden xl:flex xl:flex-col w-[260px] shrink-0 border-l border-border bg-card overflow-y-auto">
          {/* Join Code */}
          <div className="p-4 border-b border-border">
            <p className="text-sm md:text-xs font-medium text-muted-foreground uppercase mb-2">Join Code</p>
            <button
              onClick={() => copyCode(selectedClass.join_code)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors group"
            >
              <span className="font-mono text-lg font-bold tracking-widest">{selectedClass.join_code}</span>
              {codeCopied
                ? <Check className="w-4 h-4 text-green-500" />
                : <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              }
            </button>
            <p className="text-sm md:text-xs text-muted-foreground mt-2 text-center">Share this code with your students</p>
          </div>

          {/* Class Info */}
          <div className="p-4 border-b border-border">
            <p className="text-sm md:text-xs font-medium text-muted-foreground uppercase mb-3">Class Info</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-medium">{selectedClass.subject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Grade</span>
                <span className="font-medium">{selectedClass.grade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{selectedClass.created}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">{selectedClass.students?.length ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Students */}
          <div className="p-4 border-b border-border">
            <p className="text-sm md:text-xs font-medium text-muted-foreground uppercase mb-3">Recent Students</p>
            {selectedClass.students?.length === 0 ? (
              <p className="text-sm md:text-xs text-muted-foreground">No students yet</p>
            ) : (
              <div className="space-y-2">
                {selectedClass.students.slice(0, 4).map(s => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm md:text-xs">
                        {s.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{s.name}</p>
                      <p className="text-sm md:text-xs text-muted-foreground">
                        {s.mutedUntil ? `Muted until ${formatMuteUntil(s.mutedUntil)}` : s.lastActive}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="p-4">
            <p className="text-sm md:text-xs font-medium text-muted-foreground uppercase mb-3">Quick Stats</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submissions today</span>
                <span className="font-semibold">
                  {selectedClass.activity?.filter(a => a.type === "submission" && a.time.includes("hour")).length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages today</span>
                <span className="font-semibold">
                  {selectedClass.messages?.filter(m => !m.time.toLowerCase().includes("yesterday") && !m.time.includes("day")).length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active assignments</span>
                <span className="font-semibold">
                  {selectedClass.assignments?.filter(a => a.status === "active").length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending review</span>
                <span className="font-semibold text-brand-deep">
                  {selectedClass.assignments?.reduce((sum, a) => sum + (a.pendingReview ?? 0), 0) ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW CLASS DIALOG ───────────────────────────────────────────── */}
      <Dialog open={newClassOpen} onOpenChange={setNewClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create a New Class</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Class Name</Label>
              <Input
                value={classForm.name}
                onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Period 3 — Chemistry"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <select
                  value={classForm.subject}
                  onChange={e => setClassForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <select
                  value={classForm.grade}
                  onChange={e => setClassForm(p => ({ ...p, grade: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g} Grade</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={classForm.description}
                onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What will students learn in this class?"
                rows={2}
              />
            </div>
            <Button onClick={handleCreateClass} className="w-full">Create Class</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CREATE VOCAB JAM DIALOG ─────────────────────────────────────── */}
      <Dialog open={createJamOpen} onOpenChange={(open) => { setCreateJamOpen(open); if (!open) setJamCreated(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Vocab Jam</DialogTitle></DialogHeader>
          {!jamCreated ? (
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Word Set</Label>
                <select
                  value={jamWordSetId}
                  onChange={e => setJamWordSetId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {VOCAB_JAM_WORD_SETS.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name} ({ws.words.length} words)</option>
                  ))}
                </select>
              </div>
              <p className="text-sm md:text-xs text-muted-foreground">Students join via a 6-character code on the Competitions page.</p>
              <Button onClick={handleCreateJam} className="w-full" disabled={jamCreating}>
                {jamCreating ? "Creating..." : "Create Jam"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2 text-center">
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm md:text-xs text-muted-foreground mb-1">Room code</p>
                <p className="font-mono text-4xl font-bold tracking-widest">{jamCreated.code}</p>
                <p className="text-sm md:text-xs text-muted-foreground mt-1">{jamCreated.wordSetName}</p>
              </div>
              <p className="text-sm text-muted-foreground">Share this code with your students. They'll join on the Competitions page.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { navigator.clipboard.writeText(jamCreated.code).catch(() => {}); toast.success("Code copied!"); }}
                >
                  <Copy className="w-4 h-4 mr-1.5" /> Copy Code
                </Button>
                <Button className="flex-1" onClick={() => setCreateJamOpen(false)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CREATE CHALLENGE DIALOG ───────────────────────────────────────── */}
      <Dialog open={createChallengeOpen} onOpenChange={setCreateChallengeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Class Challenge</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label>Challenge title</Label>
              <Input
                placeholder="e.g. Flashcard Frenzy"
                value={challengeForm.title}
                onChange={e => setChallengeForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Goal description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. Review 500 flashcards as a class"
                value={challengeForm.goalDescription}
                onChange={e => setChallengeForm(f => ({ ...f, goalDescription: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Input
                  type="number"
                  min="1"
                  value={challengeForm.targetValue}
                  onChange={e => setChallengeForm(f => ({ ...f, targetValue: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reward (coins)</Label>
                <Input
                  type="number"
                  min="1"
                  value={challengeForm.rewardCoins}
                  onChange={e => setChallengeForm(f => ({ ...f, rewardCoins: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Metric</Label>
              <Select value={challengeForm.metric} onValueChange={v => setChallengeForm(f => ({ ...f, metric: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flashcards_reviewed">Flashcards Reviewed</SelectItem>
                  <SelectItem value="quiz_questions_answered">Quiz Questions Answered</SelectItem>
                  <SelectItem value="practice_sessions">Practice Sessions Completed</SelectItem>
                  <SelectItem value="total_xp">Total XP Earned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={challengeForm.deadline}
                onChange={e => setChallengeForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleCreateChallenge}>Create Challenge</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN SKILL DIALOG ───────────────────────────────────────────── */}
      <Dialog open={assignSkillOpen} onOpenChange={(open) => {
        setAssignSkillOpen(open);
        if (!open) {
          setSkillAssignForm({
            subjectId: PRACTICE_SUBJECTS[0]?.id ?? "",
            topicId: "",
            skillId: "",
            assignedTo: "class",
            studentIds: [],
            dueDate: "",
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Practice Skill</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <select
                value={skillAssignForm.subjectId}
                onChange={e => setSkillAssignForm(p => ({ ...p, subjectId: e.target.value, topicId: "", skillId: "" }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {PRACTICE_SUBJECTS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Topic</Label>
              <select
                value={skillAssignForm.topicId}
                onChange={e => setSkillAssignForm(p => ({ ...p, topicId: e.target.value, skillId: "" }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select topic...</option>
                {PRACTICE_SUBJECTS.find(s => s.id === skillAssignForm.subjectId)?.topics?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Skill</Label>
              <select
                value={skillAssignForm.skillId}
                onChange={e => setSkillAssignForm(p => ({ ...p, skillId: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select skill...</option>
                {PRACTICE_SUBJECTS.find(s => s.id === skillAssignForm.subjectId)?.topics?.find(t => t.id === skillAssignForm.topicId)?.skills?.map(sk => (
                  <option key={sk.id} value={sk.id}>{sk.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assign to</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignTo"
                    checked={skillAssignForm.assignedTo === "class"}
                    onChange={() => setSkillAssignForm(p => ({ ...p, assignedTo: "class", studentIds: [] }))}
                    className="rounded-full"
                  />
                  <span className="text-sm">Whole class</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignTo"
                    checked={skillAssignForm.assignedTo === "students"}
                    onChange={() => setSkillAssignForm(p => ({ ...p, assignedTo: "students" }))}
                    className="rounded-full"
                  />
                  <span className="text-sm">Specific students</span>
                </label>
                {skillAssignForm.assignedTo === "students" && (
                  <div className="pl-6 border-l-2 border-border space-y-1.5 max-h-40 overflow-y-auto">
                    {(selectedClass?.students ?? []).map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skillAssignForm.studentIds.includes(s.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSkillAssignForm(p => ({ ...p, studentIds: [...p.studentIds, s.id] }));
                            } else {
                              setSkillAssignForm(p => ({ ...p, studentIds: p.studentIds.filter(id => id !== s.id) }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{s.name}</span>
                      </label>
                    ))}
                    {(!selectedClass?.students || selectedClass.students.length === 0) && (
                      <p className="text-sm md:text-xs text-muted-foreground">No students in this class</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Due date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="date"
                value={skillAssignForm.dueDate}
                onChange={e => setSkillAssignForm(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            <Button onClick={handleAssignSkill} className="w-full">Assign Skill</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
