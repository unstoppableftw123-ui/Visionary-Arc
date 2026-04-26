import { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { AuthContext, API } from "../App";
import { 
  Target, Sparkles, Briefcase, CheckCircle, 
  ArrowRight, Brain, TrendingUp,
  RotateCcw, Clock, Lightbulb, Zap
} from "lucide-react";

// Assessment Questions - IQ/Personality Style
const ASSESSMENT_QUESTIONS = [
  // Cognitive Style
  {
    id: 1,
    category: "cognitive",
    question: "When solving a complex problem, you prefer to:",
    options: [
      { text: "Break it into smaller parts and tackle each systematically", trait: "analytical", score: 3 },
      { text: "Look for patterns and connections to similar problems", trait: "pattern", score: 3 },
      { text: "Brainstorm multiple creative solutions first", trait: "creative", score: 3 },
      { text: "Discuss it with others to get different perspectives", trait: "collaborative", score: 3 }
    ]
  },
  {
    id: 2,
    category: "cognitive",
    question: "If 2, 6, 18, 54, __, what comes next?",
    options: [
      { text: "108", trait: "analytical", score: 1 },
      { text: "162", trait: "analytical", score: 3 },
      { text: "72", trait: "analytical", score: 0 },
      { text: "216", trait: "analytical", score: 0 }
    ]
  },
  {
    id: 3,
    category: "cognitive",
    question: "You remember information best when you:",
    options: [
      { text: "Read it and take notes", trait: "visual", score: 3 },
      { text: "Hear it explained or discuss it", trait: "auditory", score: 3 },
      { text: "Practice or do hands-on activities", trait: "kinesthetic", score: 3 },
      { text: "Create mental images or diagrams", trait: "spatial", score: 3 }
    ]
  },
  // Work Style
  {
    id: 4,
    category: "work",
    question: "Your ideal work environment is:",
    options: [
      { text: "Quiet space where you can focus deeply alone", trait: "independent", score: 3 },
      { text: "Dynamic office with constant collaboration", trait: "social", score: 3 },
      { text: "Flexible - sometimes alone, sometimes with others", trait: "adaptable", score: 3 },
      { text: "Remote with freedom to set your own schedule", trait: "autonomous", score: 3 }
    ]
  },
  {
    id: 5,
    category: "work",
    question: "When starting a new project, you typically:",
    options: [
      { text: "Create a detailed plan before taking action", trait: "planner", score: 3 },
      { text: "Dive in and figure it out as you go", trait: "action", score: 3 },
      { text: "Research extensively first", trait: "researcher", score: 3 },
      { text: "Seek input from experienced people", trait: "mentor-seeker", score: 3 }
    ]
  },
  {
    id: 6,
    category: "work",
    question: "Under pressure, you tend to:",
    options: [
      { text: "Stay calm and methodical", trait: "composed", score: 3 },
      { text: "Get energized and work faster", trait: "driven", score: 3 },
      { text: "Seek support from your team", trait: "collaborative", score: 3 },
      { text: "Take a step back to reassess priorities", trait: "strategic", score: 3 }
    ]
  },
  // Personality
  {
    id: 7,
    category: "personality",
    question: "At a social gathering, you usually:",
    options: [
      { text: "Enjoy meeting new people and being the center of attention", trait: "extrovert", score: 3 },
      { text: "Prefer deep conversations with a few people", trait: "introvert", score: 3 },
      { text: "Float between groups, adapting to each", trait: "ambivert", score: 3 },
      { text: "Observe and listen more than talk", trait: "observer", score: 3 }
    ]
  },
  {
    id: 8,
    category: "personality",
    question: "When making decisions, you rely more on:",
    options: [
      { text: "Logic and objective analysis", trait: "thinker", score: 3 },
      { text: "Gut feeling and intuition", trait: "intuitive", score: 3 },
      { text: "How it will affect others", trait: "empathetic", score: 3 },
      { text: "Past experiences and proven methods", trait: "practical", score: 3 }
    ]
  },
  {
    id: 9,
    category: "personality",
    question: "Your friends would describe you as:",
    options: [
      { text: "The reliable one who always follows through", trait: "dependable", score: 3 },
      { text: "The creative one with wild ideas", trait: "creative", score: 3 },
      { text: "The leader who takes charge", trait: "leader", score: 3 },
      { text: "The supportive one who listens", trait: "supportive", score: 3 }
    ]
  },
  // Values & Motivation
  {
    id: 10,
    category: "values",
    question: "What motivates you most in your work?",
    options: [
      { text: "Making a meaningful impact on others", trait: "purpose", score: 3 },
      { text: "Achieving mastery and excellence", trait: "mastery", score: 3 },
      { text: "Financial success and security", trait: "security", score: 3 },
      { text: "Freedom and independence", trait: "autonomy", score: 3 }
    ]
  },
  {
    id: 11,
    category: "values",
    question: "In 5 years, you want to be:",
    options: [
      { text: "Running your own business or project", trait: "entrepreneur", score: 3 },
      { text: "A recognized expert in your field", trait: "specialist", score: 3 },
      { text: "Leading a team or organization", trait: "leader", score: 3 },
      { text: "Living a balanced, fulfilling life", trait: "balanced", score: 3 }
    ]
  },
  {
    id: 12,
    category: "values",
    question: "Which statement resonates most with you?",
    options: [
      { text: "I want to create things that didn't exist before", trait: "creator", score: 3 },
      { text: "I want to help people solve their problems", trait: "helper", score: 3 },
      { text: "I want to understand how everything works", trait: "analyst", score: 3 },
      { text: "I want to build and grow something lasting", trait: "builder", score: 3 }
    ]
  }
];

// Career mapping based on traits
const CAREER_MAPPING = {
  analytical: ["Data Scientist", "Financial Analyst", "Software Engineer", "Research Scientist"],
  creative: ["UX Designer", "Product Designer", "Content Creator", "Marketing Director"],
  leader: ["CEO", "Product Manager", "Team Lead", "Entrepreneur"],
  collaborative: ["Project Manager", "HR Manager", "Sales Director", "Community Manager"],
  technical: ["Software Engineer", "DevOps Engineer", "Systems Architect", "CTO"],
  empathetic: ["Therapist", "Teacher", "Nurse", "Social Worker", "Customer Success"],
  strategic: ["Management Consultant", "Business Analyst", "Strategy Director"],
  builder: ["Entrepreneur", "Product Manager", "Real Estate Developer", "Contractor"]
};

// Skill recommendations based on traits
const SKILL_MAPPING = {
  analytical: [{ name: "Python/SQL", days: 30 }, { name: "Statistics", days: 21 }, { name: "Excel Advanced", days: 14 }],
  creative: [{ name: "Figma/Design", days: 30 }, { name: "Copywriting", days: 21 }, { name: "Video Editing", days: 28 }],
  leader: [{ name: "Public Speaking", days: 21 }, { name: "Negotiation", days: 14 }, { name: "Strategic Planning", days: 30 }],
  technical: [{ name: "System Design", days: 30 }, { name: "Cloud (AWS)", days: 28 }, { name: "Algorithms", days: 21 }],
  collaborative: [{ name: "Facilitation", days: 14 }, { name: "Conflict Resolution", days: 21 }, { name: "Project Management", days: 28 }]
};

export default function Strengths() {
  const { token } = useContext(AuthContext);
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);
  
  const [step, setStep] = useState("loading"); // loading, intro, assessment, results
  const [profile, setProfile] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [traits, setTraits] = useState({});
  const [processing, setProcessing] = useState(false);
  const startTimeRef = useRef(null);

  const checkProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/profile/strength`, { headers, withCredentials: true });
      if (res.data && res.data.strengths && res.data.strengths.length > 0) {
        setProfile(res.data);
        setStep("results");
      } else {
        setStep("intro");
      }
    } catch (e) {
      setStep("intro");
    }
  }, [headers]);

  useEffect(() => {
    checkProfile();
  }, [checkProfile]);

  const startAssessment = () => {
    setStep("assessment");
    setCurrentQ(0);
    setAnswers({});
    setTraits({});
    startTimeRef.current = Date.now();
  };

  const selectAnswer = (optionIndex) => {
    const question = ASSESSMENT_QUESTIONS[currentQ];
    const option = question.options[optionIndex];
    
    // Update answers
    setAnswers({ ...answers, [currentQ]: optionIndex });
    
    // Update traits
    const newTraits = { ...traits };
    newTraits[option.trait] = (newTraits[option.trait] || 0) + option.score;
    setTraits(newTraits);
    
    // Auto-advance after short delay
    setTimeout(() => {
      if (currentQ < ASSESSMENT_QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        processResults(newTraits);
      }
    }, 300);
  };

  const processResults = async (finalTraits) => {
    setProcessing(true);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    // Calculate top traits
    const sortedTraits = Object.entries(finalTraits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Generate strengths
    const strengths = sortedTraits.map(([trait, score], idx) => ({
      name: trait.charAt(0).toUpperCase() + trait.slice(1),
      score: Math.min(95, 60 + score * 5 + Math.random() * 10),
      description: getTraitDescription(trait)
    }));
    
    // Generate career clusters
    const topTraitNames = sortedTraits.map(t => t[0]);
    const careers = [];
    const seenCareers = new Set();
    topTraitNames.forEach(trait => {
      (CAREER_MAPPING[trait] || []).forEach(career => {
        if (!seenCareers.has(career) && careers.length < 4) {
          seenCareers.add(career);
          careers.push({
            name: career,
            match: Math.round(70 + Math.random() * 25),
            why: `Aligns with your ${trait} strength`
          });
        }
      });
    });
    
    // Generate skill paths
    const skills = [];
    const seenSkills = new Set();
    topTraitNames.slice(0, 2).forEach(trait => {
      (SKILL_MAPPING[trait] || SKILL_MAPPING.analytical).forEach(skill => {
        if (!seenSkills.has(skill.name) && skills.length < 4) {
          seenSkills.add(skill.name);
          skills.push({ ...skill, why: `Builds on your ${trait} nature` });
        }
      });
    });
    
    // Generate lock-in plan
    const lockInPlan = {
      non_negotiable: getLockInTask(topTraitNames[0], "non_negotiable"),
      growth: getLockInTask(topTraitNames[1] || topTraitNames[0], "growth"),
      bonus: getLockInTask(topTraitNames[2] || topTraitNames[0], "bonus")
    };
    
    const profileData = {
      strengths,
      career_clusters: careers,
      skill_paths: skills,
      lock_in_plan: lockInPlan,
      traits: finalTraits,
      time_taken: timeTaken,
      completed_at: new Date().toISOString()
    };
    
    // Save to backend
    try {
      await axios.post(`${API}/onboarding`, {
        future_goals: topTraitNames.slice(0, 3),
        strengths: topTraitNames,
        daily_routine: "",
        challenges: []
      }, { headers, withCredentials: true });
    } catch (e) {
      console.error("Failed to save profile");
    }
    
    setProfile(profileData);
    setProcessing(false);
    setStep("results");
  };

  const getTraitDescription = (trait) => {
    const descriptions = {
      analytical: "You excel at breaking down complex problems into manageable parts",
      creative: "You naturally think outside the box and generate novel ideas",
      leader: "You inspire and guide others toward shared goals",
      collaborative: "You thrive when working with others and value teamwork",
      pattern: "You quickly spot connections and patterns others miss",
      visual: "You process information best through images and spatial understanding",
      planner: "You prefer having a clear roadmap before taking action",
      action: "You learn by doing and adapt quickly on the fly",
      composed: "You stay calm and focused even under pressure",
      driven: "Challenges energize you and push you to perform better",
      strategic: "You excel at seeing the big picture and long-term planning",
      thinker: "You make decisions based on logic and objective analysis",
      intuitive: "You trust your instincts and can read situations quickly",
      empathetic: "You naturally understand and connect with others' emotions",
      dependable: "People count on you to follow through consistently",
      purpose: "You're driven by meaningful work that makes a difference",
      mastery: "You're motivated by becoming excellent at what you do",
      entrepreneur: "You have a natural drive to build and create",
      builder: "You're energized by creating things that last"
    };
    return descriptions[trait] || `You have strong ${trait} tendencies`;
  };

  const getLockInTask = (trait, type) => {
    const tasks = {
      analytical: {
        non_negotiable: "Solve one complex problem requiring deep analysis",
        growth: "Learn a new analytical tool or method",
        bonus: "Review and optimize one existing process"
      },
      creative: {
        non_negotiable: "Generate 3 new ideas for current projects",
        growth: "Explore a creative medium outside your comfort zone",
        bonus: "Share one creative work with others for feedback"
      },
      leader: {
        non_negotiable: "Have one meaningful conversation that moves a project forward",
        growth: "Practice giving constructive feedback",
        bonus: "Identify and mentor someone on your team"
      },
      collaborative: {
        non_negotiable: "Contribute meaningfully to a team discussion",
        growth: "Reach out to a new contact or colleague",
        bonus: "Help someone else with their challenge"
      }
    };
    const defaultTasks = {
      non_negotiable: "Complete your most important task before noon",
      growth: "Learn something new for 30 minutes",
      bonus: "Reflect on what went well today"
    };
    return (tasks[trait] || defaultTasks)[type];
  };

  const retakeAssessment = () => {
    setProfile(null);
    setAnswers({});
    setTraits({});
    setCurrentQ(0);
    setStep("intro");
  };

  // Loading
  if (step === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Intro
  if (step === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center p-4 md:p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-700 to-orange-600 flex items-center justify-center">
              <Brain className="w-10 h-10 text-[var(--text-primary)]" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Discover Your Strengths</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              A 12-question assessment to uncover your natural talents, ideal career paths, and personalized growth plan.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-sm">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="font-medium">5 minutes</div>
                  <div className="text-muted-foreground">Quick & focused</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Lightbulb className="w-6 h-6 mx-auto mb-2 text-brand-orange" />
                  <div className="font-medium">Science-based</div>
                  <div className="text-muted-foreground">Proven methods</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <div className="font-medium">Actionable</div>
                  <div className="text-muted-foreground">Real insights</div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-8 text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">You'll discover:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Your top 5 cognitive strengths</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Career paths aligned to your nature</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Skills to develop based on your profile</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> A personalized daily "Lock-In Plan"</li>
                </ul>
              </CardContent>
            </Card>
            
            <Button size="lg" onClick={startAssessment} className="px-8">
              Start Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-sm md:text-xs text-muted-foreground mt-4">No wrong answers. Go with your gut.</p>
          </div>
    );
  }

  // Assessment
  if (step === "assessment") {
    const question = ASSESSMENT_QUESTIONS[currentQ];
    const progress = ((currentQ + 1) / ASSESSMENT_QUESTIONS.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQ + 1} of {ASSESSMENT_QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Category Badge */}
            <Badge variant="secondary" className="mb-4 capitalize">
              {question.category}
            </Badge>
            
            {/* Question */}
            <h2 className="text-xl md:text-2xl font-semibold mb-8">{question.question}</h2>
            
            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  className={`w-full p-4 rounded-xl text-left transition-all border hover:border-primary hover:bg-primary/5 ${
                    answers[currentQ] === idx ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{option.text}</span>
                    {answers[currentQ] === idx && <CheckCircle className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
    );
  }

  // Processing
  if (processing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-lg font-medium mb-2">Analyzing your responses...</p>
            <p className="text-muted-foreground">Building your personalized profile</p>
          </div>
      </div>
    );
  }

  // Results
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-orange-700 to-orange-600 text-[var(--text-primary)]">
              <Sparkles className="w-3 h-3 mr-1" /> Assessment Complete
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Your Strength Profile</h1>
            <p className="text-muted-foreground">Here's what makes you uniquely powerful</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths Radar */}
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" /> Your Top Strengths
                </h2>
                <div className="space-y-4">
                  {profile?.strengths?.map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(s.score)}%</span>
                      </div>
                      <Progress value={s.score} className="h-3 mb-1" />
                      <p className="text-sm md:text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Career Matches */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> Career Matches
                </h2>
                <div className="space-y-3">
                  {profile?.career_clusters?.map((c, i) => (
                    <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{c.name}</span>
                        <Badge variant="outline">{c.match}%</Badge>
                      </div>
                      <p className="text-sm md:text-xs text-muted-foreground">{c.why}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Paths */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Skill Paths
                </h2>
                <div className="space-y-3">
                  {profile?.skill_paths?.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{s.days}d</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-sm md:text-xs text-muted-foreground">{s.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lock-In Plan */}
            <Card className="md:col-span-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Your Daily Lock-In Plan
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-sm md:text-xs font-medium uppercase text-muted-foreground">Non-negotiable</span>
                    </div>
                    <p className="text-sm font-medium">{profile?.lock_in_plan?.non_negotiable}</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm md:text-xs font-medium uppercase text-muted-foreground">Growth</span>
                    </div>
                    <p className="text-sm font-medium">{profile?.lock_in_plan?.growth}</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-brand-orange" />
                      </div>
                      <span className="text-sm md:text-xs font-medium uppercase text-muted-foreground">Bonus</span>
                    </div>
                    <p className="text-sm font-medium">{profile?.lock_in_plan?.bonus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Retake Button */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={retakeAssessment}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retake Assessment
            </Button>
            <p className="text-sm md:text-xs text-muted-foreground mt-2">You can retake anytime to track your growth</p>
          </div>
        </div>
  );
}
