import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { AuthContext, API } from "../App";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";
import { 
  GraduationCap, 
  Plus, 
  School,
  BookOpen,
  Users,
  Trophy,
  Megaphone,
  Crown
} from "lucide-react";

export default function Schools() {
  const { user, token } = useContext(AuthContext);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createClassOpen, setCreateClassOpen] = useState(false);
  
  // Form state
  const [schoolName, setSchoolName] = useState("");
  const [schoolDescription, setSchoolDescription] = useState("");
  const [schoolType, setSchoolType] = useState("high_school");
  const [className, setClassName] = useState("");
  const [classSubject, setClassSubject] = useState("");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await axios.get(`${API}/schools`, { headers, withCredentials: true });
      setSchools(response.data);
    } catch (error) {
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolDetails = async (schoolId) => {
    try {
      const [schoolRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/schools/${schoolId}`, { headers, withCredentials: true }),
        axios.get(`${API}/schools/${schoolId}/leaderboard`, { headers, withCredentials: true })
      ]);
      setSelectedSchool(schoolRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      toast.error("Failed to load school details");
    }
  };

  const handleCreateSchool = async () => {
    if (!schoolName.trim()) {
      toast.error("School name is required");
      return;
    }

    try {
      const response = await axios.post(`${API}/schools`, {
        name: schoolName,
        description: schoolDescription,
        school_type: schoolType
      }, { headers, withCredentials: true });
      
      setSchools([...schools, response.data]);
      setSchoolName("");
      setSchoolDescription("");
      setCreateOpen(false);
      toast.success("School created!");
      fetchSchoolDetails(response.data.school_id);
    } catch (error) {
      toast.error("Failed to create school");
    }
  };

  const handleJoinSchool = async (schoolId) => {
    try {
      await axios.post(`${API}/schools/${schoolId}/join`, {}, { headers, withCredentials: true });
      toast.success("Joined school!");
      fetchSchoolDetails(schoolId);
    } catch (error) {
      if (error.response?.data?.detail === "Already a member") {
        fetchSchoolDetails(schoolId);
      } else {
        toast.error("Failed to join school");
      }
    }
  };

  const handleCreateClass = async () => {
    if (!className.trim() || !selectedSchool) {
      toast.error("Class name is required");
      return;
    }

    try {
      await axios.post(`${API}/classes`, {
        name: className,
        school_id: selectedSchool.school_id,
        subject: classSubject
      }, { headers, withCredentials: true });
      
      setClassName("");
      setClassSubject("");
      setCreateClassOpen(false);
      toast.success("Class created!");
      fetchSchoolDetails(selectedSchool.school_id);
    } catch (error) {
      toast.error("Failed to create class");
    }
  };

  const schoolTypeInfo = {
    high_school: { label: "High School", color: "from-blue-500 to-cyan-500" },
    university: { label: "University", color: "from-orange-700 to-pink-500" },
    other: { label: "Other", color: "from-green-500 to-emerald-500" }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto" data-testid="schools-page">
        {/* Hero Header */}
        <div className="relative mb-8 p-6 md:p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-800 via-orange-700 to-orange-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zMCAxMEwyMCAyNWgyMHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="w-8 h-8 text-[var(--text-primary)]" />
                  <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Schools & Classes</h1>
                </div>
                <p className="text-[color:color-mix(in_srgb,var(--text-primary)_80%,transparent)] max-w-lg">
                  Join your school community, create classes, and compete on school leaderboards!
                </p>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-[var(--text-primary)] text-orange-400 hover:bg-[color:color-mix(in_srgb,var(--text-primary)_90%,transparent)]" data-testid="create-school-btn">
                    <Plus className="w-5 h-5 mr-2" /> Create School
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create School</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>School Name</Label>
                      <Input
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Central High School"
                        data-testid="school-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={schoolDescription}
                        onChange={(e) => setSchoolDescription(e.target.value)}
                        placeholder="Tell us about your school..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>School Type</Label>
                      <Select value={schoolType} onValueChange={setSchoolType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateSchool} className="w-full" data-testid="save-school-btn">
                      Create School
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schools List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-heading text-xl font-medium">All Schools</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {schools.map((school, index) => {
                  const typeInfo = schoolTypeInfo[school.school_type] || schoolTypeInfo.other;
                  return (
                    <motion.div
                      key={school.school_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`border-border hover:shadow-medium transition-all cursor-pointer ${
                          selectedSchool?.school_id === school.school_id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => fetchSchoolDetails(school.school_id)}
                        data-testid={`school-${school.school_id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center text-[var(--text-primary)]`}>
                              <School className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium mb-1">{school.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                {school.description || "No description"}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{typeInfo.label}</Badge>
                                <span className="text-sm md:text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {school.member_count || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {schools.length === 0 && (
              <Card className="border-border border-dashed">
                <CardContent className="py-12 text-center">
                  <School className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No schools yet</p>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create the first school
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* School Details */}
          <div>
            {selectedSchool ? (
              <Card className="border-border sticky top-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-lg">{selectedSchool.name}</CardTitle>
                    <Button size="sm" onClick={() => handleJoinSchool(selectedSchool.school_id)}>
                      Join
                    </Button>
                  </div>
                  <CardDescription>{selectedSchool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Classes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Classes
                      </h4>
                      <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Class</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Class Name</Label>
                              <Input
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="AP Chemistry"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Subject (optional)</Label>
                              <Input
                                value={classSubject}
                                onChange={(e) => setClassSubject(e.target.value)}
                                placeholder="Chemistry"
                              />
                            </div>
                            <Button onClick={handleCreateClass} className="w-full">
                              Create Class
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      {selectedSchool.classes?.map((cls) => (
                        <div 
                          key={cls.class_id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                        >
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{cls.name}</span>
                          {cls.subject && (
                            <Badge variant="outline" className="text-sm md:text-xs">{cls.subject}</Badge>
                          )}
                        </div>
                      ))}
                      {(!selectedSchool.classes || selectedSchool.classes.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No classes yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-brand-orange" /> School Leaderboard
                    </h4>
                    <div className="space-y-2">
                      {leaderboard.slice(0, 5).map((member, i) => (
                        <div 
                          key={member.user_id}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            i === 0 ? 'bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]' : i === 1 ? 'bg-[color:color-mix(in_srgb,var(--text-secondary)_10%,transparent)]' : i === 2 ? 'bg-orange-500/10' : 'bg-secondary/50'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm md:text-xs font-bold ${
                            i === 0 ? 'bg-[var(--accent)] text-[var(--text-primary)]' : i === 1 ? 'bg-[var(--text-secondary)] text-[var(--text-primary)]' : i === 2 ? 'bg-orange-500 text-[var(--text-primary)]' : 'bg-secondary'
                          }`}>
                            {i + 1}
                          </span>
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-sm md:text-xs">{member.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm truncate">{member.name}</span>
                          <span className="text-sm font-medium">{member.xp || 0} XP</span>
                        </div>
                      ))}
                      {leaderboard.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members yet
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border border-dashed">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a school to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
