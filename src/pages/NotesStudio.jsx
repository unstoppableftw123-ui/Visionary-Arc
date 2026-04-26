import { useState, useEffect, useCallback, useRef, useMemo, useContext } from "react";
import { useLocation } from "react-router-dom";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { MessageSquare, PanelRightOpen, Send } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { 
  Download,
  Share2,
  Sparkles,
  ChevronDown,
  FileText,
  FileDown,
  FileType,
  Layout,
  Type,
  Minus,
  Trash2,
  Image,
  Check,
  Loader2,
  BookMarked
} from "lucide-react";
import { 
  TextBolder,
  TextItalic,
  TextUnderline,
  ListBullets,
  ListNumbers,
  Code,
  TextHOne,
  TextHTwo,
  TextHThree
} from "phosphor-react";
import PhosphorIcon from "../components/icons/PhosphorIcon";
import { noteTemplates, getTemplateList } from "../templates/noteTemplates";
import { noteSchema, formatZodErrors } from "../lib/validation";
import { AuthContext } from "../App";
import { awardActivityXP } from "../services/xpService";

const NOTES_CHAT_MOCK_RESPONSE = "I can help you with notes, outlines, and diagram ideas. Open the editing page on the side to write or draw—you can paste content there and use \"AI Suggest Diagram\" to generate a mind map from your text. What would you like to work on?";

export default function NotesStudio() {
  const { user, setUser } = useContext(AuthContext);
  const [title, setTitle] = useState("Untitled Note");
  const [characterCount, setCharacterCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [lastAutoSaved, setLastAutoSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [noteId, setNoteId] = useState(null);           // note_id once saved
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [canvasData, setCanvasData] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [lastDiagramSuggestion, setLastDiagramSuggestion] = useState(null);
  const [noteErrors, setNoteErrors] = useState({});
  const [paperStyle, setPaperStyle] = useState(true); // lined note paper vs plain whiteboard
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const saveNoteRef = useRef(null);   // stable ref so auto-save interval sees latest fn
  const chatScrollRef = useRef(null);
  const { toast } = useToast();
  const location = useLocation();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  const PAPER_BG = "#faf9f6";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Write your notes here...",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const content = editor.getText();
      setCharacterCount(content.length);
    },
  });

  // ── Save note to database ──────────────────────────────────────────────────
  const saveNote = useCallback(async (isDraft = false) => {
    if (!editor) return;
    if (isSaving) return;

    const content = editor.getHTML();

    // Validate before saving (skip for auto-drafts)
    if (!isDraft) {
      const result = noteSchema.safeParse({ title, content: editor.getText() });
      if (!result.success) {
        const errs = formatZodErrors(result.error);
        setNoteErrors(errs);
        toast({
          title: "Validation error",
          description: Object.values(errs)[0],
          variant: "destructive",
        });
        return;
      }
      setNoteErrors({});
    }
    const canvasScene = excalidrawAPI ? {
      elements: excalidrawAPI.getSceneElements(),
      appState: {
        viewBackgroundColor: excalidrawAPI.getAppState().viewBackgroundColor,
      },
    } : null;

    // Also persist to localStorage as a fast local backup
    localStorage.setItem(`notes-studio-${title}`, JSON.stringify({
      title, content, lastSaved: new Date().toISOString(),
    }));

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/notes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title,
          content,
          canvas_data: canvasScene,
          template_id: selectedTemplate,
          is_draft: isDraft,
          ...(noteId && { note_id: noteId }),
        }),
      });

      if (!response.ok) throw new Error('Save failed');

      const saved = await response.json();
      setNoteId(saved.note_id);
      const now = new Date();
      setLastSaved(now);
      if (isDraft) {
        setLastAutoSaved(now);
      } else {
        const hasCanvas = (canvasScene?.elements?.length ?? 0) > 0;
        if (user?.id) {
          const rewardResults = await Promise.all([
            awardActivityXP(user.id, "notes", null).catch(() => null),
            hasCanvas ? awardActivityXP(user.id, "whiteboard", null).catch(() => null) : Promise.resolve(null),
          ]);
          const totals = rewardResults.reduce(
            (acc, reward) => ({
              xp: acc.xp + (reward?.awarded ? reward.xpGained : 0),
              coins: acc.coins + (reward?.awarded ? reward.coinsGained : 0),
            }),
            { xp: 0, coins: 0 },
          );

          if (totals.xp || totals.coins) {
            setUser((prev) => prev ? ({
              ...prev,
              xp: (prev.xp ?? 0) + totals.xp,
              coins: (prev.coins ?? 0) + totals.coins,
            }) : prev);
          }
        }

        toast({
          title: "Note saved to Library!",
          description: `"${title}" has been saved successfully.`,
        });
      }
    } catch (err) {
      console.error('Error saving note:', err);
      if (!isDraft) {
        toast({
          title: "Save failed",
          description: "Could not reach the server. Your work is backed up locally.",
          variant: "destructive",
        });
      }
      // Always persist locally even on server failure
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [editor, title, noteId, selectedTemplate, excalidrawAPI, isSaving, toast, API_BASE_URL, setUser, user?.id]);

  // Keep ref in sync so auto-save interval always calls the latest version
  useEffect(() => { saveNoteRef.current = saveNote; }, [saveNote]);

  // ── Auto-save every 2 minutes as draft ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (saveNoteRef.current) saveNoteRef.current(true);
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);  // intentionally empty — uses ref to avoid stale closures

  // Load saved content on mount
  useEffect(() => {
    const saved = localStorage.getItem(`notes-studio-${title}`);
    if (saved && editor) {
      try {
        const { content } = JSON.parse(saved);
        editor.commands.setContent(content);
      } catch (e) {
        console.error("Failed to load saved content:", e);
      }
    }

    // Load saved canvas data
    const savedCanvas = localStorage.getItem(`notes-studio-canvas-${title}`);
    if (savedCanvas) {
      try {
        const canvas = JSON.parse(savedCanvas);
        // Ensure collaborators is always a Map, never a plain object
        if (canvas.appState) {
          canvas.appState.collaborators = new Map();
        }
        setCanvasData(canvas);
      } catch (e) {
        console.error("Failed to load saved canvas:", e);
      }
    }
  }, [title, editor]);

  // Pre-fill from a task template navigated from Profile
  useEffect(() => {
    const incoming = location.state?.useTemplate;
    if (!incoming) return;
    if (incoming.title) setTitle(incoming.title);
    setSheetOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save canvas state to localStorage only — does NOT call setCanvasData so it
  // never triggers a NotesStudio re-render.  saveNote() reads the canvas
  // directly from excalidrawAPI, so React state is not needed here.
  const saveCanvasState = useCallback((elements, appState) => {
    if (title) {
      // Strip collaborators (Map) and other non-serializable fields before JSON storage
      const { collaborators, openMenu, openSidebar, ...serializableAppState } = appState || {};
      const canvasState = {
        elements,
        appState: serializableAppState,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(`notes-studio-canvas-${title}`, JSON.stringify(canvasState));
    }
  }, [title]);

  // Clear canvas with confirmation
  const clearCanvas = () => {
    if (excalidrawAPI) {
      excalidrawAPI.resetCanvas();
      saveCanvasState([], excalidrawAPI.getAppState());
      setShowClearConfirm(false);
    }
  };

  // Export canvas as PNG
  const exportCanvasAsPNG = async () => {
    if (!excalidrawAPI) return;
    try {
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
        mimeType: "image/png",
      });
      const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(title)}-canvas-${ts}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export canvas:", error);
      toast({ title: "Export failed", description: "Could not export canvas.", variant: "destructive" });
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const slugify = (str) => str.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'note';

  const htmlToMarkdown = (html) => {
    return html
      .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n$1\n')
      .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n$1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Export as Markdown
  const exportAsMarkdown = () => {
    if (!editor) return;
    const markdown = `# ${title}\n\n${htmlToMarkdown(editor.getHTML())}`;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(title)}-${ts}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported as Markdown", description: `${slugify(title)}-${ts}.md downloaded.` });
  };

  // Export as PDF via browser print (canvas image + rich text)
  const exportAsPDF = async () => {
    const htmlContent = editor ? editor.getHTML() : '';
    const ts = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let canvasImgSrc = '';

    if (excalidrawAPI) {
      try {
        const blob = await exportToBlob({
          elements: excalidrawAPI.getSceneElements(),
          appState: excalidrawAPI.getAppState(),
          files: excalidrawAPI.getFiles(),
          mimeType: 'image/png',
        });
        // Convert blob to base64 data URL so it survives the print window
        canvasImgSrc = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) { /* canvas export optional */ }
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Please allow popups for PDF export.", variant: "destructive" });
      return;
    }
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; max-width: 780px; margin: 0 auto; padding: 48px 40px; color: #1F2937; line-height: 1.7; }
    .header { border-bottom: 2px solid #E5E7EB; padding-bottom: 16px; margin-bottom: 28px; }
    .note-title { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .note-meta { font-size: 12px; color: var(--text-secondary); }
    .note-content { margin-bottom: 40px; }
    .note-content h1 { font-size: 22px; font-weight: 700; margin: 20px 0 8px; }
    .note-content h2 { font-size: 18px; font-weight: 600; margin: 16px 0 6px; }
    .note-content h3 { font-size: 15px; font-weight: 600; margin: 12px 0 4px; }
    .note-content p { margin-bottom: 12px; }
    .note-content ul, .note-content ol { padding-left: 24px; margin-bottom: 12px; }
    .note-content li { margin-bottom: 4px; }
    .note-content strong { font-weight: 600; }
    .note-content code { background: #F3F4F6; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 13px; }
    .note-content pre { background: var(--text-primary); border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px; margin-bottom: 12px; overflow: auto; }
    .canvas-section { border-top: 2px solid #E5E7EB; padding-top: 24px; }
    .canvas-label { font-size: 14px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .canvas-img { max-width: 100%; border-radius: 8px; border: 1px solid #E5E7EB; }
    @media print {
      body { padding: 24px; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="note-title">${title}</div>
    <div class="note-meta">Generated ${ts}${selectedTemplate !== 'blank' ? ` · Template: ${selectedTemplate}` : ''}</div>
  </div>
  ${htmlContent ? `<div class="note-content">${htmlContent}</div>` : ''}
  ${canvasImgSrc ? `
  <div class="canvas-section">
    <div class="canvas-label">Canvas Drawing</div>
    <img class="canvas-img" src="${canvasImgSrc}" alt="Excalidraw canvas" />
  </div>` : ''}
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 400);
    });
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  // Generate diagram from AI suggestion
  const generateAIDiagram = async (regenerate = false) => {
    if (!editor || isGeneratingDiagram) return;

    const text = editor.getText();
    if (!text.trim()) {
      toast({
        title: "No content",
        description: "Please add some text to generate a diagram.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDiagram(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/suggest-diagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          title: title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate diagram suggestion');
      }

      const suggestion = await response.json();
      setLastDiagramSuggestion(suggestion);

      // Convert AI suggestion to Excalidraw elements
      const elements = convertToExcalidrawElements(suggestion);
      
      // Load elements into canvas
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements,
          appState: excalidrawAPI.getAppState(),
        });
        saveCanvasState(elements, excalidrawAPI.getAppState());
      }

      toast({
        title: "Diagram generated",
        description: `${suggestion.type} diagram created based on your content.`,
      });

    } catch (error) {
      console.error('Error generating diagram:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate diagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // Palette for nodes when AI doesn't provide color (by diagram type)
  const DIAGRAM_COLORS = [
    "#4F46E5", "#10B981", "#e8722a", "#EF4444", "#3B82F6", "#e8722a", "#EC4899", "#06B6D4"
  ];
  const lightenHex = (hex, amount = 0.85) => {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount);
    const b = Math.min(255, (num & 0xff) + (255 - (num & 0xff)) * amount);
    return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
  };

  // Convert AI suggestion to Excalidraw elements (varied shapes and colors by type/node)
  const convertToExcalidrawElements = (diagramData) => {
    const elements = [];
    const diagramType = diagramData.type || "mindmap";
    const nodes = diagramData.nodes || [];
    const edges = diagramData.edges || [];

    nodes.forEach((node, idx) => {
      const shape = (node.shape || "rectangle").toLowerCase();
      const type = ["rectangle", "ellipse", "diamond"].includes(shape) ? shape : "rectangle";
      const strokeColor = node.color || DIAGRAM_COLORS[idx % DIAGRAM_COLORS.length];
      const backgroundColor = lightenHex(strokeColor);

      const x = node.position?.x ?? 100;
      const y = node.position?.y ?? 100;
      const w = type === "ellipse" ? 120 : type === "diamond" ? 80 : 120;
      const h = type === "ellipse" ? 60 : type === "diamond" ? 80 : 60;
      const textOffsetX = type === "diamond" ? 10 : 10;
      const textOffsetY = type === "diamond" ? 28 : 20;

      const element = {
        id: node.id,
        type,
        x,
        y,
        width: w,
        height: h,
        strokeColor,
        backgroundColor,
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 0,
        seed: Math.floor(Math.random() * 100),
        groupIds: [],
        frameId: null,
        index: "a0",
        link: null,
        locked: false,
        isDeleted: false,
      };

      const textElement = {
        id: `${node.id}-text`,
        type: "text",
        x: x + textOffsetX,
        y: y + textOffsetY,
        width: Math.max(80, w - 20),
        height: 24,
        text: node.text,
        fontSize: type === "diamond" ? 14 : 16,
        fontFamily: 1,
        textAlign: "center",
        verticalAlign: "middle",
        strokeColor: "#1F2937",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 0,
        seed: Math.floor(Math.random() * 100),
        groupIds: [],
        frameId: null,
        index: "a1",
        link: null,
        locked: false,
        isDeleted: false,
      };

      elements.push(element, textElement);
    });

    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const fx = fromNode.position?.x ?? 100;
      const fy = fromNode.position?.y ?? 100;
      const tx = toNode.position?.x ?? 300;
      const ty = toNode.position?.y ?? 200;
      const startX = fx + 60;
      const startY = fy + 30;
      const endX = tx + 60;
      const endY = ty + 30;

      const arrowEl = {
        id: `edge-${edge.from}-${edge.to}`,
        type: "arrow",
        x: startX,
        y: startY,
        width: endX - startX,
        height: endY - startY,
        angle: 0,
        strokeColor: "#6B7280",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        roughness: 0,
        seed: Math.floor(Math.random() * 100),
        groupIds: [],
        frameId: null,
        index: "a2",
        link: null,
        locked: false,
        isDeleted: false,
        points: [[0, 0], [endX - startX, endY - startY]],
        lastCommittedPoint: null,
      };

      elements.push(arrowEl);
    });

    return elements;
  };

  // Load template into canvas
  const loadTemplate = (templateId) => {
    const template = noteTemplates[templateId];
    if (!template || !excalidrawAPI) return;

    // Load template elements and state
    excalidrawAPI.updateScene({
      elements: template.elements,
      appState: template.appState
    });

    // Set guide text in editor
    if (editor && template.guideText) {
      editor.commands.setContent(`<p><em>${template.guideText}</em></p>`);
    }

    setSelectedTemplate(templateId);
    saveCanvasState(template.elements, template.appState);

    toast({
      title: "Template Loaded",
      description: `${template.name} template has been applied.`,
    });
  };

  // Stable callback so Excalidraw never sees a new prop reference on re-render
  const handleExcalidrawAPI = useCallback((api) => setExcalidrawAPI(api), []);

  // Chat: mock send — add user message and assistant reply with "Open in editor" CTA
  const handleChatSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), role: "user", content: text };
    const assistantMsg = { id: Date.now() + 1, role: "assistant", content: NOTES_CHAT_MOCK_RESPONSE };
    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
    setChatInput("");
    setTimeout(() => chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, [chatInput]);

  // When paper style is toggled, update canvas background color live
  useEffect(() => {
    if (!excalidrawAPI) return;
    const appState = excalidrawAPI.getAppState();
    const nextBg = paperStyle ? PAPER_BG : "#ffffff";
    if (appState.viewBackgroundColor !== nextBg) {
      excalidrawAPI.updateScene({ appState: { ...appState, viewBackgroundColor: nextBg } });
    }
  }, [paperStyle, excalidrawAPI]);

  // Memoize object-literal props to prevent Excalidraw re-renders on unrelated
  // NotesStudio state changes (e.g. characterCount, isSaving, etc.)
  const excalidrawUIOptions = useMemo(() => ({
    canvasActions: {
      changeViewBackgroundColor: false,
      clearCanvas: false,
      export: false,
      loadScene: false,
      saveAsImage: false,
      saveScene: false,
      toggleTheme: false,
    },
    tools: { image: false },
  }), []);

  const excalidrawDefaultAppState = useMemo(() => ({
    viewBackgroundColor: paperStyle ? PAPER_BG : "#ffffff",
    currentItemStrokeColor: "#6366f1",
    currentItemBackgroundColor: "transparent",
    currentStrokeWidth: 2,
    zoom: { value: 1 },
  }), [paperStyle]);

  const MenuBar = ({ editor }) => {
    if (!editor) {
      return null;
    }

    const isActive = (name) => editor.isActive(name);

    return (
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 rounded-t-xl">
        {/* Heading Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 hover:bg-muted"
            >
              <Type className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <PhosphorIcon icon={TextHOne} className="w-4 h-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <PhosphorIcon icon={TextHTwo} className="w-4 h-4 mr-2" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <PhosphorIcon icon={TextHThree} className="w-4 h-4 mr-2" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 hover:bg-muted ${isActive('bold') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <PhosphorIcon icon={TextBolder} className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 hover:bg-muted ${isActive('italic') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <PhosphorIcon icon={TextItalic} className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 hover:bg-muted ${isActive('underline') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <PhosphorIcon icon={TextUnderline} className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 hover:bg-muted ${isActive('bulletList') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <PhosphorIcon icon={ListBullets} className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 hover:bg-muted ${isActive('orderedList') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <PhosphorIcon icon={ListNumbers} className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Code Block */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 hover:bg-muted ${isActive('codeBlock') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <PhosphorIcon icon={Code} className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Horizontal Rule */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-muted"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Chat-first header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Notes Studio</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setSheetOpen(true)}
        >
          <PanelRightOpen className="h-4 w-4" />
          Open editor
        </Button>
      </header>

      {/* Chat area (primary view) */}
      <main className="flex-1 flex flex-col min-h-0">
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="mx-auto max-w-2xl space-y-4">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <MessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Ask for notes, outlines, or diagram ideas</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Chat here, then open the editing page to write or draw. You can also generate diagrams from your note text.
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === "user" && <p className="text-sm">{msg.content}</p>}
                    {msg.role === "assistant" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3 gap-1.5"
                        onClick={() => setSheetOpen(true)}
                      >
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        Edit in studio
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="shrink-0 border-t border-border bg-card/30 p-4">
          <div className="mx-auto flex max-w-2xl gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              placeholder="Ask for an outline, bullet points, or diagram idea..."
              rows={1}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              size="icon"
              className="shrink-0 rounded-xl h-11 w-11"
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Editing panel (Sheet) — note + canvas */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="w-full max-w-[95vw] sm:max-w-4xl overflow-hidden flex flex-col p-0 gap-0"
        >
          <SheetHeader className="shrink-0 px-6 py-4 border-b border-border">
            <SheetTitle className="text-left">Editing page</SheetTitle>
          </SheetHeader>
          {/* Top Bar for note (inside sheet) */}
          <div className="flex shrink-0 items-center justify-between px-6 py-3 border-b border-border bg-card/50">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col">
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setNoteErrors((p) => ({ ...p, title: undefined })); }}
                  className={`text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 max-w-md ${noteErrors.title ? "border-b border-destructive" : ""}`}
                  placeholder="Enter note title..."
                />
                {noteErrors.title && (
                  <p className="text-sm md:text-xs text-destructive mt-0.5">{noteErrors.title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowTemplateModal(true)}
              >
                <Layout className="w-4 h-4 text-primary/70" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
              <Button
                size="sm"
                className="gap-2 min-w-[80px]"
                onClick={() => saveNote(false)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <BookMarked className="w-4 h-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Content Area (editor + canvas inside sheet) */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <PanelGroup direction="horizontal" className="h-full min-h-0">
          {/* Left Panel - Rich Text Editor (resizable: drag the handle to adjust) */}
          <Panel defaultSize={40} minSize={15} maxSize={85}>
            <div className="h-full p-6 bg-card/30 rounded-r-2xl mr-2">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Rich Text Editor Area */}
                <div className="flex-1 bg-background rounded-xl border border-border overflow-hidden flex flex-col">
                  <MenuBar editor={editor} />
                  <div className="flex-1 overflow-y-auto">
                    <EditorContent 
                      editor={editor}
                      className="h-full prose prose-sm max-w-none focus:outline-none"
                    />
                  </div>
                  {/* Validation error for content */}
                  {noteErrors.content && (
                    <p className="px-3 py-1 text-sm md:text-xs text-destructive bg-destructive/5 border-t border-destructive/20">
                      {noteErrors.content}
                    </p>
                  )}
                  {/* Character count and save status */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20 text-sm md:text-xs text-muted-foreground">
                    <span>{characterCount} characters</span>
                    <div className="flex items-center gap-2">
                      {isSaving && (
                        <span className="flex items-center gap-1 text-primary">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving…
                        </span>
                      )}
                      {!isSaving && lastAutoSaved && (
                        <span className="text-muted-foreground/70">
                          Draft auto-saved {lastAutoSaved.toLocaleTimeString()}
                        </span>
                      )}
                      {!isSaving && lastSaved && !lastAutoSaved && (
                        <span>Saved {lastSaved.toLocaleTimeString()}</span>
                      )}
                      {!lastSaved && (
                        <span className="text-muted-foreground/50">Auto-saves every 2 min</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* Resize Handle — drag to resize Notes vs Canvas */}
          <PanelResizeHandle className="w-2 flex-shrink-0 bg-border hover:bg-primary/30 active:bg-primary/40 transition-colors cursor-col-resize rounded-sm data-[resize-handle-active]:bg-primary/40" />

          {/* Right Panel - Drawing Canvas (resizable: drag the handle to adjust) */}
          <Panel defaultSize={60} minSize={15} maxSize={85}>
            <div className="h-full p-6 bg-card/30 rounded-l-2xl ml-2">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Canvas</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={paperStyle ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 px-2 gap-1.5"
                      onClick={() => setPaperStyle((p) => !p)}
                      title={paperStyle ? "Switch to plain whiteboard" : "Switch to lined paper"}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm md:text-xs">Paper</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={exportCanvasAsPNG}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setShowClearConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Excalidraw Canvas with optional lined paper overlay */}
                <div className="flex-1 rounded-xl border border-border overflow-hidden relative min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 relative">
                    <Excalidraw
                      initialData={canvasData}
                      onChange={saveCanvasState}
                      onExcalidrawAPI={handleExcalidrawAPI}
                      viewModeEnabled={false}
                      zenModeEnabled={false}
                      gridModeEnabled={!paperStyle}
                      theme="light"
                      name={title}
                      UIOptions={excalidrawUIOptions}
                      defaultAppState={excalidrawDefaultAppState}
                    />
                    {paperStyle && (
                      <div
                        className="absolute inset-0 rounded-xl pointer-events-none z-10"
                        style={{
                          backgroundImage: [
                            "repeating-linear-gradient(0deg, #e5e3df 0px, #e5e3df 1px, transparent 1px, transparent 28px)",
                            "linear-gradient(90deg, transparent 79px, #e5e3df 79px, #e5e3df 80px, transparent 80px)"
                          ].join(", "),
                          backgroundSize: "100% 28px, 100% 100%",
                          backgroundPosition: "0 0, 0 0"
                        }}
                        aria-hidden
                      />
                    )}
                  </div>
                </div>

                {/* Clear Canvas Confirmation Dialog */}
                {showClearConfirm && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
                    <div className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4">
                      <h4 className="font-semibold mb-2">Clear Canvas?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        This action cannot be undone. All drawings will be permanently deleted.
                      </p>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowClearConfirm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={clearCanvas}
                        >
                          Clear Canvas
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Bottom Bar - Tools */}
          <div className="flex shrink-0 items-center justify-between px-6 py-3 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => generateAIDiagram(false)}
            disabled={isGeneratingDiagram}
          >
            {isGeneratingDiagram ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Suggest Diagram
              </>
            )}
          </Button>
          {lastDiagramSuggestion && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-sm md:text-xs"
              onClick={() => generateAIDiagram(true)}
              disabled={isGeneratingDiagram}
            >
              <Sparkles className="w-3 h-3" />
              Regenerate
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" sideOffset={8}>
              <div className="px-2 py-1.5 text-sm md:text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                Export As
              </div>
              <DropdownMenuItem
                onClick={exportAsPDF}
                className="gap-2.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">PDF</p>
                  <p className="text-sm md:text-[11px] text-muted-foreground">Text + canvas combined</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportCanvasAsPNG}
                className="gap-2.5 cursor-pointer"
              >
                <Image className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">PNG Image</p>
                  <p className="text-sm md:text-[11px] text-muted-foreground">Canvas drawing only</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsMarkdown}
                className="gap-2.5 cursor-pointer"
              >
                <FileType className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Markdown</p>
                  <p className="text-sm md:text-[11px] text-muted-foreground">Text content only</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>
        </SheetContent>
      </Sheet>

      {/* Template Gallery Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="text-sm md:text-xs">All</TabsTrigger>
              <TabsTrigger value="Study Guide" className="text-sm md:text-xs">Study Guide</TabsTrigger>
              <TabsTrigger value="Cornell Notes" className="text-sm md:text-xs">Cornell Notes</TabsTrigger>
              <TabsTrigger value="Mind Map" className="text-sm md:text-xs">Mind Map</TabsTrigger>
              <TabsTrigger value="Process" className="text-sm md:text-xs">Flowchart</TabsTrigger>
              <TabsTrigger value="History" className="text-sm md:text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="Analysis" className="text-sm md:text-xs">Comparison</TabsTrigger>
              <TabsTrigger value="Flashcard Set" className="text-sm md:text-xs">Flashcard Set</TabsTrigger>
              <TabsTrigger value="General" className="text-sm md:text-xs">General</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto min-h-0 py-2">
              {["all", "Study Guide", "Cornell Notes", "Mind Map", "Process", "History", "Analysis", "Flashcard Set", "General"].map((category) => (
                <TabsContent key={category} value={category} className="mt-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {getTemplateList()
                      .filter((t) => category === "all" || t.category === category)
                      .map((template) => {
                        const isSelected = selectedTemplate === template.id;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => {
                              loadTemplate(template.id);
                              setShowTemplateModal(false);
                            }}
                            className={`
                              flex flex-col items-stretch gap-2 p-3 rounded-xl border-2 text-left
                              transition-all duration-150 hover:shadow-md
                              ${isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-card hover:border-primary/40"
                              }
                            `}
                          >
                            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-white border border-border/50 shadow-sm">
                              <img
                                src={template.preview}
                                alt={`${template.name} preview`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  if (e.currentTarget.nextElementSibling) {
                                    e.currentTarget.nextElementSibling.style.display = "flex";
                                  }
                                }}
                              />
                              <div
                                className="absolute inset-0 hidden items-center justify-center bg-muted"
                                style={{ display: "none" }}
                              >
                                <FileText className="w-8 h-8 text-muted-foreground" />
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm md:text-xs font-medium"
                                style={{
                                  backgroundColor: `${template.color}20`,
                                  color: template.color,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: template.color }}
                                />
                                {template.category}
                              </span>
                            </div>
                            <p className="text-sm font-semibold leading-tight text-foreground">
                              {template.name}
                            </p>
                            <p className="text-sm md:text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          </button>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
