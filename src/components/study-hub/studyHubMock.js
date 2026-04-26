/**
 * Mock responses for Study Hub when no API key is set.
 * Returns the same shape as callAnthropic for summaries, quizzes, flashcards, notes, and slides.
 */

const MOCK_DELAY_MS = 600;

// ─── Summary variants (by style/length) ─────────────────────────────────────
const MOCK_SUMMARIES = [
  `## Key Points

- **Main idea**: Photosynthesis converts light energy into chemical energy stored in glucose.
- **Location**: Occurs in chloroplasts; light reactions in thylakoids, Calvin cycle in stroma.
- **Inputs**: CO₂, water, light. **Outputs**: glucose, oxygen.
- **Two stages**: Light-dependent reactions (ATP, NADPH, O₂) and light-independent reactions (sugar from CO₂).

Use this as a quick reference for the overall process.`,
  `# Photosynthesis — Concise Overview

Photosynthesis is the process by which plants, algae, and some bacteria convert **light energy** into **chemical energy** (glucose). It takes place primarily in the **chloroplasts**.

### Stages

1. **Light-dependent reactions** (thylakoid membranes): Light is absorbed; water is split; ATP and NADPH are produced; oxygen is released.
2. **Calvin cycle** (stroma): CO₂ is fixed and reduced using ATP and NADPH to form glucose and other organic molecules.

### Equation (simplified)

6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂`,
  `# Detailed Summary: Photosynthesis

### Introduction

Photosynthesis is the biochemical process that underpins most life on Earth. Autotrophs use it to build organic molecules from inorganic carbon dioxide and water, releasing oxygen as a byproduct.

### Light-Dependent Reactions

- Occur in the **thylakoid membranes** of the chloroplast.
- Chlorophyll and other pigments absorb light; energy is used to split water (photolysis), producing O₂, electrons, and H⁺.
- Electron transport chains produce **ATP** and **NADPH**, which power the next stage.

### Calvin Cycle (Light-Independent)

- Occurs in the **stroma**.
- **Carbon fixation**: CO₂ is attached to RuBP (ribulose-1,5-bisphosphate) via the enzyme Rubisco.
- **Reduction**: Using ATP and NADPH, 3-carbon molecules (G3P) are formed; some leave the cycle to make glucose and other sugars.
- **Regeneration**: RuBP is regenerated so the cycle can continue.

### Takeaway

Understanding these two stages—capturing light energy, then using it to fix carbon—is essential for biology and environmental science.`,
];

// ─── Quiz variants ───────────────────────────────────────────────────────────
const MOCK_QUIZZES = [
  [
    { question: "Where do the light-dependent reactions of photosynthesis occur?", options: ["Thylakoid membranes", "Stroma", "Mitochondria", "Cytoplasm"], correct_answer: 0, explanation: "The thylakoid membranes contain the chlorophyll and electron transport chains that use light energy." },
    { question: "What is the primary product of the Calvin cycle?", options: ["ATP", "Oxygen", "Glucose", "NADPH"], correct_answer: 2, explanation: "The Calvin cycle fixes CO₂ and uses ATP and NADPH to produce sugar (e.g., glucose)." },
    { question: "Which gas is released as a byproduct of the light reactions?", options: ["CO₂", "N₂", "O₂", "H₂"], correct_answer: 2, explanation: "When water is split during photolysis, oxygen is released." },
    { question: "What molecule is the primary CO₂ acceptor in the Calvin cycle?", options: ["Glucose", "RuBP", "G3P", "ATP"], correct_answer: 1, explanation: "Ribulose-1,5-bisphosphate (RuBP) binds CO₂ in the first step of the Calvin cycle." },
    { question: "Which of the following is NOT required for photosynthesis?", options: ["Light", "Water", "Oxygen", "Carbon dioxide"], correct_answer: 2, explanation: "Oxygen is a product of photosynthesis, not an input." },
  ],
  [
    { question: "In the equation 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂, what role does water play?", options: ["Electron donor", "Carbon source", "Energy storage", "Catalyst"], correct_answer: 0, explanation: "Water is split to donate electrons to the photosynthetic electron transport chain." },
    { question: "What is the function of NADPH in photosynthesis?", options: ["Split water", "Absorb light", "Carry high-energy electrons to the Calvin cycle", "Release oxygen"], correct_answer: 2, explanation: "NADPH provides reducing power (electrons) for the Calvin cycle." },
    { question: "Which pigment is primarily responsible for capturing light in photosynthesis?", options: ["Carotene", "Chlorophyll a", "Xanthophyll", "Anthocyanin"], correct_answer: 1, explanation: "Chlorophyll a is the main photosynthetic pigment that absorbs light energy." },
    { question: "How many molecules of CO₂ are needed to produce one molecule of glucose in the Calvin cycle?", options: ["1", "3", "6", "12"], correct_answer: 2, explanation: "Six CO₂ molecules are fixed to produce one glucose (C₆H₁₂O₆)." },
    { question: "Where does carbon fixation occur?", options: ["Thylakoid lumen", "Outer chloroplast membrane", "Stroma", "Inner mitochondrial membrane"], correct_answer: 2, explanation: "The Calvin cycle, including carbon fixation, occurs in the stroma of the chloroplast." },
  ],
  [
    { question: "True or false: The Calvin cycle can occur in the dark.", options: ["True", "False"], correct_answer: 0, explanation: "The Calvin cycle does not require light directly; it uses ATP and NADPH produced in the light reactions." },
    { question: "True or false: Photosynthesis only occurs in leaves.", options: ["True", "False"], correct_answer: 1, explanation: "Any green tissue with chloroplasts (e.g., stems, unripe fruit) can perform photosynthesis." },
    { question: "True or false: C₄ plants reduce photorespiration by separating initial carbon fixation from the Calvin cycle.", options: ["True", "False"], correct_answer: 0, explanation: "C₄ plants fix CO₂ into 4-carbon compounds in mesophyll cells before the Calvin cycle in bundle sheath cells." },
    { question: "True or false: ATP is produced in the Calvin cycle.", options: ["True", "False"], correct_answer: 1, explanation: "ATP is consumed in the Calvin cycle; it is produced in the light-dependent reactions." },
    { question: "True or false: Chlorophyll reflects green light.", options: ["True", "False"], correct_answer: 0, explanation: "Chlorophyll absorbs red and blue light and reflects green, which is why plants appear green." },
  ],
];

// ─── Flashcard variants ─────────────────────────────────────────────────────
const MOCK_FLASHCARDS = [
  [
    { front: "Photosynthesis", back: "Process by which plants convert light energy into chemical energy (glucose) using CO₂ and H₂O." },
    { front: "Chloroplast", back: "Organelle where photosynthesis occurs; contains thylakoids and stroma." },
    { front: "Chlorophyll", back: "Green pigment that absorbs light energy for photosynthesis." },
    { front: "Light-dependent reactions", back: "First stage of photosynthesis; occurs in thylakoids; produces ATP, NADPH, and O₂." },
    { front: "Calvin cycle", back: "Light-independent reactions in the stroma that fix CO₂ into sugar using ATP and NADPH." },
    { front: "RuBP", back: "Ribulose-1,5-bisphosphate; the CO₂ acceptor molecule in the Calvin cycle." },
    { front: "G3P", back: "Glyceraldehyde-3-phosphate; a 3-carbon product of the Calvin cycle used to make glucose." },
    { front: "Photolysis", back: "Splitting of water by light energy; releases electrons, H⁺, and O₂." },
    { front: "NADPH", back: "Reducing agent that carries high-energy electrons to the Calvin cycle." },
    { front: "Stroma", back: "Fluid-filled space inside the chloroplast where the Calvin cycle takes place." },
  ],
  [
    { front: "What are the inputs of photosynthesis?", back: "Carbon dioxide (CO₂), water (H₂O), and light energy." },
    { front: "What are the outputs of photosynthesis?", back: "Glucose (C₆H₁₂O₆) and oxygen (O₂)." },
    { front: "Where do light reactions occur?", back: "In the thylakoid membranes of the chloroplast." },
    { front: "What is Rubisco?", back: "The enzyme that catalyzes the fixation of CO₂ to RuBP in the Calvin cycle." },
    { front: "What is the main purpose of the light reactions?", back: "To convert light energy into chemical energy (ATP and NADPH) and produce O₂." },
    { front: "What is the main purpose of the Calvin cycle?", back: "To fix CO₂ and synthesize sugar using ATP and NADPH." },
    { front: "C₄ plants", back: "Plants that fix CO₂ into a 4-carbon compound first, reducing photorespiration (e.g., corn, sugarcane)." },
    { front: "CAM plants", back: "Plants that open stomata at night to fix CO₂ and close them during the day to reduce water loss (e.g., cacti)." },
    { front: "Autotroph", back: "Organism that produces its own food from inorganic sources (e.g., via photosynthesis)." },
    { front: "Thylakoid", back: "Membrane-bound compartment inside the chloroplast; site of light-dependent reactions." },
  ],
  [
    { front: "ATP", back: "Adenosine triphosphate; energy currency of the cell; produced in light reactions, used in Calvin cycle." },
    { front: "Electron transport chain", back: "Series of proteins in the thylakoid that transfer electrons and pump H⁺ to drive ATP synthesis." },
    { front: "Photorespiration", back: "Wasteful process when Rubisco binds O₂ instead of CO₂; reduced in C₄ and CAM plants." },
    { front: "Stomata", back: "Pores on leaves that allow CO₂ in and O₂ and water vapor out." },
    { front: "Mesophyll", back: "Leaf tissue containing chloroplasts where much of photosynthesis occurs." },
    { front: "Bundle sheath", back: "In C₄ plants, cells where the Calvin cycle occurs after initial CO₂ fixation in mesophyll." },
    { front: "Grana", back: "Stacks of thylakoid membranes in the chloroplast." },
    { front: "Pigment", back: "Molecule that absorbs certain wavelengths of light; chlorophyll and carotenoids are examples." },
    { front: "Carbon fixation", back: "Incorporation of inorganic CO₂ into organic molecules (e.g., in the Calvin cycle)." },
    { front: "Reduction", back: "Gain of electrons; in photosynthesis, CO₂ is reduced to form sugar." },
  ],
];

// ─── Notes variants (markdown) ──────────────────────────────────────────────
const MOCK_NOTES = [
  `# Photosynthesis — Study Notes

## 1. Overview

- **Definition**: Conversion of light energy → chemical energy (glucose).
- **Location**: Chloroplasts (plants, algae, some bacteria).
- **Equation**: 6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂

## 2. Light-Dependent Reactions

- **Where**: Thylakoid membranes.
- **What happens**: Light absorbed → water split → ATP & NADPH made, O₂ released.
- **Key idea**: Light energy is converted into chemical energy carriers.

## 3. Calvin Cycle (Light-Independent)

- **Where**: Stroma.
- **What happens**: CO₂ fixed into organic molecules using ATP & NADPH.
- **Key enzyme**: Rubisco (fixes CO₂ to RuBP).

## 4. Summary Table

| Stage        | Location   | Inputs    | Outputs     |
|-------------|------------|-----------|-------------|
| Light react.| Thylakoids | H₂O, light| ATP, NADPH, O₂ |
| Calvin cycle| Stroma     | CO₂, ATP, NADPH | Sugar (e.g. glucose) |`,
  `# Quick Reference: Photosynthesis

### Inputs and Outputs

- **Inputs**: Carbon dioxide, water, light.
- **Outputs**: Glucose, oxygen.

### Two Main Stages

1. **Light reactions** (thylakoid): Capture light → make ATP & NADPH, release O₂.
2. **Calvin cycle** (stroma): Use ATP & NADPH to fix CO₂ → make sugar.

### Key Terms

- **Chlorophyll**: Captures light.
- **RuBP**: First CO₂ acceptor.
- **G3P**: Building block for glucose.

Memorize the equation and the locations (thylakoid vs stroma) for exams.`,
  `# Photosynthesis — Detailed Notes

### Introduction

Photosynthesis is the process that sustains most life on Earth. Autotrophs use it to build organic molecules from CO₂ and H₂O, releasing O₂.

### Light-Dependent Reactions

- Occur in **thylakoid membranes**.
- **Photosystem II**: Absorbs light, splits water (photolysis); O₂ released; electrons enter chain.
- **Photosystem I**: Re-energizes electrons; NADP⁺ reduced to **NADPH**.
- **ATP synthesis**: H⁺ gradient across thylakoid membrane drives ATP synthase → **ATP**.

### Calvin Cycle

- Occurs in **stroma**.
- **Fixation**: CO₂ + RuBP (catalyzed by Rubisco) → unstable 6C → 2 × 3C (PGA).
- **Reduction**: PGA reduced to G3P using ATP and NADPH.
- **Regeneration**: Some G3P used to regenerate RuBP (uses more ATP).
- **Output**: One G3P can leave to form glucose or other organic compounds.

### Adaptations

- **C₄ plants**: Separate initial fixation (mesophyll) from Calvin cycle (bundle sheath) to minimize photorespiration.
- **CAM plants**: Open stomata at night to fix CO₂, close during day to save water.`,
];

// ─── Slides variants ───────────────────────────────────────────────────────
const MOCK_SLIDES = [
  [
    { title: "What is Photosynthesis?", content: "Process by which plants convert light energy into chemical energy (glucose). Occurs in chloroplasts." },
    { title: "Inputs & Outputs", content: "Inputs: CO₂, water, light. Outputs: glucose, oxygen. Equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂" },
    { title: "Light-Dependent Reactions", content: "Location: thylakoid membranes. Water is split; ATP and NADPH are produced; oxygen is released." },
    { title: "Calvin Cycle", content: "Location: stroma. CO₂ is fixed using ATP and NADPH to produce sugar (e.g., glucose)." },
    { title: "Key Takeaways", content: "Two stages: capture light (thylakoid) and fix carbon (stroma). Chlorophyll captures light; Rubisco fixes CO₂." },
  ],
  [
    { title: "Photosynthesis Overview", content: "The process that feeds most life on Earth. Plants use sunlight to make sugar from CO₂ and water." },
    { title: "Chloroplast Structure", content: "Thylakoids (site of light reactions) and stroma (site of Calvin cycle). Chlorophyll is in thylakoids." },
    { title: "Light Reactions Summary", content: "Light → water split → electrons move through chain → ATP and NADPH made, O₂ released." },
    { title: "Calvin Cycle Summary", content: "CO₂ enters → fixed to RuBP → reduced to G3P using ATP/NADPH → some G3P → glucose; RuBP regenerated." },
    { title: "C₄ and CAM Plants", content: "C₄: separate fixation and Calvin cycle in space. CAM: fix CO₂ at night, close stomata by day to save water." },
    { title: "Summary", content: "Photosynthesis = light reactions (thylakoid) + Calvin cycle (stroma). Inputs: CO₂, H₂O, light. Outputs: sugar, O₂." },
  ],
];

// ─── Assignment variants (student-facing editor) ─────────────────────────────
export const MOCK_ASSIGNMENTS = [
  {
    id: "asgn-mock-1",
    title: "Cell Division Quiz",
    subject: "Biology",
    class: "Period 2 Biology",
    teacher: "Ms. Patel",
    dueDate: "Mar 20, 2026",
    estimatedMinutes: 15,
    instructions: "Answer all questions carefully. Short-answer questions are graded on key concepts, not exact wording. You may use your notes.",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        points: 2,
        question: "What is the primary purpose of mitosis?",
        options: ["Sexual reproduction", "Growth and tissue repair", "Producing gametes", "Generating genetic diversity"],
        correct: 1,
        explanation: "Mitosis produces two genetically identical daughter cells, used for growth, repair, and asexual reproduction.",
      },
      {
        id: "q2",
        type: "multiple_choice",
        points: 2,
        question: "During which phase of mitosis do chromosomes line up along the cell's equator?",
        options: ["Prophase", "Anaphase", "Metaphase", "Telophase"],
        correct: 2,
        explanation: "In Metaphase, chromosomes align at the metaphase plate before being pulled apart. Remember PMAT.",
      },
      {
        id: "q3",
        type: "true_false",
        points: 1,
        question: "Meiosis produces four genetically identical daughter cells.",
        correct: false,
        explanation: "Meiosis produces four genetically unique haploid cells through two rounds of division including crossing over.",
      },
      {
        id: "q4",
        type: "true_false",
        points: 1,
        question: "The mitotic spindle is made of microtubules.",
        correct: true,
        explanation: "The spindle apparatus is composed of microtubules that attach to chromosomes at the kinetochore and pull them apart.",
      },
      {
        id: "q5",
        type: "fill_blank",
        points: 2,
        text: "The enzyme ___ unwinds the DNA double helix before replication begins.",
        answer: "helicase",
        hint: "It's named for what it does to the helix.",
      },
      {
        id: "q6",
        type: "fill_blank",
        points: 2,
        text: "Mitosis produces ___ daughter cells, while meiosis produces ___.",
        answer: ["2", "4"],
        hint: "One is a copy; the other makes gametes.",
      },
      {
        id: "q7",
        type: "short_answer",
        points: 4,
        question: "Explain why uncontrolled mitosis is dangerous. What disease can result, and what normally prevents it?",
        sampleAnswer: "Uncontrolled mitosis can lead to cancer. Checkpoints in the cell cycle (G1, G2, M) normally detect DNA damage and halt division. Tumor suppressor genes like p53 trigger apoptosis if damage is irreparable.",
        rubric: [
          "Mentions cancer or tumor formation",
          "Identifies cell cycle checkpoints",
          "Names a specific control mechanism (p53, apoptosis, or similar)",
        ],
        minWords: 30,
      },
      {
        id: "q8",
        type: "short_answer",
        points: 3,
        question: "Compare and contrast mitosis and meiosis in terms of: (a) number of divisions, (b) genetic outcome, and (c) biological purpose.",
        sampleAnswer: "Mitosis: 1 division, 2 identical diploid cells, for growth/repair. Meiosis: 2 divisions, 4 unique haploid cells, for sexual reproduction and gamete formation.",
        rubric: [
          "Correctly states division count for each",
          "Distinguishes diploid vs haploid / identical vs unique",
          "States correct biological purpose for each",
        ],
        minWords: 40,
      },
    ],
  },
  {
    id: "asgn-mock-2",
    title: "Solving Quadratic Equations",
    subject: "Algebra II",
    class: "Period 3 Algebra II",
    teacher: "Mr. Torres",
    dueDate: "Mar 22, 2026",
    estimatedMinutes: 20,
    instructions: "Show your work where applicable. For multiple-choice, select the best answer. Partial credit is available on short-answer questions.",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        points: 2,
        question: "What are the solutions to x² - 5x + 6 = 0?",
        options: ["x = 1 and x = 6", "x = 2 and x = 3", "x = -2 and x = -3", "x = 5 and x = -1"],
        correct: 1,
        explanation: "Factor as (x - 2)(x - 3) = 0, giving x = 2 or x = 3.",
      },
      {
        id: "q2",
        type: "multiple_choice",
        points: 2,
        question: "The discriminant of ax² + bx + c = 0 is b² - 4ac. If the discriminant is negative, the equation has:",
        options: ["Two real solutions", "One real solution", "No real solutions", "Infinitely many solutions"],
        correct: 2,
        explanation: "A negative discriminant means the square root is imaginary — no real-number solutions exist.",
      },
      {
        id: "q3",
        type: "true_false",
        points: 1,
        question: "The quadratic formula works for any quadratic equation, even when factoring is difficult.",
        correct: true,
        explanation: "The quadratic formula x = (-b ± √(b²-4ac)) / 2a always works for ax² + bx + c = 0 where a ≠ 0.",
      },
      {
        id: "q4",
        type: "fill_blank",
        points: 2,
        text: "For the equation 2x² + 3x - 5 = 0, a = ___, b = ___, c = ___.",
        answer: ["2", "3", "-5"],
        hint: "Match coefficients to the standard form ax² + bx + c = 0.",
      },
      {
        id: "q5",
        type: "fill_blank",
        points: 2,
        text: "Completing the square: x² + 6x + ___ = (x + ___)².",
        answer: ["9", "3"],
        hint: "Take half of the coefficient of x, then square it.",
      },
      {
        id: "q6",
        type: "short_answer",
        points: 4,
        question: "Solve 3x² - 12 = 0 using any method. Show your steps and state both solutions.",
        sampleAnswer: "3x² = 12 → x² = 4 → x = ±2. Solutions: x = 2 and x = -2.",
        rubric: [
          "Correctly isolates x²",
          "Takes square root of both sides",
          "States both positive and negative solutions",
        ],
        minWords: 15,
      },
      {
        id: "q7",
        type: "short_answer",
        points: 3,
        question: "Explain in your own words what the vertex of a parabola represents, and how you find its x-coordinate from the standard form ax² + bx + c.",
        sampleAnswer: "The vertex is the highest or lowest point of the parabola. Its x-coordinate is found using x = -b / (2a), then substituting back to find y.",
        rubric: [
          "Describes vertex as max/min point",
          "States x = -b/(2a)",
          "Mentions substituting back for y",
        ],
        minWords: 25,
      },
    ],
  },
  {
    id: "asgn-mock-3",
    title: "Causes of World War II — Review",
    subject: "World History",
    class: "Period 5 World History",
    teacher: "Dr. Okafor",
    dueDate: "Mar 25, 2026",
    estimatedMinutes: 18,
    instructions: "All short-answer responses should use specific historical evidence. Vague answers will receive partial credit at most.",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        points: 2,
        question: "Which treaty, signed after WWI, imposed heavy reparations on Germany and is widely seen as a cause of WWII?",
        options: ["Treaty of Paris", "Treaty of Westphalia", "Treaty of Versailles", "Treaty of Brest-Litovsk"],
        correct: 2,
        explanation: "The Treaty of Versailles (1919) imposed reparations, territorial losses, and the 'war guilt clause' on Germany, fueling economic hardship and resentment.",
      },
      {
        id: "q2",
        type: "multiple_choice",
        points: 2,
        question: "What foreign policy approach did Britain and France pursue toward Hitler in the late 1930s, hoping to avoid war?",
        options: ["Containment", "Détente", "Appeasement", "Isolationism"],
        correct: 2,
        explanation: "Appeasement — most famously at Munich in 1938 — involved granting Hitler territorial demands hoping he would stop further expansion.",
      },
      {
        id: "q3",
        type: "true_false",
        points: 1,
        question: "The Molotov–Ribbentrop Pact was a non-aggression treaty between Germany and the Soviet Union signed in 1939.",
        correct: true,
        explanation: "The pact allowed Germany to invade Poland without fear of Soviet opposition, directly enabling the start of WWII.",
      },
      {
        id: "q4",
        type: "true_false",
        points: 1,
        question: "Germany's invasion of France in 1939 was the immediate event that triggered Britain and France to declare war.",
        correct: false,
        explanation: "It was Germany's invasion of Poland on September 1, 1939, not France, that prompted Britain and France to declare war two days later.",
      },
      {
        id: "q5",
        type: "fill_blank",
        points: 2,
        text: "Hitler's political party, the NSDAP, is commonly known as the ___ Party.",
        answer: "Nazi",
        hint: "It's a shortened form of the German name Nationalsozialistische.",
      },
      {
        id: "q6",
        type: "short_answer",
        points: 4,
        question: "How did the Great Depression contribute to the rise of extremist governments in Europe during the 1930s? Use at least one specific country as an example.",
        sampleAnswer: "The Great Depression caused mass unemployment and economic despair across Europe. In Germany, it devastated the Weimar Republic's credibility and drove desperate citizens toward Hitler's Nazi party, which promised economic revival and national glory. Similarly, in Italy, economic instability had earlier helped Mussolini's fascists gain power.",
        rubric: [
          "Explains economic hardship caused by the Depression",
          "Links hardship to political radicalization",
          "Cites a specific country with accurate detail",
        ],
        minWords: 40,
      },
      {
        id: "q7",
        type: "short_answer",
        points: 3,
        question: "Do you think appeasement was a reasonable strategy at the time, or was it a mistake? Defend your answer with historical evidence.",
        sampleAnswer: "Appeasement was understandable given the trauma of WWI — leaders genuinely feared another devastating war. However, it was ultimately a mistake because it emboldened Hitler. Each concession (Rhineland, Austria, Sudetenland) only increased his demands, leading to full-scale war anyway.",
        rubric: [
          "Takes a clear position",
          "Acknowledges the rationale for appeasement",
          "Uses at least one specific historical example to support the argument",
        ],
        minWords: 35,
      },
    ],
  },
];

// ─── Assignment submission result variants ────────────────────────────────────
export const MOCK_SUBMISSION_RESULTS = [
  {
    score: 17,
    maxScore: 20,
    percentage: 85,
    grade: "B",
    submittedAt: new Date().toISOString(),
    timeSpent: "13 min",
    feedback: "Strong work overall. Your short-answer responses showed good conceptual understanding. Review the distinction between mitosis and meiosis — Q3 and Q8 suggest some confusion there.",
    questionResults: [
      { id: "q1", correct: true,  earnedPoints: 2, maxPoints: 2 },
      { id: "q2", correct: true,  earnedPoints: 2, maxPoints: 2 },
      { id: "q3", correct: false, earnedPoints: 0, maxPoints: 1 },
      { id: "q4", correct: true,  earnedPoints: 1, maxPoints: 1 },
      { id: "q5", correct: true,  earnedPoints: 2, maxPoints: 2 },
      { id: "q6", correct: true,  earnedPoints: 2, maxPoints: 2 },
      { id: "q7", earnedPoints: 3, maxPoints: 4, aiFeedback: "Good identification of cancer and checkpoints. Adding a specific checkpoint name (e.g. G1/S) or gene (e.g. p53) would earn full credit." },
      { id: "q8", earnedPoints: 3, maxPoints: 3, aiFeedback: "Clear and accurate comparison. All three criteria addressed well." },
    ],
    xpEarned: 120,
    coinsEarned: 30,
    streak: true,
  },
  {
    score: 20,
    maxScore: 20,
    percentage: 100,
    grade: "A+",
    submittedAt: new Date().toISOString(),
    timeSpent: "17 min",
    feedback: "Perfect score. Your short-answer responses were precise and cited specific mechanisms. Excellent work.",
    questionResults: [
      { id: "q1", correct: true, earnedPoints: 2, maxPoints: 2 },
      { id: "q2", correct: true, earnedPoints: 2, maxPoints: 2 },
      { id: "q3", correct: true, earnedPoints: 1, maxPoints: 1 },
      { id: "q4", correct: true, earnedPoints: 1, maxPoints: 1 },
      { id: "q5", correct: true, earnedPoints: 2, maxPoints: 2 },
      { id: "q6", correct: true, earnedPoints: 2, maxPoints: 2 },
      { id: "q7", earnedPoints: 4, maxPoints: 4, aiFeedback: "Excellent — mentioned cancer, the G1 checkpoint, and p53 by name. Full credit." },
      { id: "q8", earnedPoints: 4, maxPoints: 4, aiFeedback: "Comprehensive and accurate. Division count, ploidy, and purpose all clearly addressed." },
    ],
    xpEarned: 200,
    coinsEarned: 50,
    streak: true,
  },
  {
    score: 12,
    maxScore: 20,
    percentage: 60,
    grade: "C",
    submittedAt: new Date().toISOString(),
    timeSpent: "9 min",
    feedback: "You've got the basics, but short-answer responses need more detail and specific evidence. Review cell cycle checkpoints and the differences between mitosis and meiosis before the next quiz.",
    questionResults: [
      { id: "q1", correct: true,  earnedPoints: 2, maxPoints: 2 },
      { id: "q2", correct: false, earnedPoints: 0, maxPoints: 2 },
      { id: "q3", correct: false, earnedPoints: 0, maxPoints: 1 },
      { id: "q4", correct: true,  earnedPoints: 1, maxPoints: 1 },
      { id: "q5", correct: false, earnedPoints: 0, maxPoints: 2 },
      { id: "q6", correct: true,  earnedPoints: 2, maxPoints: 2 },
      { id: "q7", earnedPoints: 2, maxPoints: 4, aiFeedback: "You mentioned cancer but didn't identify any checkpoint mechanism or control gene. Expand on what prevents uncontrolled division." },
      { id: "q8", earnedPoints: 3, maxPoints: 3, aiFeedback: "Solid comparison — all three criteria hit." },
    ],
    xpEarned: 60,
    coinsEarned: 15,
    streak: false,
  },
];

/**
 * Pick a variant index from content length (deterministic for same input).
 */
function getVariantIndex(textContent, maxVariants) {
  const len = (textContent || "").length;
  const hash = len * 31 + (textContent || "").slice(0, 20).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.abs(hash) % maxVariants;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns a promise that resolves to the same shape as callAnthropic:
 * { type: 'summary'|'quiz'|'flashcards'|'notes'|'slides'|'assignment'|'assignment_result', data, raw? }
 */
export async function getStudyHubMockResponse(mode, options, textContent, attachments = []) {
  await delay(MOCK_DELAY_MS);

  const contentHint = textContent?.trim().slice(0, 100) || "general content";

  switch (mode) {
    case "summarize": {
      const idx = getVariantIndex(textContent, MOCK_SUMMARIES.length);
      const summary = MOCK_SUMMARIES[idx];
      return { type: "summary", data: summary, raw: summary };
    }

    case "quiz": {
      const numQuestions = Math.min(Math.max(Number(options?.numQuestions) || 5, 1), 20);
      const quizSet = MOCK_QUIZZES[getVariantIndex(textContent, MOCK_QUIZZES.length)];
      const questions = quizSet.slice(0, numQuestions).map((q) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        answer: q.options[q.correct_answer],
        explanation: q.explanation,
      }));
      return { type: "quiz", data: questions, raw: JSON.stringify(questions) };
    }

    case "flashcards": {
      const numCards = Math.min(Math.max(Number(options?.numCards) || 10, 1), 30);
      const deck = MOCK_FLASHCARDS[getVariantIndex(textContent, MOCK_FLASHCARDS.length)];
      const cards = deck.slice(0, numCards).map((c) => ({ front: c.front, back: c.back }));
      return { type: "flashcards", data: cards, raw: JSON.stringify(cards) };
    }

    case "notes": {
      const idx = getVariantIndex(textContent, MOCK_NOTES.length);
      const notes = MOCK_NOTES[idx];
      return { type: "notes", data: notes, raw: notes };
    }

    case "slides": {
      const slideSet = MOCK_SLIDES[getVariantIndex(textContent, MOCK_SLIDES.length)];
      return { type: "slides", data: slideSet, raw: JSON.stringify(slideSet) };
    }

    // Return a student-facing assignment for the editor view.
    // options.assignmentId can be used to pin a specific mock; otherwise picks by content hash.
    case "assignment": {
      let assignment;
      if (options?.assignmentId) {
        assignment = MOCK_ASSIGNMENTS.find((a) => a.id === options.assignmentId) || MOCK_ASSIGNMENTS[0];
      } else {
        assignment = MOCK_ASSIGNMENTS[getVariantIndex(textContent, MOCK_ASSIGNMENTS.length)];
      }
      return { type: "assignment", data: assignment, raw: JSON.stringify(assignment) };
    }

    // Simulate grading after the student submits answers.
    // options.answers should be a map of { [questionId]: studentAnswer }.
    // Returns scored results with per-question feedback.
    case "submit_assignment": {
      await delay(800); // extra delay to simulate grading
      const result = MOCK_SUBMISSION_RESULTS[getVariantIndex(textContent, MOCK_SUBMISSION_RESULTS.length)];
      return { type: "assignment_result", data: result, raw: JSON.stringify(result) };
    }

    default:
      // Fallback to summary
      const fallbackIdx = getVariantIndex(textContent, MOCK_SUMMARIES.length);
      const fallback = MOCK_SUMMARIES[fallbackIdx];
      return { type: "summary", data: fallback, raw: fallback };
  }
}
