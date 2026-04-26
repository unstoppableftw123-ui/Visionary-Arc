import { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AuthContext, API } from "../App";
import Shop from "./Shop";
import StudyRoomList from "../components/StudyRoom/StudyRoomList";
import Leaderboard from "../components/Leaderboard";
import { toast } from "sonner";
import {
  serverSchema,
  commentSchema,
  communityNoteSchema,
  goalSchema,
  resourceSchema,
  formatZodErrors,
} from "../lib/validation";
import {
  Plus,
  Hash,
  Send,
  Users,
  LogOut,
  Crown,
  Compass,
  FolderOpen,
  Target,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Sparkles,
  GraduationCap,
  LayoutList,
  Trophy,
  ShoppingBag,
  BookOpen,
  Key,
  Star,
  CheckCircle,
  Clock,
  ChevronLeft,
  Flame,
  Search,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// ── Classes mock data ──────────────────────────────────────────────────────
const MOCK_CLASSES = [
  {
    id: 'cls1',
    name: 'AP Biology',
    teacher: 'Ms. Johnson',
    subject: 'Science',
    grade: '11th Grade',
    studentCount: 28,
    color: 'from-green-500 to-emerald-600',
    nextClass: 'Tomorrow, 9:00 AM',
    channels: [{ name: 'general', unread: 3 }, { name: 'homework', unread: 0 }],
    pendingAssignments: 2,
    announcements: [
      { id: 'a1', pinned: true, teacher: 'Ms. Johnson', time: '2 hours ago', text: "Don't forget the lab report is due Friday! Make sure to include your hypothesis, observations, and conclusion." },
      { id: 'a2', pinned: false, teacher: 'Ms. Johnson', time: 'Yesterday', text: "Great job on last week's quiz, everyone! Average was 87%. Keep it up!" },
    ],
    assignments: [
      { id: 'asgn1', title: 'Cell Division Lab Report', dueDate: 'Tomorrow, Mar 13', points: 50, status: 'pending' },
      { id: 'asgn2', title: 'Chapter 7 Reading Quiz', dueDate: 'Mar 15', points: 20, status: 'pending' },
      { id: 'asgn3', title: 'Mitosis Diagram', dueDate: 'Mar 8', points: 30, status: 'submitted' },
    ],
    resources: [
      { id: 'r1', title: 'AP Bio Study Guide 2024', author: 'Ms. Johnson', type: 'pdf', url: '#' },
      { id: 'r2', title: 'Khan Academy: Cell Biology', author: 'Ms. Johnson', type: 'link', url: '#' },
    ],
    messages: [
      { id: 'm1', sender: 'Ms. Johnson', isTeacher: true, time: '9:15 AM', text: "Morning everyone! Don't forget to bring your lab notebooks today." },
      { id: 'm2', sender: 'Alex Chen', isTeacher: false, time: '9:20 AM', text: 'Will we need colored pencils for the diagram?' },
      { id: 'm3', sender: 'Ms. Johnson', isTeacher: true, time: '9:22 AM', text: 'Yes, bring at least 4 colors.' },
    ],
  },
  {
    id: 'cls2',
    name: 'Pre-Calculus',
    teacher: 'Mr. Davis',
    subject: 'Mathematics',
    grade: '11th Grade',
    studentCount: 24,
    color: 'from-blue-500 to-orange-600',
    nextClass: 'Today, 2:00 PM',
    channels: [{ name: 'general', unread: 0 }, { name: 'q-and-a', unread: 5 }],
    pendingAssignments: 1,
    announcements: [
      { id: 'a3', pinned: true, teacher: 'Mr. Davis', time: '1 day ago', text: 'Unit 4 test moved to March 18th. Use the extra time to review trig identities.' },
    ],
    assignments: [
      { id: 'asgn4', title: 'Trig Identities Worksheet', dueDate: 'Tomorrow, Mar 13', points: 40, status: 'pending' },
      { id: 'asgn5', title: 'Unit 3 Practice Test', dueDate: 'Mar 5', points: 60, status: 'submitted' },
    ],
    resources: [
      { id: 'r3', title: 'Trig Identities Cheat Sheet', author: 'Mr. Davis', type: 'pdf', url: '#' },
      { id: 'r4', title: 'Desmos Graphing Calculator', author: 'Mr. Davis', type: 'link', url: '#' },
    ],
    messages: [
      { id: 'm4', sender: 'Mr. Davis', isTeacher: true, time: '8:00 AM', text: 'Today we start polar coordinates. Please watch the intro video beforehand.' },
      { id: 'm5', sender: 'Sarah Williams', isTeacher: false, time: '8:05 AM', text: 'Is the video on the resources tab?' },
      { id: 'm6', sender: 'Mr. Davis', isTeacher: true, time: '8:07 AM', text: 'Yes, I just added it!' },
    ],
  },
  {
    id: 'cls3',
    name: 'World History',
    teacher: 'Dr. Patel',
    subject: 'Social Studies',
    grade: '11th Grade',
    studentCount: 30,
    color: 'from-brand-orange to-orange-600',
    nextClass: 'Thu, 10:30 AM',
    channels: [{ name: 'general', unread: 1 }, { name: 'discussions', unread: 0 }],
    pendingAssignments: 0,
    announcements: [
      { id: 'a5', pinned: false, teacher: 'Dr. Patel', time: '3 days ago', text: 'Excellent essay submissions this week. Grades have been posted in the portal.' },
    ],
    assignments: [
      { id: 'asgn6', title: 'WWI Causes Essay', dueDate: 'Mar 10', points: 100, status: 'submitted' },
    ],
    resources: [
      { id: 'r5', title: 'Timeline of World War I', author: 'Dr. Patel', type: 'pdf', url: '#' },
    ],
    messages: [
      { id: 'm7', sender: 'Dr. Patel', isTeacher: true, time: 'Yesterday', text: 'Great discussions last class. Think about the underlying causes we discussed for our next debate.' },
    ],
  },
];

const PUBLIC_CLASSES = [
  { id: 'pub1', name: 'Intro to Chemistry', teacher: 'Ms. Lee', school: 'Riverside High', studentCount: 35, color: 'from-orange-700 to-orange-600', subject: 'Science' },
  { id: 'pub2', name: 'English Literature', teacher: 'Mr. Thompson', school: 'Lincoln Academy', studentCount: 22, color: 'from-rose-500 to-pink-600', subject: 'English' },
  { id: 'pub3', name: 'Economics 101', teacher: 'Dr. Kim', school: 'Westside Prep', studentCount: 19, color: 'from-teal-500 to-cyan-600', subject: 'Social Studies' },
];
// ──────────────────────────────────────────────────────────────────────────

export default function Community() {
  const { token, user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const communityTab = searchParams.get("tab") || (user?.role === 'student' ? 'classes' : 'feed');
  const setCommunityTab = (value) => setSearchParams({ tab: value });
  const [servers, setServers] = useState([]);
  const [discoverServers, setDiscoverServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverDescription, setServerDescription] = useState("");
  
  // Enhanced features state
  const [resources, setResources] = useState([]);
  const [goals, setGoals] = useState([]);
  const [collaborativeNotes, setCollaborativeNotes] = useState([]);
  const [sidePanel, setSidePanel] = useState(null); // 'resources', 'goals', 'notes'
  const [resourceOpen, setResourceOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Resource form
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceContent, setResourceContent] = useState("");
  
  // Goal form
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTarget, setGoalTarget] = useState(100);
  
  // Note form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  
  // Academy form
  const [isAcademy, setIsAcademy] = useState(false);
  const [academyType, setAcademyType] = useState("university");
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Validation error states
  const [serverErrors, setServerErrors] = useState({});
  const [messageError, setMessageError] = useState("");
  const [noteErrors, setNoteErrors] = useState({});
  const [goalErrors, setGoalErrors] = useState({});
  const [resourceErrors, setResourceErrors] = useState({});

  // Classes tab state (students only)
  const [enrolledClasses, setEnrolledClasses] = useState(MOCK_CLASSES);
  const [classesView, setClassesView] = useState('overview'); // 'overview' | 'join' | 'detail'
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetailTab, setClassDetailTab] = useState('feed');
  const [joinCode, setJoinCode] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);
  const [joinSearching, setJoinSearching] = useState(false);
  const [classChatMessages, setClassChatMessages] = useState({});
  const [newClassMessage, setNewClassMessage] = useState('');
  
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const fetchServerResources = useCallback(async (serverId) => {
    try {
      const response = await axios.get(`${API}/servers/${serverId}/resources`, { headers, withCredentials: true });
      setResources(response.data);
    } catch (error) {
      console.error("Failed to load resources");
    }
  }, [headers]);

  const fetchServerGoals = useCallback(async (serverId) => {
    try {
      const response = await axios.get(`${API}/servers/${serverId}/goals`, { headers, withCredentials: true });
      setGoals(response.data);
    } catch (error) {
      console.error("Failed to load goals");
    }
  }, [headers]);

  const fetchCollaborativeNotes = useCallback(async (serverId) => {
    try {
      const response = await axios.get(`${API}/servers/${serverId}/notes`, { headers, withCredentials: true });
      setCollaborativeNotes(response.data);
    } catch (error) {
      console.error("Failed to load notes");
    }
  }, [headers]);

  const selectServer = useCallback(async (serverId) => {
    try {
      const response = await axios.get(`${API}/servers/${serverId}`, { headers, withCredentials: true });
      setSelectedServer(response.data);
      if (response.data.channels?.length > 0) {
        setSelectedChannel(response.data.channels[0]);
      }
      // Fetch enhanced data
      fetchServerResources(serverId);
      fetchServerGoals(serverId);
      fetchCollaborativeNotes(serverId);
    } catch (error) {
      toast.error("Failed to load server");
    }
  }, [headers, fetchServerResources, fetchServerGoals, fetchCollaborativeNotes]);

  const fetchServers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/servers`, { headers, withCredentials: true });
      setServers(response.data);
      if (response.data.length > 0 && !selectedServer) {
        selectServer(response.data[0].server_id);
      }
    } catch (error) {
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  }, [headers, selectedServer, selectServer]);

  const fetchMessages = useCallback(async (channelId) => {
    try {
      const response = await axios.get(`${API}/channels/${channelId}/messages`, { headers, withCredentials: true });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages");
    }
  }, [headers]);

  const connectWebSocket = useCallback((channelId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws/${channelId}?token=${token}`);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages(prev => [...prev, data.message]);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    wsRef.current = ws;
  }, [token]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  useEffect(() => {
    if (selectedChannel && token) {
      fetchMessages(selectedChannel.channel_id);
      connectWebSocket(selectedChannel.channel_id);
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedChannel, token, fetchMessages, connectWebSocket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDiscoverServers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/servers/discover/all`, { headers, withCredentials: true });
      setDiscoverServers(response.data);
    } catch (error) {
      toast.error("Failed to load servers");
    }
  }, [headers]);

  const handleAddResource = async () => {
    if (!selectedServer) return;
    setResourceErrors({});
    const result = resourceSchema.safeParse({
      title: resourceTitle,
      url: resourceUrl,
      content: resourceContent,
    });
    if (!result.success) {
      setResourceErrors(formatZodErrors(result.error));
      return;
    }
    
    try {
      await axios.post(`${API}/servers/${selectedServer.server_id}/resources`, {
        server_id: selectedServer.server_id,
        title: resourceTitle,
        resource_type: resourceType,
        url: resourceUrl || null,
        content: resourceContent || null
      }, { headers, withCredentials: true });
      
      fetchServerResources(selectedServer.server_id);
      setResourceTitle("");
      setResourceUrl("");
      setResourceContent("");
      setResourceOpen(false);
      toast.success("Resource added!");
    } catch (error) {
      toast.error("Failed to add resource");
    }
  };

  const handleAddGoal = async () => {
    if (!selectedServer) return;
    setGoalErrors({});
    const result = goalSchema.safeParse({
      title: goalTitle,
      description: goalDescription,
      target: parseInt(goalTarget) || 0,
    });
    if (!result.success) {
      setGoalErrors(formatZodErrors(result.error));
      return;
    }
    
    try {
      await axios.post(`${API}/servers/${selectedServer.server_id}/goals`, {
        server_id: selectedServer.server_id,
        title: goalTitle,
        description: goalDescription,
        target: parseInt(goalTarget)
      }, { headers, withCredentials: true });
      
      fetchServerGoals(selectedServer.server_id);
      setGoalTitle("");
      setGoalDescription("");
      setGoalTarget(100);
      setGoalOpen(false);
      toast.success("Goal created!");
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  const handleContributeGoal = async (goalId, amount) => {
    try {
      await axios.post(`${API}/servers/${selectedServer.server_id}/goals/${goalId}/contribute`, {
        amount
      }, { headers, withCredentials: true });
      
      fetchServerGoals(selectedServer.server_id);
      toast.success("Contributed to goal!");
    } catch (error) {
      toast.error("Failed to contribute");
    }
  };

  const handleCreateNote = async () => {
    if (!selectedServer) return;
    setNoteErrors({});
    const result = communityNoteSchema.safeParse({ title: noteTitle, content: noteContent });
    if (!result.success) {
      setNoteErrors(formatZodErrors(result.error));
      return;
    }
    
    try {
      const response = await axios.post(`${API}/servers/${selectedServer.server_id}/notes`, {
        server_id: selectedServer.server_id,
        title: noteTitle,
        content: noteContent
      }, { headers, withCredentials: true });
      
      fetchCollaborativeNotes(selectedServer.server_id);
      setSelectedNote(response.data);
      setNoteTitle("");
      setNoteContent("");
      setNoteOpen(false);
      toast.success("Note created!");
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !selectedServer) return;
    
    try {
      await axios.put(`${API}/servers/${selectedServer.server_id}/notes/${selectedNote.note_id}`, {
        content: selectedNote.content
      }, { headers, withCredentials: true });
      
      fetchCollaborativeNotes(selectedServer.server_id);
      toast.success("Note saved!");
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleGetAISuggestions = async () => {
    if (!selectedServer) return;
    
    try {
      const response = await axios.post(`${API}/servers/${selectedServer.server_id}/ai-goals`, {}, { headers, withCredentials: true });
      toast.success("AI suggestions generated!");
      // You could show these in a modal or add them directly
      console.log(response.data);
    } catch (error) {
      toast.error("Failed to get suggestions");
    }
  };


  const handleCreateServer = async () => {
    setServerErrors({});
    const result = serverSchema.safeParse({ name: serverName, description: serverDescription });
    if (!result.success) {
      setServerErrors(formatZodErrors(result.error));
      return;
    }

    try {
      let response;
      if (isAcademy) {
        // Create Visionary Academy school server
        response = await axios.post(`${API}/servers/academy`, {
          name: serverName,
          description: serverDescription,
          school_type: academyType
        }, { headers, withCredentials: true });
      } else {
        response = await axios.post(`${API}/servers`, {
          name: serverName,
          description: serverDescription
        }, { headers, withCredentials: true });
      }
      
      setServers([...servers, response.data]);
      selectServer(response.data.server_id);
      setCreateServerOpen(false);
      setServerName("");
      setServerDescription("");
      setIsAcademy(false);
      toast.success(isAcademy ? "Visionary Academy created!" : "Server created!");
    } catch (error) {
      toast.error("Failed to create server");
    }
  };

  const handleJoinServer = async (serverId) => {
    try {
      await axios.post(`${API}/servers/${serverId}/join`, {}, { headers, withCredentials: true });
      fetchServers();
      selectServer(serverId);
      setDiscoverOpen(false);
      toast.success("Joined server!");
    } catch (error) {
      if (error.response?.data?.detail === "Already a member") {
        selectServer(serverId);
        setDiscoverOpen(false);
      } else {
        toast.error("Failed to join server");
      }
    }
  };

  const handleLeaveServer = async () => {
    if (!selectedServer) return;
    
    try {
      await axios.post(`${API}/servers/${selectedServer.server_id}/leave`, {}, { headers, withCredentials: true });
      setServers(servers.filter(s => s.server_id !== selectedServer.server_id));
      setSelectedServer(null);
      setSelectedChannel(null);
      toast.success("Left server");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to leave server");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChannel) return;
    setMessageError("");
    const result = commentSchema.safeParse({ text: newMessage });
    if (!result.success) {
      setMessageError(result.error.errors[0]?.message || "Invalid message");
      return;
    }

    try {
      await axios.post(`${API}/channels/${selectedChannel.channel_id}/messages`, {
        content: newMessage,
        channel_id: selectedChannel.channel_id
      }, { headers, withCredentials: true });
      
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return (
      <motion.div
        className="flex flex-1 flex overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
          {/* Server icon column skeleton */}
          <div className="w-[72px] bg-secondary/50 flex flex-col items-center py-4 gap-2 border-r border-border">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-12 h-12 rounded-2xl" delay={i * 50} />
            ))}
            <div className="w-8 h-0.5 bg-border my-2" />
            <Skeleton className="w-12 h-12 rounded-2xl" delay={220} />
            <Skeleton className="w-12 h-12 rounded-2xl" delay={270} />
          </div>

          {/* Channel list skeleton */}
          <div className="w-60 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-2">
              <Skeleton className="h-4 w-32" delay={60} />
              <Skeleton className="h-3 w-24" delay={90} />
            </div>
            <div className="p-3 border-b border-border flex gap-1">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-8 flex-1 rounded-md" delay={100 + i * 30} />
              ))}
            </div>
            <div className="flex-1 p-2 space-y-1">
              <Skeleton className="h-2.5 w-24 mb-2" delay={160} />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4 rounded-sm shrink-0" delay={180 + i * 35} />
                  <Skeleton className="h-3 flex-1" delay={195 + i * 35} />
                </div>
              ))}
            </div>
          </div>

          {/* Main content — 9 server/message item skeletons */}
          <div className="flex-1 flex flex-col">
            {/* Channel header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Skeleton className="h-4 w-4 rounded-sm" delay={80} />
              <Skeleton className="h-4 w-28" delay={100} />
            </div>

            {/* Message area with 9 skeletons */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton circle className="h-9 w-9 shrink-0" delay={i * 40} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-24" delay={i * 40 + 15} />
                      <Skeleton className="h-2.5 w-12" delay={i * 40 + 30} />
                    </div>
                    <Skeleton
                      className="h-3"
                      style={{ width: `${55 + (i % 4) * 12}%` }}
                      delay={i * 40 + 45}
                    />
                    {i % 3 === 0 && (
                      <Skeleton className="h-3 w-2/5" delay={i * 40 + 70} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message input skeleton */}
            <div className="p-4 border-t border-border">
              <Skeleton className="h-10 w-full rounded-xl" delay={300} />
            </div>
          </div>

      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-1 flex flex-col overflow-hidden min-h-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      data-testid="community-page"
    >
        <Tabs value={communityTab} onValueChange={setCommunityTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className={`shrink-0 mx-4 mt-2 grid w-full max-w-2xl h-11 ${user?.role !== 'teacher' ? 'grid-cols-1 sm:grid-cols-5' : 'grid-cols-1 sm:grid-cols-4'}`}>
            {user?.role !== 'teacher' && (
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Classes
              </TabsTrigger>
            )}
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" /> Feed
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Study Rooms
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Shop
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rooms" className="flex-1 flex min-h-0 overflow-hidden mt-0 data-[state=active]:flex p-4">
            <StudyRoomList currentUser={user ? { id: user.user_id || user.id, name: user.name || user.email, avatar: user.avatar } : null} />
          </TabsContent>
          <TabsContent value="feed" className="flex-1 flex min-h-0 overflow-hidden mt-0 data-[state=active]:flex">
        <div className="w-[72px] bg-secondary/50 flex flex-col items-center py-4 gap-2 border-r border-border">
          {servers.map((server) => (
            <button
              key={server.server_id}
              onClick={() => selectServer(server.server_id)}
              className={`w-12 h-12 rounded-2xl transition-all hover:rounded-xl ${
                selectedServer?.server_id === server.server_id 
                  ? "bg-primary text-primary-foreground rounded-xl" 
                  : "bg-muted hover:bg-accent"
              } flex items-center justify-center font-medium`}
              data-testid={`server-${server.server_id}`}
            >
              {server.icon || server.name.charAt(0).toUpperCase()}
            </button>
          ))}
          
          <div className="w-8 h-0.5 bg-border my-2"></div>
          
          {/* Create Server */}
          <Dialog open={createServerOpen} onOpenChange={setCreateServerOpen}>
            <DialogTrigger asChild>
              <button 
                className="w-12 h-12 rounded-2xl bg-muted hover:bg-green-500 hover:text-[var(--text-primary)] transition-all hover:rounded-xl flex items-center justify-center"
                data-testid="create-server-btn"
              >
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Server</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Server Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!isAcademy ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setIsAcademy(false)}
                  >
                    <Users className="w-4 h-4 mr-2" /> Community
                  </Button>
                  <Button
                    type="button"
                    variant={isAcademy ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setIsAcademy(true)}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" /> Visionary Academy
                  </Button>
                </div>
                
                {isAcademy && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-orange-900/30 to-blue-500/10 border border-orange-500/30">
                    <p className="text-sm text-muted-foreground">
                      🎓 Create a school server with leaderboards, classes, and academic features
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>{isAcademy ? "School Name" : "Server Name"}</Label>
                  <Input
                    value={serverName}
                    onChange={(e) => { setServerName(e.target.value); setServerErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder={isAcademy ? "Harvard Study Group" : "My Awesome Server"}
                    data-testid="server-name-input"
                    className={serverErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {serverErrors.name && (
                    <p className="text-sm md:text-xs text-destructive">{serverErrors.name}</p>
                  )}
                </div>
                
                {isAcademy && (
                  <div className="space-y-2">
                    <Label>School Type</Label>
                    <div className="flex gap-2">
                      {["high_school", "university", "other"].map(type => (
                        <Button
                          key={type}
                          type="button"
                          variant={academyType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAcademyType(type)}
                        >
                          {type === "high_school" ? "High School" : type === "university" ? "University" : "Other"}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={serverDescription}
                    onChange={(e) => { setServerDescription(e.target.value); setServerErrors((p) => ({ ...p, description: undefined })); }}
                    placeholder={isAcademy ? "What do you study?" : "What's your server about?"}
                    className={serverErrors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {serverErrors.description && (
                    <p className="text-sm md:text-xs text-destructive">{serverErrors.description}</p>
                  )}
                </div>
                <Button onClick={handleCreateServer} className="w-full" data-testid="create-server-submit">
                  {isAcademy ? "Create Academy" : "Create Server"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Discover Servers */}
          <Dialog open={discoverOpen} onOpenChange={(open) => {
            setDiscoverOpen(open);
            if (open) fetchDiscoverServers();
          }}>
            <DialogTrigger asChild>
              <button 
                className="w-12 h-12 rounded-2xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all hover:rounded-xl flex items-center justify-center"
                data-testid="discover-servers-btn"
              >
                <Compass className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Discover Servers</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {discoverServers.map((server) => (
                  <div 
                    key={server.server_id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {server.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{server.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {server.description || "No description"}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleJoinServer(server.server_id)}
                      data-testid={`join-server-${server.server_id}`}
                    >
                      Join
                    </Button>
                  </div>
                ))}
                {discoverServers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No servers found. Create one!
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedServer ? (
          <>
            {/* Channel List with Tabs */}
            <div className="w-60 bg-card border-r border-border flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="font-heading font-semibold truncate">{selectedServer.name}</h2>
                {selectedServer.description && (
                  <p className="text-sm md:text-xs text-muted-foreground truncate">{selectedServer.description}</p>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="p-2 border-b border-border flex gap-1">
                <Button
                  variant={sidePanel === 'resources' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSidePanel(sidePanel === 'resources' ? null : 'resources')}
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
                <Button
                  variant={sidePanel === 'goals' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSidePanel(sidePanel === 'goals' ? null : 'goals')}
                >
                  <Target className="w-4 h-4" />
                </Button>
                <Button
                  variant={sidePanel === 'notes' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSidePanel(sidePanel === 'notes' ? null : 'notes')}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                  <div className="px-2 py-1 text-sm md:text-xs font-medium text-muted-foreground uppercase">
                    Text Channels
                  </div>
                  {selectedServer.channels?.map((channel) => (
                    <button
                      key={channel.channel_id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        selectedChannel?.channel_id === channel.channel_id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                      data-testid={`channel-${channel.channel_id}`}
                    >
                      <Hash className="w-4 h-4" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-2 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleLeaveServer}
                  data-testid="leave-server-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Leave Server
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background">
              {selectedChannel ? (
                <>
                  {/* Channel Header */}
                  <div className="h-12 border-b border-border flex items-center px-4 gap-2">
                    <Hash className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{selectedChannel.name}</span>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.message_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 group"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={message.user_avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {message.user_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium">{message.user_name}</span>
                              <span className="text-sm md:text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm mt-0.5 break-words">{message.content}</p>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-1">
                        <Input
                          value={newMessage}
                          onChange={(e) => { setNewMessage(e.target.value); setMessageError(""); }}
                          placeholder={`Message #${selectedChannel.name}`}
                          className={messageError ? "border-destructive focus-visible:ring-destructive" : ""}
                          data-testid="message-input"
                        />
                        {messageError && (
                          <p className="text-sm md:text-xs text-destructive">{messageError}</p>
                        )}
                      </div>
                      <Button type="submit" size="icon" data-testid="send-message-btn">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground">Select a channel to start chatting</p>
                </div>
              )}
            </div>

            {/* Members List */}
            <div className="hidden xl:block w-60 bg-card border-l border-border p-4">
              <h3 className="text-sm md:text-xs font-medium text-muted-foreground uppercase mb-4">
                Members — {selectedServer.members?.length || 0}
              </h3>
              <div className="space-y-2">
                {selectedServer.members?.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm md:text-xs">
                        {member.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate flex-1">{member.name}</span>
                    {selectedServer.owner_id === member.user_id && (
                      <Crown className="w-4 h-4 text-brand-orange" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Side Panel for Resources/Goals/Notes */}
            {sidePanel && (
              <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
                {sidePanel === 'resources' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-medium flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" /> Shared Resources
                      </h3>
                      <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Resource</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={resourceTitle}
                                onChange={(e) => { setResourceTitle(e.target.value); setResourceErrors((p) => ({ ...p, title: undefined })); }}
                                placeholder="Resource name"
                                className={resourceErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                              />
                              {resourceErrors.title && (
                                <p className="text-sm md:text-xs text-destructive">{resourceErrors.title}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <select
                                value={resourceType}
                                onChange={(e) => setResourceType(e.target.value)}
                                className="w-full p-2 rounded-md border border-input bg-background"
                              >
                                <option value="link">Link</option>
                                <option value="file">File</option>
                                <option value="note">Note</option>
                              </select>
                            </div>
                            {resourceType === 'link' && (
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={resourceUrl}
                                  onChange={(e) => { setResourceUrl(e.target.value); setResourceErrors((p) => ({ ...p, url: undefined })); }}
                                  placeholder="https://..."
                                  className={resourceErrors.url ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {resourceErrors.url && (
                                  <p className="text-sm md:text-xs text-destructive">{resourceErrors.url}</p>
                                )}
                              </div>
                            )}
                            {resourceType === 'note' && (
                              <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea
                                  value={resourceContent}
                                  onChange={(e) => { setResourceContent(e.target.value); setResourceErrors((p) => ({ ...p, content: undefined })); }}
                                  placeholder="Write your note..."
                                  className={resourceErrors.content ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {resourceErrors.content && (
                                  <p className="text-sm md:text-xs text-destructive">{resourceErrors.content}</p>
                                )}
                              </div>
                            )}
                            <Button onClick={handleAddResource} className="w-full">
                              Add Resource
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      {resources.map((resource) => (
                        <div key={resource.resource_id} className="p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-start gap-2">
                            <LinkIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{resource.title}</p>
                              <p className="text-sm md:text-xs text-muted-foreground">{resource.user_name}</p>
                              {resource.url && (
                                <a 
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm md:text-xs text-primary flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Open
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {resources.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No resources shared yet
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {sidePanel === 'goals' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-medium flex items-center gap-2">
                        <Target className="w-4 h-4" /> Group Goals
                      </h3>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={handleGetAISuggestions}>
                          <Sparkles className="w-3 h-3" />
                        </Button>
                        <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Goal</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label>Goal Title</Label>
                                <Input
                                  value={goalTitle}
                                  onChange={(e) => { setGoalTitle(e.target.value); setGoalErrors((p) => ({ ...p, title: undefined })); }}
                                  placeholder="Study 100 hours together"
                                  className={goalErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {goalErrors.title && (
                                  <p className="text-sm md:text-xs text-destructive">{goalErrors.title}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={goalDescription}
                                  onChange={(e) => { setGoalDescription(e.target.value); setGoalErrors((p) => ({ ...p, description: undefined })); }}
                                  placeholder="What's this goal about?"
                                  className={goalErrors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {goalErrors.description && (
                                  <p className="text-sm md:text-xs text-destructive">{goalErrors.description}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label>Target</Label>
                                <Input
                                  type="number"
                                  value={goalTarget}
                                  onChange={(e) => { setGoalTarget(e.target.value); setGoalErrors((p) => ({ ...p, target: undefined })); }}
                                  placeholder="100"
                                  className={goalErrors.target ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {goalErrors.target && (
                                  <p className="text-sm md:text-xs text-destructive">{goalErrors.target}</p>
                                )}
                              </div>
                              <Button onClick={handleAddGoal} className="w-full">
                                Create Goal
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {goals.map((goal) => (
                        <div key={goal.goal_id} className="p-3 rounded-lg bg-secondary/50">
                          <p className="font-medium text-sm mb-1">{goal.title}</p>
                          {goal.description && (
                            <p className="text-sm md:text-xs text-muted-foreground mb-2">{goal.description}</p>
                          )}
                          <div className="mb-2">
                            <div className="flex justify-between text-sm md:text-xs mb-1">
                              <span>{goal.progress}</span>
                              <span>{goal.target}</span>
                            </div>
                            <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleContributeGoal(goal.goal_id, 1)}
                          >
                            +1 Contribution
                          </Button>
                        </div>
                      ))}
                      {goals.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No goals yet. Create one!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {sidePanel === 'notes' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Collaborative Notes
                      </h3>
                      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Note</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={noteTitle}
                                onChange={(e) => { setNoteTitle(e.target.value); setNoteErrors((p) => ({ ...p, title: undefined })); }}
                                placeholder="Meeting Notes"
                                className={noteErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                              />
                              {noteErrors.title && (
                                <p className="text-sm md:text-xs text-destructive">{noteErrors.title}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Content</Label>
                              <Textarea
                                value={noteContent}
                                onChange={(e) => { setNoteContent(e.target.value); setNoteErrors((p) => ({ ...p, content: undefined })); }}
                                placeholder="Start writing..."
                                rows={6}
                                className={noteErrors.content ? "border-destructive focus-visible:ring-destructive" : ""}
                              />
                              {noteErrors.content && (
                                <p className="text-sm md:text-xs text-destructive">{noteErrors.content}</p>
                              )}
                            </div>
                            <Button onClick={handleCreateNote} className="w-full">
                              Create Note
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {selectedNote ? (
                      <div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedNote(null)}
                          className="mb-2"
                        >
                          ← Back to list
                        </Button>
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="font-medium text-sm mb-2">{selectedNote.title}</p>
                          <Textarea
                            value={selectedNote.content}
                            onChange={(e) => setSelectedNote({...selectedNote, content: e.target.value})}
                            className="min-h-[200px] mb-2"
                          />
                          <Button size="sm" onClick={handleUpdateNote} className="w-full">
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {collaborativeNotes.map((note) => (
                          <div 
                            key={note.note_id} 
                            className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary"
                            onClick={() => setSelectedNote(note)}
                          >
                            <p className="font-medium text-sm">{note.title}</p>
                            <p className="text-sm md:text-xs text-muted-foreground mt-1 line-clamp-2">
                              {note.content || "Empty note"}
                            </p>
                          </div>
                        ))}
                        {collaborativeNotes.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No notes yet. Create one!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-xl font-medium mb-2">No Server Selected</h2>
              <p className="text-muted-foreground mb-4">Create or join a server to get started</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setCreateServerOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Server
                </Button>
                <Button variant="outline" onClick={() => {
                  setDiscoverOpen(true);
                  fetchDiscoverServers();
                }}>
                  <Compass className="w-4 h-4 mr-2" /> Discover
                </Button>
              </div>
            </div>
          </div>
        )}
          </TabsContent>
          <TabsContent value="leaderboard" className="flex-1 mt-0 overflow-auto">
            <Leaderboard currentUser={user} />
          </TabsContent>
          <TabsContent value="shop" className="flex-1 mt-0 overflow-auto">
            <Shop embed />
          </TabsContent>

          {/* ── CLASSES TAB (students only) ────────────────────────────── */}
          {user?.role !== 'teacher' && (
            <TabsContent value="classes" className="flex-1 mt-0 overflow-auto data-[state=active]:flex flex-col min-h-0">

              {/* ── OVERVIEW ── */}
              {classesView === 'overview' && (
                <div className="p-6 max-w-5xl mx-auto w-full">

                  {/* Empty state */}
                  {enrolledClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
                        <GraduationCap className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold font-heading mb-2">No classes yet</h2>
                      <p className="text-muted-foreground text-sm mb-6 max-w-xs">Ask your teacher for a class code to get started</p>
                      <Button onClick={() => { setClassesView('join'); setJoinCode(''); setJoinPreview(null); }}>
                        <Plus className="w-4 h-4 mr-2" /> Join a Class
                      </Button>
                    </div>
                  ) : (
                  <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h1 className="text-2xl font-bold font-heading">My Classes</h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {enrolledClasses.length} enrolled · {enrolledClasses.reduce((s, c) => s + (c.pendingAssignments || 0), 0)} assignments due soon
                      </p>
                    </div>
                    <Button onClick={() => { setClassesView('join'); setJoinCode(''); setJoinPreview(null); }}>
                      <Plus className="w-4 h-4 mr-2" /> Join a Class
                    </Button>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{enrolledClasses.length}</p>
                        <p className="text-sm md:text-xs text-muted-foreground">Classes Enrolled</p>
                      </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-brand-orange" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{enrolledClasses.reduce((s, c) => s + (c.pendingAssignments || 0), 0)}</p>
                        <p className="text-sm md:text-xs text-muted-foreground">Due Soon</p>
                      </div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">7</p>
                        <p className="text-sm md:text-xs text-muted-foreground">Day Study Streak</p>
                      </div>
                    </div>
                  </div>

                  {/* Class Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrolledClasses.map((cls) => (
                      <motion.div
                        key={cls.id}
                        whileHover={{ y: -2 }}
                        onClick={() => { setSelectedClass(cls); setClassesView('detail'); setClassDetailTab('feed'); }}
                        className="rounded-xl border bg-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className={`h-2 bg-gradient-to-r ${cls.color}`} />
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-base">{cls.name}</h3>
                              <p className="text-sm text-muted-foreground">{cls.teacher}</p>
                            </div>
                            <span className="text-sm md:text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{cls.subject}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm md:text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls.studentCount} students</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.nextClass}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {cls.channels.filter(ch => ch.unread > 0).map(ch => (
                              <span key={ch.name} className="text-sm md:text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                #{ch.name} {ch.unread}
                              </span>
                            ))}
                            {cls.pendingAssignments > 0 && (
                              <span className="text-sm md:text-xs px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-deep font-medium">
                                {cls.pendingAssignments} pending
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Join a Class dashed card */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      onClick={() => { setClassesView('join'); setJoinCode(''); setJoinPreview(null); }}
                      className="rounded-xl border-2 border-dashed border-border bg-card/50 overflow-hidden cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center min-h-[140px]"
                    >
                      <div className="text-center py-6">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">+ Join a Class</p>
                      </div>
                    </motion.div>
                  </div>
                  </>
                  )}
                </div>
              )}

              {/* ── JOIN FLOW ── */}
              {classesView === 'join' && (
                <div className="p-6 max-w-2xl mx-auto w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setClassesView('overview'); setJoinCode(''); setJoinPreview(null); }}
                    className="mb-6 -ml-2"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Classes
                  </Button>

                  <div className="rounded-xl border bg-card p-8 text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Key className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold font-heading mb-1">Join a Class</h2>
                    <p className="text-sm text-muted-foreground mb-6">Enter the class code your teacher shared</p>

                    <div className="flex gap-2 max-w-xs mx-auto">
                      <Input
                        value={joinCode}
                        onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinPreview(null); }}
                        placeholder="ABC123"
                        className="text-center font-mono text-lg tracking-widest"
                        maxLength={8}
                      />
                      <Button
                        onClick={async () => {
                          if (!joinCode.trim()) return;
                          setJoinSearching(true);
                          setJoinPreview(null);
                          setTimeout(() => {
                            if (joinCode === 'BIO101') {
                              setJoinPreview({ id: 'pub_bio', name: 'AP Biology Advanced', teacher: 'Dr. Smith', school: 'Westside High', studentCount: 31 });
                            } else {
                              toast.error('No class found with that code');
                            }
                            setJoinSearching(false);
                          }, 800);
                        }}
                        disabled={joinSearching}
                      >
                        {joinSearching
                          ? <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin inline-block" />
                          : <Search className="w-4 h-4" />
                        }
                      </Button>
                    </div>

                    {joinPreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-lg bg-secondary/50 text-left"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{joinPreview.name}</p>
                            <p className="text-sm text-muted-foreground">{joinPreview.teacher} · {joinPreview.school}</p>
                            <p className="text-sm md:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />{joinPreview.studentCount} students
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const alreadyJoined = enrolledClasses.some(c => c.id === joinPreview.id);
                              if (!alreadyJoined) {
                                setEnrolledClasses(prev => [...prev, {
                                  ...joinPreview,
                                  color: 'from-orange-700 to-orange-600',
                                  pendingAssignments: 0,
                                  channels: [{ name: 'general', unread: 0 }],
                                  announcements: [],
                                  assignments: [],
                                  resources: [],
                                  messages: [],
                                }]);
                              }
                              toast.success(`Joined ${joinPreview.name}!`);
                              setJoinPreview(null);
                              setJoinCode('');
                              setClassesView('overview');
                            }}
                          >
                            Join Class
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">Or browse public classes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PUBLIC_CLASSES.map((cls) => (
                        <div key={cls.id} className="rounded-xl border bg-card overflow-hidden">
                          <div className={`h-1.5 bg-gradient-to-r ${cls.color}`} />
                          <div className="p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{cls.name}</p>
                              <p className="text-sm md:text-xs text-muted-foreground truncate">{cls.teacher} · {cls.school}</p>
                              <p className="text-sm md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Users className="w-3 h-3" />{cls.studentCount}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const alreadyJoined = enrolledClasses.some(c => c.id === cls.id);
                                if (!alreadyJoined) {
                                  setEnrolledClasses(prev => [...prev, {
                                    ...cls,
                                    nextClass: 'TBD',
                                    pendingAssignments: 0,
                                    channels: [{ name: 'general', unread: 0 }],
                                    announcements: [],
                                    assignments: [],
                                    resources: [],
                                    messages: [],
                                  }]);
                                }
                                toast.success(`Joined ${cls.name}!`);
                                setClassesView('overview');
                              }}
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── CLASS DETAIL VIEW ── */}
              {classesView === 'detail' && selectedClass && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Gradient Header */}
                  <div className={`bg-gradient-to-r ${selectedClass.color} p-5 text-[var(--text-primary)] shrink-0`}>
                    <button
                      onClick={() => { setClassesView('overview'); setSelectedClass(null); }}
                      className="flex items-center gap-1 text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] hover:text-[var(--text-primary)] text-sm mb-3 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to My Classes
                    </button>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold font-heading">{selectedClass.name}</h2>
                        <p className="text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] text-sm mt-0.5">{selectedClass.teacher} · {selectedClass.grade}</p>
                      </div>
                      <span className="flex items-center gap-1 text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] text-sm">
                        <Users className="w-4 h-4" />{selectedClass.studentCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {selectedClass.pendingAssignments > 0 && (
                        <span className="text-sm md:text-xs px-2.5 py-1 rounded-full bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur-sm font-medium">
                          {selectedClass.pendingAssignments} due soon
                        </span>
                      )}
                      <span className="text-sm md:text-xs px-2.5 py-1 rounded-full bg-[color:color-mix(in_srgb,var(--text-primary)_20%,transparent)] backdrop-blur-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Next: {selectedClass.nextClass}
                      </span>
                    </div>
                  </div>

                  {/* Inner Tabs */}
                  <Tabs value={classDetailTab} onValueChange={setClassDetailTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="shrink-0 mx-4 mt-3 grid w-full max-w-md grid-cols-1 sm:grid-cols-4 h-9">
                      <TabsTrigger value="feed" className="text-sm md:text-xs">Feed</TabsTrigger>
                      <TabsTrigger value="assignments" className="text-sm md:text-xs">Assignments</TabsTrigger>
                      <TabsTrigger value="resources" className="text-sm md:text-xs">Resources</TabsTrigger>
                      <TabsTrigger value="chat" className="text-sm md:text-xs">Chat</TabsTrigger>
                    </TabsList>

                    {/* Feed */}
                    <TabsContent value="feed" className="flex-1 overflow-auto p-4 mt-0">
                      <div className="max-w-2xl mx-auto space-y-4">
                        {selectedClass.announcements.map((post) => (
                          <div key={post.id} className="rounded-xl border bg-card p-4">
                            {post.pinned && (
                              <div className="flex items-center gap-1 text-sm md:text-xs text-brand-deep font-medium mb-2">
                                <Star className="w-3 h-3 fill-brand-orange text-brand-orange" /> Pinned
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm md:text-xs">
                                  {post.teacher.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{post.teacher}</span>
                                  <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Teacher</span>
                                </div>
                                <span className="text-sm md:text-xs text-muted-foreground">{post.time}</span>
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed">{post.text}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Assignments */}
                    <TabsContent value="assignments" className="flex-1 overflow-auto p-4 mt-0">
                      <div className="max-w-2xl mx-auto space-y-3">
                        {selectedClass.assignments.map((asgn) => (
                          <div
                            key={asgn.id}
                            className={`rounded-xl border bg-card p-4 flex items-center gap-4 ${asgn.status === 'submitted' ? 'opacity-60' : ''}`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${asgn.status === 'submitted' ? 'bg-green-500/10' : 'bg-brand-orange/10'}`}>
                              {asgn.status === 'submitted'
                                ? <CheckCircle className="w-5 h-5 text-green-500" />
                                : <Clock className="w-5 h-5 text-brand-orange" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{asgn.title}</p>
                              <p className={`text-sm md:text-xs mt-0.5 ${asgn.dueDate.startsWith('Tomorrow') ? 'text-brand-deep font-medium' : 'text-muted-foreground'}`}>
                                Due: {asgn.dueDate} · {asgn.points} pts
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => toast.info('Assignment viewer coming soon!')}>
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Resources */}
                    <TabsContent value="resources" className="flex-1 overflow-auto p-4 mt-0">
                      <div className="max-w-2xl mx-auto space-y-3">
                        {selectedClass.resources.map((res) => (
                          <div key={res.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              {res.type === 'pdf'
                                ? <FileText className="w-5 h-5 text-red-500" />
                                : <LinkIcon className="w-5 h-5 text-blue-500" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{res.title}</p>
                              <p className="text-sm md:text-xs text-muted-foreground mt-0.5">{res.author}</p>
                            </div>
                            <span className="text-sm md:text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">{res.type}</span>
                            <Button size="sm" variant="outline" asChild>
                              <a href={res.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Chat */}
                    <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex">
                      <ScrollArea className="flex-1 p-4">
                        <div className="max-w-2xl mx-auto space-y-4">
                          {(classChatMessages[selectedClass.id] || selectedClass.messages).map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3">
                              <Avatar className="w-9 h-9 shrink-0">
                                <AvatarFallback className={`text-sm md:text-xs ${msg.isTeacher ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                                  {msg.sender.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-sm">{msg.sender}</span>
                                  {msg.isTeacher && (
                                    <span className="text-sm md:text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Teacher</span>
                                  )}
                                  <span className="text-sm md:text-xs text-muted-foreground">{msg.time}</span>
                                </div>
                                <p className="text-sm">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t border-border shrink-0">
                        <form
                          className="flex gap-2 max-w-2xl mx-auto"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newClassMessage.trim()) return;
                            const newMsg = {
                              id: `local-${Date.now()}`,
                              sender: user?.name || user?.email || 'You',
                              isTeacher: false,
                              time: 'Just now',
                              text: newClassMessage.trim(),
                            };
                            setClassChatMessages(prev => ({
                              ...prev,
                              [selectedClass.id]: [...(prev[selectedClass.id] || selectedClass.messages), newMsg],
                            }));
                            setNewClassMessage('');
                          }}
                        >
                          <Input
                            value={newClassMessage}
                            onChange={(e) => setNewClassMessage(e.target.value)}
                            placeholder={`Message ${selectedClass.name}...`}
                            className="flex-1"
                          />
                          <Button type="submit" size="icon">
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
          )}
          {/* ── END CLASSES TAB ─────────────────────────────────────────── */}
        </Tabs>
    </motion.div>
  );
}
