import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Calendar } from "../components/ui/calendar";
import { Slider } from "../components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import useApi from "../hooks/useApi";
import { toast } from "sonner";
import { taskSchema, formatZodErrors } from "../lib/validation";
import { 
  Plus, 
  Flame, 
  Calendar as CalendarIcon, 
  Trash2, 
  LayoutTemplate
} from "lucide-react";

export default function TasksPage() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("default");
  const [isTemplate, setIsTemplate] = useState(false);
  const [taskErrors, setTaskErrors] = useState({});
  const usedTemplateRef = useRef(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.tasks.getTasks();
      setTasks(response);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchTemplates = useCallback(async () => {
    try {
      // For now, filter tasks that are templates
      const allTasks = await api.tasks.getTasks();
      setTemplates(allTasks.filter(task => task.is_template));
    } catch (error) {
      console.error("Failed to load templates");
    }
  }, [api]);

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, [fetchTasks, fetchTemplates]);

  // When arriving from Profile "Use Template", create task from template and clear state
  useEffect(() => {
    const template = location.state?.useTemplate;
    if (!template) {
      usedTemplateRef.current = false;
      return;
    }
    if (!api?.tasks?.createTask || usedTemplateRef.current) return;
    usedTemplateRef.current = true;
    (async () => {
      try {
        const response = await api.tasks.createTask({
          title: template.title,
          description: template.description || "",
          category: template.category || "default",
          is_template: false
        });
        setTasks((prev) => [...prev, response]);
        toast.success("Task created from template!");
      } catch (err) {
        toast.error("Failed to create task from template");
      }
      navigate("/tasks", { replace: true, state: {} });
    })();
  }, [location.state?.useTemplate, api?.tasks?.createTask, navigate]);

  const handleCreateTask = async () => {
    setTaskErrors({});
    const result = taskSchema.safeParse({ title, description });
    if (!result.success) {
      setTaskErrors(formatZodErrors(result.error));
      return;
    }

    try {
      const response = await api.tasks.createTask({
        title,
        description,
        category,
        is_template: isTemplate
      });
      
      if (isTemplate) {
        setTemplates([...templates, response]);
        toast.success("Template created!");
      } else {
        setTasks([...tasks, response]);
        toast.success("Task created!");
      }
      
      resetForm();
      setNewTaskOpen(false);
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleCheckIn = async (taskId, date) => {
    try {
      // Mock check-in functionality - would normally be a separate API call
      const response = await api.tasks.updateTask(taskId, {
        checked_in: true,
        check_in_date: date
      });
      
      setTasks(tasks.map(t => t.task_id === taskId ? response : t));
      toast.success("Checked in! +5 XP");
    } catch (error) {
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async (taskId, date) => {
    try {
      // Mock check-out functionality
      const response = await api.tasks.updateTask(taskId, {
        checked_in: false,
        check_out_date: date
      });
      
      setTasks(tasks.map(t => t.task_id === taskId ? response : t));
    } catch (error) {
      toast.error("Failed to check out");
    }
  };

  const handleProgressChange = async (taskId, progress) => {
    try {
      const response = await api.tasks.updateTaskProgress(taskId, progress);
      
      setTasks(tasks.map(t => t.task_id === taskId ? response : t));
      if (progress === 100) {
        toast.success("Task completed! +25 XP 🎉");
      }
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.tasks.deleteTask(taskId);
      setTasks(tasks.filter(t => t.task_id !== taskId));
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleUseTemplate = async (templateId) => {
    try {
      // Mock template usage - create a new task from template
      const template = templates.find(t => t.task_id === templateId);
      if (template) {
        const response = await api.tasks.createTask({
          title: template.title,
          description: template.description,
          category: template.category,
          is_template: false
        });
        setTasks([...tasks, response]);
        toast.success("Task created from template!");
      }
    } catch (error) {
      toast.error("Failed to use template");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("default");
    setIsTemplate(false);
    setTaskErrors({});
  };

  // Calculate completion rate
  const activeTasks = tasks.filter(t => !t.completed);
  const completedToday = tasks.filter(t => t.check_ins?.includes(selectedDateStr)).length;
  const completionRate = activeTasks.length > 0 ? (completedToday / activeTasks.length) * 100 : 0;

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === "completed") return task.check_ins?.includes(selectedDateStr);
    if (filter === "pending") return !task.check_ins?.includes(selectedDateStr);
    return true;
  });

  // Category colors
  const categoryColors = {
    default: "tag-blue",
    work: "tag-purple",
    health: "tag-green",
    learning: "tag-yellow",
    personal: "tag-red"
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="tasks-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-semibold mb-1">Tasks</h1>
            <p className="text-muted-foreground">Track your daily habits and build streaks</p>
          </div>
          <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-task-btn">
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
                <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setTaskErrors((p) => ({ ...p, title: undefined })); }}
                    placeholder="e.g., Morning Exercise"
                    data-testid="task-title-input"
                    className={taskErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {taskErrors.title && (
                    <p className="text-sm md:text-xs text-destructive">{taskErrors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setTaskErrors((p) => ({ ...p, description: undefined })); }}
                    placeholder="Add some details..."
                    data-testid="task-description-input"
                    className={taskErrors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {taskErrors.description && (
                    <p className="text-sm md:text-xs text-destructive">{taskErrors.description}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="task-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="template"
                    checked={isTemplate}
                    onCheckedChange={setIsTemplate}
                  />
                  <Label htmlFor="template" className="cursor-pointer">
                    Save as template (share with others)
                  </Label>
                </div>
                <Button onClick={handleCreateTask} className="w-full" data-testid="save-task-btn">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Progress Bar */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {selectedDateStr === todayStr ? "Today's" : selectedDate.toLocaleDateString()} Progress
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {completedToday}/{activeTasks.length} completed
                  </span>
                </div>
                <Slider
                  value={[completionRate]}
                  max={100}
                  disabled
                  className="cursor-default"
                  data-testid="tasks-progress-slider"
                />
              </CardContent>
            </Card>

            {/* Filter */}
            <div className="flex gap-2">
              <Button 
                variant={filter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={filter === "pending" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button 
                variant={filter === "completed" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Completed
              </Button>
            </div>

            {/* Task List */}
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => {
                const isChecked = task.check_ins?.includes(selectedDateStr);
                const progress = task.progress || 0;
                return (
                  <motion.div
                    key={task.task_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-border hover:shadow-soft transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleCheckIn(task.task_id, selectedDateStr);
                              } else {
                                handleCheckOut(task.task_id, selectedDateStr);
                              }
                            }}
                            className="mt-1"
                            data-testid={`task-checkbox-${task.task_id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${progress === 100 ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </span>
                              <Badge variant="secondary" className={`text-sm md:text-xs ${categoryColors[task.category] || categoryColors.default}`}>
                                {task.category}
                              </Badge>
                              {progress === 100 && (
                                <Badge variant="secondary" className="text-sm md:text-xs tag-green">
                                  ✓ Complete
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            
                            {/* Progress Slider */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm md:text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className={`font-medium ${progress === 100 ? 'text-green-500' : ''}`}>{progress}%</span>
                              </div>
                              <Slider
                                value={[progress]}
                                max={100}
                                step={5}
                                onValueCommit={(value) => handleProgressChange(task.task_id, value[0])}
                                className="cursor-pointer"
                                data-testid={`task-progress-${task.task_id}`}
                              />
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm md:text-xs text-muted-foreground">
                              {task.streak > 0 && (
                                <span className="flex items-center gap-1 text-orange-500">
                                  <Flame className="w-3 h-3" /> {task.streak} day streak
                                </span>
                              )}
                              <span>{task.check_ins?.length || 0} check-ins</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.task_id)}
                            className="text-muted-foreground hover:text-destructive"
                            data-testid={`delete-task-${task.task_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredTasks.length === 0 && (
              <Card className="border-border border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No tasks found</p>
                  <Button onClick={() => setNewTaskOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create your first task
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" /> Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  modifiers={{
                    hasCheckIn: tasks.flatMap(t => t.check_ins || []).map(d => new Date(d))
                  }}
                  modifiersStyles={{
                    hasCheckIn: {
                      backgroundColor: 'hsl(var(--primary) / 0.2)',
                      borderRadius: '50%'
                    }
                  }}
                  className="rounded-md"
                  data-testid="tasks-calendar"
                />
              </CardContent>
            </Card>

            {/* Templates */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5" /> Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.slice(0, 5).map((template) => (
                  <div 
                    key={template.task_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{template.title}</p>
                      <p className="text-sm md:text-xs text-muted-foreground">
                        {template.category}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleUseTemplate(template.task_id)}
                      data-testid={`use-template-${template.task_id}`}
                    >
                      Use
                    </Button>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No templates yet. Create one by checking "Save as template"
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
