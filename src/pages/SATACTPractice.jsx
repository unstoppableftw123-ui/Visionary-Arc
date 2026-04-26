import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { AuthContext, API } from "../App";
import { toast } from "sonner";
import { awardActivityXP } from "../services/xpService";
import {
  GraduationCap, Clock, CheckCircle, XCircle, ArrowRight,
  RotateCcw, ChevronRight, Flame, Zap
} from "lucide-react";
import { useFeatureGate } from "../hooks/useFeatureGate";
import LockedFeatureOverlay from "../components/LockedFeatureOverlay";

// SQL migration required in Supabase:
// INSERT INTO feature_unlocks VALUES (1000, 'sat_act_practice', 'SAT / ACT Practice', null)
// ON CONFLICT (threshold) DO NOTHING;  -- use a unique feature_key column if needed

// Mock Question Bank
const QUESTION_BANK = {
  SAT: {
    Math: [
      { id: 1, question: "If 3x + 7 = 22, what is the value of x?", options: ["3", "5", "7", "15"], correct: 1, explanation: "Subtract 7 from both sides: 3x = 15. Divide by 3: x = 5." },
      { id: 2, question: "What is the slope of the line y = 4x - 3?", options: ["4", "-3", "3", "-4"], correct: 0, explanation: "In y = mx + b form, m is the slope. Here m = 4." },
      { id: 3, question: "If f(x) = x² + 2x, what is f(3)?", options: ["9", "12", "15", "18"], correct: 2, explanation: "f(3) = 3² + 2(3) = 9 + 6 = 15." },
      { id: 4, question: "What is 25% of 80?", options: ["15", "20", "25", "40"], correct: 1, explanation: "25% = 0.25. 0.25 × 80 = 20." },
      { id: 5, question: "Simplify: (2x³)²", options: ["2x⁶", "4x⁵", "4x⁶", "2x⁵"], correct: 2, explanation: "(2x³)² = 2² × (x³)² = 4x⁶." },
    ],
    Reading: [
      { id: 1, question: "What does 'ubiquitous' most nearly mean?", options: ["Rare", "Everywhere", "Dangerous", "Ancient"], correct: 1, explanation: "Ubiquitous means present, appearing, or found everywhere." },
      { id: 2, question: "The author's tone can best be described as:", options: ["Hostile", "Indifferent", "Analytical", "Sarcastic"], correct: 2, explanation: "The passage presents facts objectively, indicating an analytical tone." },
      { id: 3, question: "Which choice best summarizes the main idea?", options: ["Technology is harmful", "Change is inevitable", "History repeats itself", "Nature is unpredictable"], correct: 1, explanation: "The central theme discusses how change is a constant force." },
      { id: 4, question: "The word 'precipitated' most nearly means:", options: ["Delayed", "Caused", "Prevented", "Ignored"], correct: 1, explanation: "Precipitated means to cause something to happen suddenly." },
      { id: 5, question: "What evidence supports the author's claim?", options: ["Personal anecdote", "Statistical data", "Expert testimony", "Historical example"], correct: 1, explanation: "The author cites specific statistics to support the argument." },
    ],
    Writing: [
      { id: 1, question: "Choose the correct sentence:", options: ["Their going to the store.", "There going to the store.", "They're going to the store.", "Theyre going to the store."], correct: 2, explanation: "They're is the contraction of 'they are'." },
      { id: 2, question: "Which is grammatically correct?", options: ["Me and him went.", "Him and I went.", "He and I went.", "He and me went."], correct: 2, explanation: "'He and I' is correct as subject pronouns." },
      { id: 3, question: "Select the best transition:", options: ["However", "Therefore", "Meanwhile", "Furthermore"], correct: 1, explanation: "Therefore indicates a logical conclusion from the previous statement." },
      { id: 4, question: "Identify the error: 'The team are playing well.'", options: ["No error", "team are", "playing well", "The team"], correct: 1, explanation: "Team is singular, so it should be 'The team is playing well.'" },
      { id: 5, question: "Choose the most concise option:", options: ["In spite of the fact that", "Although", "Due to the fact that", "Regardless of whether"], correct: 1, explanation: "'Although' is the most concise way to express contrast." },
    ],
  },
  ACT: {
    Math: [
      { id: 1, question: "What is the area of a circle with radius 7?", options: ["14π", "49π", "21π", "7π"], correct: 1, explanation: "Area = πr² = π(7)² = 49π." },
      { id: 2, question: "Solve: |x - 3| = 5", options: ["x = 8 or x = -2", "x = 8 only", "x = -2 only", "x = 2 or x = 8"], correct: 0, explanation: "x - 3 = 5 gives x = 8; x - 3 = -5 gives x = -2." },
      { id: 3, question: "What is sin(30°)?", options: ["1", "0.5", "√3/2", "√2/2"], correct: 1, explanation: "sin(30°) = 1/2 = 0.5." },
      { id: 4, question: "Factor: x² - 9", options: ["(x-3)²", "(x+3)²", "(x-3)(x+3)", "(x-9)(x+1)"], correct: 2, explanation: "Difference of squares: a² - b² = (a-b)(a+b)." },
      { id: 5, question: "What is log₁₀(100)?", options: ["1", "2", "10", "100"], correct: 1, explanation: "log₁₀(100) = log₁₀(10²) = 2." },
    ],
    English: [
      { id: 1, question: "Which punctuation is correct?", options: ["Its a nice day.", "It's a nice day.", "Its' a nice day.", "Its a nice day"], correct: 1, explanation: "It's is the contraction of 'it is'." },
      { id: 2, question: "Choose the correct verb:", options: ["The data shows", "The data show", "The data showing", "The data shown"], correct: 1, explanation: "Data is plural, so 'show' is correct." },
      { id: 3, question: "Select proper semicolon use:", options: ["I went; to the store", "I went to the store; it was closed", "I; went to the store", "I went to; the store"], correct: 1, explanation: "Semicolons connect two independent clauses." },
      { id: 4, question: "Which is parallel structure?", options: ["Running, to swim, biking", "Running, swimming, biking", "To run, swimming, bike", "Run, to swim, biked"], correct: 1, explanation: "Parallel structure uses the same grammatical form." },
      { id: 5, question: "Identify the modifier error:", options: ["Walking home, the rain started.", "She quickly ran.", "The red car stopped.", "He carefully opened it."], correct: 0, explanation: "Dangling modifier: the rain wasn't walking home." },
    ],
    Reading: [
      { id: 1, question: "The passage primarily discusses:", options: ["A scientific theory", "A historical event", "A personal narrative", "A policy debate"], correct: 0, explanation: "The passage explains and analyzes a scientific concept." },
      { id: 2, question: "According to the passage, what caused the change?", options: ["Economic factors", "Political pressure", "Technological advances", "Social movements"], correct: 2, explanation: "The passage explicitly states technology drove the change." },
      { id: 3, question: "The author would most likely agree that:", options: ["Progress is harmful", "Change requires adaptation", "Tradition is best", "Science is flawed"], correct: 1, explanation: "The author emphasizes the need to adapt to new circumstances." },
      { id: 4, question: "What is the function of paragraph 3?", options: ["Introduce a counterargument", "Provide evidence", "Summarize findings", "Define key terms"], correct: 1, explanation: "Paragraph 3 presents supporting evidence for the main claim." },
      { id: 5, question: "The word 'paradigm' refers to:", options: ["A problem", "A framework", "A solution", "A question"], correct: 1, explanation: "Paradigm means a typical example or pattern of something." },
    ],
    Science: [
      { id: 1, question: "Based on Figure 1, as temperature increases:", options: ["Pressure decreases", "Pressure increases", "Volume decreases", "Mass increases"], correct: 1, explanation: "The graph shows a direct relationship between temperature and pressure." },
      { id: 2, question: "Which hypothesis is supported by the data?", options: ["Hypothesis 1", "Hypothesis 2", "Both hypotheses", "Neither hypothesis"], correct: 0, explanation: "The data points align with the predictions of Hypothesis 1." },
      { id: 3, question: "What is the independent variable?", options: ["Time", "Temperature", "Concentration", "Volume"], correct: 1, explanation: "Temperature is manipulated by the researcher." },
      { id: 4, question: "The control group received:", options: ["The treatment", "No treatment", "Double treatment", "Alternative treatment"], correct: 1, explanation: "Control groups don't receive the experimental treatment." },
      { id: 5, question: "According to Table 2, which trial had the highest yield?", options: ["Trial 1", "Trial 2", "Trial 3", "Trial 4"], correct: 2, explanation: "Trial 3 shows 95% yield, the highest among all trials." },
    ],
  },
};

// Founders Rush Config
const FOUNDERS_LAUNCH_DATE = new Date("2025-01-01");
const FOUNDERS_LIMIT = 5000;

export default function SATACTPractice() {
  const { user, token, setUser } = useContext(AuthContext);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { unlocked, threshold, currentUsers, loading: gateLoading } = useFeatureGate('sat_act_practice');

  // Practice State
  const [step, setStep] = useState("choose-test"); // choose-test, choose-section, practice, review
  const [testType, setTestType] = useState(null); // SAT or ACT
  const [section, setSection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);

  // Timer
  useEffect(() => {
    if (step === "practice" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const startPractice = (test, sec) => {
    setTestType(test);
    setSection(sec);
    const qs = QUESTION_BANK[test][sec] || [];
    setQuestions(qs);
    setCurrentQ(0);
    setAnswers({});
    setShowExplanation(false);
    setTimeLeft(qs.length * 90); // 90 seconds per question
    setStartTime(Date.now());
    setStep("practice");
  };

  const selectAnswer = (idx) => {
    if (answers[currentQ] !== undefined) return; // Already answered
    setAnswers({ ...answers, [currentQ]: idx });
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const incorrect = questions.length - correct;
    const accuracy = Math.round((correct / questions.length) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    const stats = { correct, incorrect, accuracy, timeSpent, testType, section };
    setSessionStats(stats);
    setStep("review");

    // Save stats to backend
    try {
      await axios.post(`${API}/practice/stats`, stats, { headers, withCredentials: true });
    } catch (e) {
      console.error("Failed to save stats");
    }

    if (user?.id) {
      const reward = await awardActivityXP(user.id, "practice", null).catch(() => null);
      if (reward?.awarded) {
        setUser((prev) => prev ? ({
          ...prev,
          xp: (prev.xp ?? 0) + reward.xpGained,
          coins: (prev.coins ?? 0) + reward.coinsGained,
        }) : prev);
        toast.success(`+${reward.xpGained} XP and +${reward.coinsGained} coins`);
      }
    }
  };

  const getMissedQuestions = () => {
    return questions.filter((q, i) => answers[i] !== q.correct).map((q, i) => ({
      ...q,
      userAnswer: answers[questions.indexOf(q)],
      questionIndex: questions.indexOf(q),
    }));
  };

  const resetPractice = () => {
    setStep("choose-test");
    setTestType(null);
    setSection(null);
    setQuestions([]);
    setCurrentQ(0);
    setAnswers({});
    setShowExplanation(false);
    setSessionStats(null);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Founders Rush
  const daysRemaining = Math.max(0, Math.ceil((FOUNDERS_LAUNCH_DATE.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)));
  const foundersRemaining = FOUNDERS_LIMIT - (user?.founders_count || 4832);

  const handleUpgradeToLite = async () => {
    try {
      const res = await axios.post(`${API}/user/upgrade-lite`, {}, { headers, withCredentials: true });
      setUser(res.data);
      toast.success(res.data.is_lite_founder ? "🔥 Welcome, Lite Founder!" : "Upgraded to Lite!");
    } catch (e) {
      toast.error("Upgrade failed");
    }
  };

  const isLite = user?.plan === "lite";

  return (
    <div className="relative min-h-screen">
    <div className="p-4 md:p-8 overflow-auto">
        {/* Founders Rush Banner */}
        {!user?.is_lite_founder && daysRemaining > 0 && foundersRemaining > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Founders Rush</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {foundersRemaining.toLocaleString()} spots • {daysRemaining} days left
            </p>
            <p className="text-sm md:text-xs text-muted-foreground">
              Upgrade to Lite now and keep future Lite upgrades forever
            </p>
          </div>
        )}

        {/* Founder Badge */}
        {user?.is_lite_founder && (
          <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-[var(--text-primary)]">
            <Flame className="w-3 h-3 mr-1" /> Lite Founder
          </Badge>
        )}

        {/* Step: Choose Test */}
        {step === "choose-test" && (
          <div className="max-w-xl mx-auto mt-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">SAT / ACT Practice</h1>
              <p className="text-muted-foreground">Choose your test to begin</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => { setTestType("SAT"); setStep("choose-section"); }}>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">SAT</div>
                  <p className="text-sm text-muted-foreground">Math, Reading, Writing</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => { setTestType("ACT"); setStep("choose-section"); }}>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">ACT</div>
                  <p className="text-sm text-muted-foreground">Math, English, Reading, Science</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Choose Section */}
        {step === "choose-section" && (
          <div className="max-w-xl mx-auto mt-8">
            <Button variant="ghost" className="mb-4" onClick={() => setStep("choose-test")}>
              ← Back
            </Button>
            <h2 className="text-xl font-semibold mb-4">{testType} — Choose Section</h2>
            <div className="grid gap-3">
              {Object.keys(QUESTION_BANK[testType]).map((sec) => (
                <Card key={sec} className="cursor-pointer hover:border-primary transition-colors" onClick={() => startPractice(testType, sec)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{sec}</div>
                      <div className="text-sm text-muted-foreground">{QUESTION_BANK[testType][sec].length} questions</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Practice */}
        {step === "practice" && questions.length > 0 && (
          <div className="max-w-2xl mx-auto">
            {/* Timer */}
            <div className="flex items-center justify-between mb-6">
              <Badge variant="secondary">{testType} • {section}</Badge>
              <div className="flex items-center gap-2 text-sm font-mono">
                <Clock className="w-4 h-4" />
                <span className={timeLeft < 60 ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQ + 1} of {questions.length}</span>
                <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
              </div>
              <Progress value={((currentQ + 1) / questions.length) * 100} />
            </div>

            {/* Question */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-lg font-medium mb-6">{questions[currentQ].question}</p>
                <div className="space-y-3">
                  {questions[currentQ].options.map((opt, idx) => {
                    const isSelected = answers[currentQ] === idx;
                    const isCorrect = questions[currentQ].correct === idx;
                    const showResult = showExplanation;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => selectAnswer(idx)}
                        disabled={answers[currentQ] !== undefined}
                        className={`w-full p-4 rounded-lg text-left transition-all border ${
                          showResult
                            ? isCorrect
                              ? "border-green-500 bg-green-500/10"
                              : isSelected
                                ? "border-red-500 bg-red-500/10"
                                : "border-border"
                            : isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Explanation */}
            {showExplanation && (
              <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="font-medium mb-2">Explanation</div>
                  <p className="text-sm text-muted-foreground">{questions[currentQ].explanation}</p>
                </CardContent>
              </Card>
            )}

            {/* Next Button */}
            {showExplanation && (
              <Button className="w-full" onClick={nextQuestion}>
                {currentQ < questions.length - 1 ? "Next Question" : "Finish & Review"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && sessionStats && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                sessionStats.accuracy >= 80 ? "bg-green-500/10" : sessionStats.accuracy >= 60 ? "bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]" : "bg-red-500/10"
              }`}>
                <span className={`text-3xl font-bold ${
                  sessionStats.accuracy >= 80 ? "text-green-500" : sessionStats.accuracy >= 60 ? "text-brand-orange" : "text-red-500"
                }`}>{sessionStats.accuracy}%</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Session Complete</h2>
              <p className="text-muted-foreground">{testType} • {section}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{sessionStats.correct}</div>
                  <div className="text-sm md:text-xs text-muted-foreground">Correct</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{sessionStats.incorrect}</div>
                  <div className="text-sm md:text-xs text-muted-foreground">Incorrect</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{formatTime(sessionStats.timeSpent)}</div>
                  <div className="text-sm md:text-xs text-muted-foreground">Time</div>
                </CardContent>
              </Card>
            </div>

            {/* Lite Save Notice */}
            {!isLite && (
              <div className="mb-6 p-3 rounded-lg bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground">Upgrade to Lite to save your practice history</p>
              </div>
            )}

            {/* Missed Questions */}
            {getMissedQuestions().length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-4">Review Missed Questions</h3>
                <div className="space-y-4">
                  {getMissedQuestions().map((q, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <p className="font-medium mb-3">{q.question}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Your answer: {q.options[q.userAnswer]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Correct: {q.options[q.correct]}</span>
                          </div>
                          <p className="text-muted-foreground mt-2">{q.explanation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Lite Upgrade Banner on Results */}
            {!isLite && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-900/30 to-orange-950/20 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Upgrade to Lite</p>
                    <p className="text-sm text-muted-foreground">Save results, faster AI, more features</p>
                  </div>
                  <Button onClick={handleUpgradeToLite}>Upgrade</Button>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={resetPractice}>
              <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
            </Button>
          </div>
        )}
      </div>
      {!gateLoading && !unlocked && (
        <LockedFeatureOverlay
          featureName="SAT / ACT Practice"
          threshold={threshold ?? 1000}
          currentUsers={currentUsers}
        />
      )}
    </div>
  );
}
