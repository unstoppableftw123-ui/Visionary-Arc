// ─── Mock Practice Data ──────────────────────────────────────────────────────
// TODO: Replace with OpenStax API call
// GET https://openstax.org/api/v2/pages/?type=books.BookIndex
// Filter by subject and grade level

// TODO: Replace with CK-12 API call
// GET https://api.ck12.org/api/ck12/info/flexbook/{subject}

// TODO: Replace mock questions with AI generation
// POST /api/practice/generate-questions
// Body: { subject, topic, difficulty, count, grade_level }
// Uses Claude/Ollama to generate IXL-style questions

export const SUBJECTS = [
  // ── Mathematics ────────────────────────────────────────────────────────────
  {
    id: "mathematics",
    name: "Mathematics",
    icon: "🔢",
    color: "#8b5cf6",
    gradientFrom: "#8b5cf6",
    gradientTo: "#6d28d9",
    mastery: 65,
    topics: [
      {
        id: "algebra1",
        name: "Algebra I",
        progress: 72,
        locked: false,
        skills: [
          {
            id: "linear_equations",
            name: "Linear Equations",
            masteryLevel: "Proficient",
            xpEarned: 120,
            xpMax: 200,
            progressHistory: [20, 35, 50, 55, 70, 85, 100, 120],
            questions: [
              {
                id: "le_q1",
                questionText: "Solve for x: 3x + 7 = 22",
                type: "multiple_choice",
                options: ["x = 3", "x = 5", "x = 7", "x = 9"],
                correctAnswer: "x = 5",
                explanation:
                  "Subtract 7 from both sides: 3x = 15, then divide by 3: x = 5.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "le_q2",
                questionText: "What is the slope of the line y = 4x − 3?",
                type: "multiple_choice",
                options: ["-3", "4", "1/4", "-4"],
                correctAnswer: "4",
                explanation:
                  "In slope-intercept form y = mx + b, the slope m is the coefficient of x. Here m = 4.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "le_q3",
                questionText: "Solve for x: 2(x − 3) = 10",
                type: "multiple_choice",
                options: ["x = 2", "x = 5", "x = 7", "x = 8"],
                correctAnswer: "x = 8",
                explanation:
                  "Distribute: 2x − 6 = 10. Add 6: 2x = 16. Divide by 2: x = 8.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "le_q4",
                questionText: "What is the y-intercept of the line y = −2x + 5?",
                type: "fill_in",
                options: [],
                correctAnswer: "5",
                explanation:
                  "The y-intercept is the value of b in y = mx + b. Here b = 5.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "quadratic_equations",
            name: "Quadratic Equations",
            masteryLevel: "Practicing",
            xpEarned: 60,
            xpMax: 200,
            progressHistory: [5, 10, 20, 30, 40, 50, 55, 60],
            questions: [
              {
                id: "qe_q1",
                questionText: "Solve: x² − 5x + 6 = 0",
                type: "multiple_choice",
                options: ["x = 1 and x = 6", "x = 2 and x = 3", "x = −2 and x = −3", "x = 2 and x = −3"],
                correctAnswer: "x = 2 and x = 3",
                explanation:
                  "Factor: (x − 2)(x − 3) = 0. Setting each factor to zero gives x = 2 or x = 3.",
                difficulty: 3,
                xpReward: 20,
              },
              {
                id: "qe_q2",
                questionText: "What is the vertex of y = x² − 4x + 3?",
                type: "multiple_choice",
                options: ["(2, -1)", "(4, 3)", "(-2, 15)", "(1, 0)"],
                correctAnswer: "(2, -1)",
                explanation:
                  "Use h = −b/2a = 4/2 = 2. Then k = (2)² − 4(2) + 3 = 4 − 8 + 3 = −1. Vertex: (2, −1).",
                difficulty: 3,
                xpReward: 20,
              },
              {
                id: "qe_q3",
                questionText: "What are the roots of x² − 9 = 0?",
                type: "multiple_choice",
                options: ["x = 9", "x = ±3", "x = 3", "x = ±9"],
                correctAnswer: "x = ±3",
                explanation:
                  "x² = 9, so x = ±√9 = ±3.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "qe_q4",
                questionText: "Using the quadratic formula, what is the discriminant of 2x² − 4x + 2 = 0?",
                type: "fill_in",
                options: [],
                correctAnswer: "0",
                explanation:
                  "Discriminant = b² − 4ac = (−4)² − 4(2)(2) = 16 − 16 = 0. One repeated root.",
                difficulty: 3,
                xpReward: 20,
              },
            ],
          },
          {
            id: "systems_of_equations",
            name: "Systems of Equations",
            masteryLevel: "Struggling",
            xpEarned: 25,
            xpMax: 200,
            progressHistory: [5, 8, 10, 15, 18, 20, 22, 25],
            questions: [
              {
                id: "se_q1",
                questionText: "Solve the system: y = 2x + 1 and y = x + 3",
                type: "multiple_choice",
                options: ["(1, 3)", "(2, 5)", "(3, 7)", "(0, 1)"],
                correctAnswer: "(2, 5)",
                explanation:
                  "Set equal: 2x + 1 = x + 3 → x = 2. Then y = 2(2) + 1 = 5. Solution: (2, 5).",
                difficulty: 3,
                xpReward: 20,
              },
              {
                id: "se_q2",
                questionText: "How many solutions do two parallel lines have?",
                type: "multiple_choice",
                options: ["0", "1", "2", "Infinite"],
                correctAnswer: "0",
                explanation:
                  "Parallel lines never intersect, so the system has no solution.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "se_q3",
                questionText: "Solve: 2x + y = 10 and x − y = 2",
                type: "multiple_choice",
                options: ["x=4, y=2", "x=3, y=4", "x=5, y=0", "x=6, y=-2"],
                correctAnswer: "x=4, y=2",
                explanation:
                  "Add equations: 3x = 12 → x = 4. Substitute: 4 − y = 2 → y = 2.",
                difficulty: 3,
                xpReward: 20,
              },
              {
                id: "se_q4",
                questionText: "What method adds two equations together to eliminate a variable?",
                type: "fill_in",
                options: [],
                correctAnswer: "elimination",
                explanation:
                  "The elimination method (also called addition method) combines equations to cancel one variable.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
          {
            id: "polynomials",
            name: "Polynomials",
            masteryLevel: "Mastered",
            xpEarned: 200,
            xpMax: 200,
            progressHistory: [60, 90, 120, 150, 170, 185, 195, 200],
            questions: [
              {
                id: "poly_q1",
                questionText: "What is the degree of 4x³ + 2x² − x + 7?",
                type: "multiple_choice",
                options: ["1", "2", "3", "4"],
                correctAnswer: "3",
                explanation:
                  "The degree of a polynomial is the highest power of the variable. Here the highest power is 3.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "poly_q2",
                questionText: "Simplify: (3x² + 2x − 1) + (x² − 4x + 5)",
                type: "multiple_choice",
                options: ["4x² − 2x + 4", "4x² + 6x + 4", "2x² − 2x + 4", "4x² − 2x − 4"],
                correctAnswer: "4x² − 2x + 4",
                explanation:
                  "Combine like terms: (3+1)x² + (2−4)x + (−1+5) = 4x² − 2x + 4.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "poly_q3",
                questionText: "What is the leading coefficient of −5x⁴ + 3x² + 1?",
                type: "fill_in",
                options: [],
                correctAnswer: "-5",
                explanation:
                  "The leading coefficient is the coefficient of the highest-degree term. Here it is −5.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "factoring",
            name: "Factoring",
            masteryLevel: "Proficient",
            xpEarned: 150,
            xpMax: 200,
            progressHistory: [30, 55, 80, 100, 115, 130, 145, 150],
            questions: [
              {
                id: "fact_q1",
                questionText: "Factor completely: x² + 5x + 6",
                type: "multiple_choice",
                options: ["(x+1)(x+6)", "(x+2)(x+3)", "(x−2)(x−3)", "(x+6)(x+1)"],
                correctAnswer: "(x+2)(x+3)",
                explanation:
                  "Find two numbers that multiply to 6 and add to 5: 2 and 3. So (x+2)(x+3).",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "fact_q2",
                questionText: "Factor: x² − 16",
                type: "multiple_choice",
                options: ["(x−4)²", "(x+4)(x−4)", "(x+8)(x−2)", "(x−8)(x+2)"],
                correctAnswer: "(x+4)(x−4)",
                explanation:
                  "This is a difference of squares: a² − b² = (a+b)(a−b). x² − 16 = (x+4)(x−4).",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "fact_q3",
                questionText: "What is the GCF of 12x³ + 8x²?",
                type: "fill_in",
                options: [],
                correctAnswer: "4x²",
                explanation:
                  "GCF of 12 and 8 is 4. GCF of x³ and x² is x². So GCF = 4x².",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
      {
        id: "algebra2",
        name: "Algebra II",
        progress: 45,
        locked: false,
        skills: [
          {
            id: "exponential_functions",
            name: "Exponential Functions",
            masteryLevel: "Practicing",
            xpEarned: 55,
            xpMax: 200,
            progressHistory: [5, 12, 20, 30, 38, 45, 50, 55],
            questions: [
              {
                id: "exp_q1",
                questionText: "Which function represents exponential growth?",
                type: "multiple_choice",
                options: ["f(x) = 2x + 1", "f(x) = x²", "f(x) = 3·2ˣ", "f(x) = √x"],
                correctAnswer: "f(x) = 3·2ˣ",
                explanation:
                  "Exponential growth has the form f(x) = a·bˣ where b > 1. Here b = 2 > 1.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "exp_q2",
                questionText: "Evaluate: 2³ × 2⁴",
                type: "multiple_choice",
                options: ["2⁷", "2¹²", "4⁷", "8⁷"],
                correctAnswer: "2⁷",
                explanation:
                  "When multiplying same bases, add exponents: 2³ × 2⁴ = 2^(3+4) = 2⁷.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "exp_q3",
                questionText: "What is the value of 5⁰?",
                type: "fill_in",
                options: [],
                correctAnswer: "1",
                explanation:
                  "Any non-zero number raised to the power of 0 equals 1.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "logarithms",
            name: "Logarithms",
            masteryLevel: "Struggling",
            xpEarned: 20,
            xpMax: 200,
            progressHistory: [5, 7, 10, 12, 15, 17, 18, 20],
            questions: [
              {
                id: "log_q1",
                questionText: "What is log₂(8)?",
                type: "multiple_choice",
                options: ["2", "3", "4", "8"],
                correctAnswer: "3",
                explanation:
                  "log₂(8) asks: 2 to what power equals 8? Since 2³ = 8, log₂(8) = 3.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "log_q2",
                questionText: "Which property states: log(a × b) = log a + log b?",
                type: "multiple_choice",
                options: ["Power Rule", "Quotient Rule", "Product Rule", "Change of Base"],
                correctAnswer: "Product Rule",
                explanation:
                  "The Product Rule of logarithms states log(ab) = log a + log b.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
          {
            id: "complex_numbers",
            name: "Complex Numbers",
            masteryLevel: "Practicing",
            xpEarned: 70,
            xpMax: 150,
            progressHistory: [10, 20, 35, 45, 55, 60, 65, 70],
            questions: [
              {
                id: "cn_q1",
                questionText: "What is i² (where i = √−1)?",
                type: "multiple_choice",
                options: ["1", "-1", "i", "0"],
                correctAnswer: "-1",
                explanation:
                  "By definition, i = √−1, so i² = −1.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "cn_q2",
                questionText: "Simplify: (3 + 2i) + (1 − 4i)",
                type: "multiple_choice",
                options: ["4 + 6i", "4 − 2i", "2 + 6i", "2 − 2i"],
                correctAnswer: "4 − 2i",
                explanation:
                  "Add real parts: 3+1=4. Add imaginary parts: 2+(−4)=−2. Result: 4 − 2i.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
      {
        id: "geometry",
        name: "Geometry",
        progress: 80,
        locked: false,
        skills: [
          {
            id: "angles_triangles",
            name: "Angles & Triangles",
            masteryLevel: "Mastered",
            xpEarned: 180,
            xpMax: 200,
            progressHistory: [80, 100, 120, 140, 155, 165, 175, 180],
            questions: [
              {
                id: "at_q1",
                questionText: "The angles of a triangle sum to how many degrees?",
                type: "fill_in",
                options: [],
                correctAnswer: "180",
                explanation:
                  "The interior angles of any triangle always sum to 180°.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "at_q2",
                questionText: "What type of triangle has all sides equal?",
                type: "multiple_choice",
                options: ["Scalene", "Isosceles", "Equilateral", "Right"],
                correctAnswer: "Equilateral",
                explanation:
                  "An equilateral triangle has all three sides equal and all angles equal to 60°.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "pythagorean_theorem",
            name: "Pythagorean Theorem",
            masteryLevel: "Mastered",
            xpEarned: 200,
            xpMax: 200,
            progressHistory: [100, 130, 155, 170, 182, 190, 197, 200],
            questions: [
              {
                id: "pt_q1",
                questionText: "In a right triangle with legs 3 and 4, what is the hypotenuse?",
                type: "multiple_choice",
                options: ["5", "6", "7", "√7"],
                correctAnswer: "5",
                explanation:
                  "a² + b² = c² → 9 + 16 = 25 → c = 5. (This is a 3-4-5 Pythagorean triple!)",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "pt_q2",
                questionText: "A ladder 10 ft long leans against a wall, 6 ft from the base. How high does it reach?",
                type: "multiple_choice",
                options: ["6 ft", "8 ft", "9 ft", "10 ft"],
                correctAnswer: "8 ft",
                explanation:
                  "h² + 6² = 10² → h² = 100 − 36 = 64 → h = 8 ft.",
                difficulty: 3,
                xpReward: 20,
              },
            ],
          },
          {
            id: "area_perimeter",
            name: "Area & Perimeter",
            masteryLevel: "Proficient",
            xpEarned: 130,
            xpMax: 200,
            progressHistory: [20, 45, 65, 85, 100, 115, 125, 130],
            questions: [
              {
                id: "ap_q1",
                questionText: "What is the area of a circle with radius 5?",
                type: "multiple_choice",
                options: ["10π", "25π", "50π", "5π"],
                correctAnswer: "25π",
                explanation:
                  "Area = πr² = π(5)² = 25π.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "ap_q2",
                questionText: "What is the perimeter of a rectangle with length 8 and width 3?",
                type: "fill_in",
                options: [],
                correctAnswer: "22",
                explanation:
                  "Perimeter = 2(l + w) = 2(8 + 3) = 2(11) = 22.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "precalculus",
        name: "Pre-Calculus",
        progress: 30,
        locked: false,
        skills: [
          {
            id: "trigonometry",
            name: "Trigonometry Basics",
            masteryLevel: "Practicing",
            xpEarned: 45,
            xpMax: 200,
            progressHistory: [5, 10, 18, 25, 30, 38, 42, 45],
            questions: [
              {
                id: "trig_q1",
                questionText: "What is sin(30°)?",
                type: "multiple_choice",
                options: ["1", "√2/2", "1/2", "√3/2"],
                correctAnswer: "1/2",
                explanation:
                  "sin(30°) = 1/2. Remember: sin(30°) = 0.5, sin(45°) = √2/2, sin(60°) = √3/2.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "trig_q2",
                questionText: "In a right triangle, SOH-CAH-TOA refers to which ratios?",
                type: "multiple_choice",
                options: [
                  "Sin=Opp/Hyp, Cos=Adj/Hyp, Tan=Opp/Adj",
                  "Sin=Adj/Hyp, Cos=Opp/Hyp, Tan=Adj/Opp",
                  "Sin=Hyp/Opp, Cos=Hyp/Adj, Tan=Adj/Opp",
                  "Sin=Opp/Adj, Cos=Adj/Opp, Tan=Opp/Hyp",
                ],
                correctAnswer: "Sin=Opp/Hyp, Cos=Adj/Hyp, Tan=Opp/Adj",
                explanation:
                  "SOH: Sine = Opposite/Hypotenuse. CAH: Cosine = Adjacent/Hypotenuse. TOA: Tangent = Opposite/Adjacent.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
          {
            id: "functions",
            name: "Functions & Graphs",
            masteryLevel: "Struggling",
            xpEarned: 30,
            xpMax: 200,
            progressHistory: [5, 8, 12, 18, 22, 26, 28, 30],
            questions: [
              {
                id: "func_q1",
                questionText: "Which of these is NOT a function?",
                type: "multiple_choice",
                options: ["f(x) = x²", "f(x) = 2x + 1", "x = 4 (vertical line)", "f(x) = |x|"],
                correctAnswer: "x = 4 (vertical line)",
                explanation:
                  "A vertical line fails the vertical line test. Each x-input must have exactly one y-output for a function.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "func_q2",
                questionText: "What is the domain of f(x) = √(x − 3)?",
                type: "multiple_choice",
                options: ["x ≥ 0", "x ≥ 3", "x > 3", "All real numbers"],
                correctAnswer: "x ≥ 3",
                explanation:
                  "The expression under the square root must be ≥ 0: x − 3 ≥ 0 → x ≥ 3.",
                difficulty: 3,
                xpReward: 20,
              },
            ],
          },
        ],
      },
      {
        id: "statistics",
        name: "Statistics",
        progress: 55,
        locked: false,
        skills: [
          {
            id: "mean_median_mode",
            name: "Mean, Median & Mode",
            masteryLevel: "Proficient",
            xpEarned: 110,
            xpMax: 150,
            progressHistory: [30, 50, 65, 78, 88, 96, 105, 110],
            questions: [
              {
                id: "mmm_q1",
                questionText: "Find the mean of: 4, 8, 6, 10, 12",
                type: "fill_in",
                options: [],
                correctAnswer: "8",
                explanation:
                  "Mean = sum ÷ count = (4+8+6+10+12) ÷ 5 = 40 ÷ 5 = 8.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "mmm_q2",
                questionText: "What is the median of: 3, 7, 9, 1, 5?",
                type: "multiple_choice",
                options: ["3", "5", "7", "9"],
                correctAnswer: "5",
                explanation:
                  "Sort the data: 1, 3, 5, 7, 9. The median (middle value) is 5.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
          {
            id: "probability",
            name: "Probability",
            masteryLevel: "Practicing",
            xpEarned: 60,
            xpMax: 150,
            progressHistory: [10, 18, 28, 38, 45, 52, 57, 60],
            questions: [
              {
                id: "prob_q1",
                questionText: "A fair die is rolled. What is P(rolling a 4)?",
                type: "multiple_choice",
                options: ["1/4", "1/6", "1/3", "4/6"],
                correctAnswer: "1/6",
                explanation:
                  "A fair 6-sided die has 6 equally likely outcomes. P(4) = 1/6.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "prob_q2",
                questionText: "A bag has 3 red and 7 blue marbles. What is P(red)?",
                type: "multiple_choice",
                options: ["3/7", "7/10", "3/10", "1/3"],
                correctAnswer: "3/10",
                explanation:
                  "Total marbles = 10. P(red) = 3/10.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
    ],
  },

  // ── Science ────────────────────────────────────────────────────────────────
  {
    id: "science",
    name: "Science",
    icon: "🧬",
    color: "#10b981",
    gradientFrom: "#10b981",
    gradientTo: "#059669",
    mastery: 52,
    topics: [
      {
        id: "biology",
        name: "Biology",
        progress: 68,
        locked: false,
        skills: [
          {
            id: "cell_structure",
            name: "Cell Structure",
            masteryLevel: "Proficient",
            xpEarned: 130,
            xpMax: 200,
            progressHistory: [20, 40, 60, 80, 95, 110, 120, 130],
            questions: [
              {
                id: "cell_q1",
                questionText: "Which organelle is called the 'powerhouse of the cell'?",
                type: "multiple_choice",
                options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
                correctAnswer: "Mitochondria",
                explanation:
                  "Mitochondria produce ATP through cellular respiration, providing most of the cell's energy.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "cell_q2",
                questionText: "What controls what enters and exits the cell?",
                type: "multiple_choice",
                options: ["Cell wall", "Cell membrane", "Nucleus", "Cytoplasm"],
                correctAnswer: "Cell membrane",
                explanation:
                  "The cell membrane is selectively permeable, controlling which substances move in and out.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "cell_q3",
                questionText: "Prokaryotic cells (like bacteria) lack which structure?",
                type: "multiple_choice",
                options: ["Cell membrane", "Ribosomes", "Nucleus", "DNA"],
                correctAnswer: "Nucleus",
                explanation:
                  "Prokaryotes lack a membrane-bound nucleus; their DNA floats freely in the cytoplasm.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "cell_q4",
                questionText: "What is the gel-like fluid that fills a cell called?",
                type: "fill_in",
                options: [],
                correctAnswer: "cytoplasm",
                explanation:
                  "Cytoplasm is the jelly-like fluid inside the cell that suspends organelles.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "photosynthesis",
            name: "Photosynthesis",
            masteryLevel: "Practicing",
            xpEarned: 65,
            xpMax: 200,
            progressHistory: [10, 20, 30, 40, 48, 55, 60, 65],
            questions: [
              {
                id: "photo_q1",
                questionText: "What is the overall equation for photosynthesis?",
                type: "multiple_choice",
                options: [
                  "CO₂ + H₂O → glucose + O₂",
                  "glucose + O₂ → CO₂ + H₂O",
                  "H₂O + O₂ → glucose + CO₂",
                  "glucose → CO₂ + ATP",
                ],
                correctAnswer: "CO₂ + H₂O → glucose + O₂",
                explanation:
                  "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Plants use light to convert CO₂ and water into glucose.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "photo_q2",
                questionText: "In which organelle does photosynthesis occur?",
                type: "fill_in",
                options: [],
                correctAnswer: "chloroplast",
                explanation:
                  "Chloroplasts contain chlorophyll and are the site of photosynthesis in plant cells.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "photo_q3",
                questionText: "What pigment in plants captures light energy for photosynthesis?",
                type: "multiple_choice",
                options: ["Melanin", "Chlorophyll", "Carotene", "Hemoglobin"],
                correctAnswer: "Chlorophyll",
                explanation:
                  "Chlorophyll is the green pigment in plants that absorbs light (mainly red and blue wavelengths) for photosynthesis.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "genetics",
            name: "Genetics & DNA",
            masteryLevel: "Struggling",
            xpEarned: 30,
            xpMax: 200,
            progressHistory: [5, 8, 12, 15, 20, 24, 27, 30],
            questions: [
              {
                id: "gen_q1",
                questionText: "What is the base-pair complement of Adenine (A) in DNA?",
                type: "multiple_choice",
                options: ["Adenine", "Guanine", "Thymine", "Cytosine"],
                correctAnswer: "Thymine",
                explanation:
                  "In DNA, Adenine pairs with Thymine (A-T) and Guanine pairs with Cytosine (G-C).",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "gen_q2",
                questionText: "A person with two identical alleles for a trait is called:",
                type: "multiple_choice",
                options: ["Heterozygous", "Homozygous", "Dominant", "Recessive"],
                correctAnswer: "Homozygous",
                explanation:
                  "Homozygous means having two identical alleles (e.g., BB or bb). Heterozygous means having two different alleles (Bb).",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
      {
        id: "chemistry",
        name: "Chemistry",
        progress: 42,
        locked: false,
        skills: [
          {
            id: "atomic_structure",
            name: "Atomic Structure",
            masteryLevel: "Practicing",
            xpEarned: 70,
            xpMax: 200,
            progressHistory: [10, 18, 28, 38, 50, 58, 65, 70],
            questions: [
              {
                id: "atom_q1",
                questionText: "What is the charge of a proton?",
                type: "multiple_choice",
                options: ["Negative", "Neutral", "Positive", "Variable"],
                correctAnswer: "Positive",
                explanation:
                  "Protons carry a positive charge (+1), electrons carry negative charge (−1), and neutrons are neutral.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "atom_q2",
                questionText: "An element's atomic number equals the number of:",
                type: "multiple_choice",
                options: ["Neutrons", "Protons", "Electrons + Protons", "Nucleons"],
                correctAnswer: "Protons",
                explanation:
                  "The atomic number is the number of protons in the nucleus and defines the element.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "atom_q3",
                questionText: "How many electrons can the first energy shell of an atom hold?",
                type: "fill_in",
                options: [],
                correctAnswer: "2",
                explanation:
                  "The first electron shell (n=1) can hold a maximum of 2 electrons.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "atom_q4",
                questionText: "What is the number of neutrons in Carbon-14?",
                type: "multiple_choice",
                options: ["6", "7", "8", "14"],
                correctAnswer: "8",
                explanation:
                  "Carbon has atomic number 6 (6 protons). Carbon-14 has mass number 14. Neutrons = 14 − 6 = 8.",
                difficulty: 3,
                xpReward: 20,
              },
            ],
          },
          {
            id: "periodic_table",
            name: "Periodic Table",
            masteryLevel: "Proficient",
            xpEarned: 120,
            xpMax: 200,
            progressHistory: [25, 45, 65, 80, 92, 105, 115, 120],
            questions: [
              {
                id: "pt_q1",
                questionText: "Elements in the same group (column) of the periodic table share:",
                type: "multiple_choice",
                options: [
                  "Same number of protons",
                  "Same number of valence electrons",
                  "Same atomic mass",
                  "Same number of neutrons",
                ],
                correctAnswer: "Same number of valence electrons",
                explanation:
                  "Elements in the same group have the same number of valence electrons, giving them similar chemical properties.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "pt_q2",
                questionText: "What element has the symbol 'Na'?",
                type: "multiple_choice",
                options: ["Nitrogen", "Neon", "Sodium", "Nickel"],
                correctAnswer: "Sodium",
                explanation:
                  "Na comes from the Latin word 'Natrium.' Sodium is element 11 in Group 1 (alkali metals).",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "pt_q3",
                questionText: "Noble gases are in which group of the periodic table?",
                type: "fill_in",
                options: [],
                correctAnswer: "18",
                explanation:
                  "Noble gases (He, Ne, Ar, Kr, Xe, Rn) are in Group 18. They have full valence shells and are very unreactive.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
          {
            id: "chemical_reactions",
            name: "Chemical Reactions",
            masteryLevel: "Struggling",
            xpEarned: 25,
            xpMax: 200,
            progressHistory: [5, 7, 10, 13, 17, 20, 23, 25],
            questions: [
              {
                id: "cr_q1",
                questionText: "In a chemical equation, what must be equal on both sides?",
                type: "multiple_choice",
                options: ["Temperature", "Pressure", "Number of atoms", "Volume"],
                correctAnswer: "Number of atoms",
                explanation:
                  "Conservation of mass: atoms are neither created nor destroyed. Both sides must have the same number of each type of atom.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "cr_q2",
                questionText: "What type of reaction is: A + B → AB?",
                type: "multiple_choice",
                options: ["Decomposition", "Combustion", "Synthesis (Combination)", "Single Replacement"],
                correctAnswer: "Synthesis (Combination)",
                explanation:
                  "A synthesis reaction combines two or more reactants to form a single product.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
      {
        id: "physics",
        name: "Physics",
        progress: 35,
        locked: false,
        skills: [
          {
            id: "newtons_laws",
            name: "Newton's Laws",
            masteryLevel: "Practicing",
            xpEarned: 55,
            xpMax: 200,
            progressHistory: [8, 15, 25, 33, 40, 47, 52, 55],
            questions: [
              {
                id: "nl_q1",
                questionText: "Newton's First Law states that an object at rest will:",
                type: "multiple_choice",
                options: [
                  "Accelerate slowly",
                  "Stay at rest unless acted on by a net force",
                  "Always be in motion",
                  "Lose mass over time",
                ],
                correctAnswer: "Stay at rest unless acted on by a net force",
                explanation:
                  "Newton's 1st Law (Inertia): An object at rest stays at rest, and an object in motion stays in motion, unless acted on by a net external force.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "nl_q2",
                questionText: "F = ma is Newton's __ Law.",
                type: "fill_in",
                options: [],
                correctAnswer: "Second",
                explanation:
                  "Newton's Second Law: Force = mass × acceleration (F = ma).",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "kinematics",
            name: "Kinematics",
            masteryLevel: "Struggling",
            xpEarned: 20,
            xpMax: 200,
            progressHistory: [3, 6, 9, 12, 15, 17, 19, 20],
            questions: [
              {
                id: "kin_q1",
                questionText: "An object travels 60 meters in 3 seconds. What is its average speed?",
                type: "multiple_choice",
                options: ["10 m/s", "15 m/s", "20 m/s", "30 m/s"],
                correctAnswer: "20 m/s",
                explanation:
                  "Speed = distance ÷ time = 60 ÷ 3 = 20 m/s.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "kin_q2",
                questionText: "Acceleration is the rate of change of:",
                type: "multiple_choice",
                options: ["Distance", "Position", "Velocity", "Force"],
                correctAnswer: "Velocity",
                explanation:
                  "Acceleration = change in velocity ÷ time. It describes how quickly velocity changes.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
      {
        id: "earth_science",
        name: "Earth Science",
        progress: 60,
        locked: true,
        skills: [
          {
            id: "plate_tectonics",
            name: "Plate Tectonics",
            masteryLevel: "Proficient",
            xpEarned: 100,
            xpMax: 150,
            progressHistory: [20, 38, 55, 68, 78, 88, 95, 100],
            questions: [
              {
                id: "tec_q1",
                questionText: "What type of plate boundary causes earthquakes and trenches?",
                type: "multiple_choice",
                options: ["Divergent", "Convergent", "Transform", "Passive"],
                correctAnswer: "Convergent",
                explanation:
                  "Convergent boundaries form when plates collide, creating subduction zones, trenches, and earthquakes.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "tec_q2",
                questionText: "The theory that continents were once joined is called:",
                type: "fill_in",
                options: [],
                correctAnswer: "continental drift",
                explanation:
                  "Alfred Wegener proposed Continental Drift in 1912, which evolved into modern plate tectonic theory.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "rock_cycle",
            name: "Rock Cycle",
            masteryLevel: "Mastered",
            xpEarned: 150,
            xpMax: 150,
            progressHistory: [50, 75, 100, 115, 128, 138, 145, 150],
            questions: [
              {
                id: "rock_q1",
                questionText: "Which type of rock forms from cooled magma or lava?",
                type: "multiple_choice",
                options: ["Sedimentary", "Metamorphic", "Igneous", "Mineral"],
                correctAnswer: "Igneous",
                explanation:
                  "Igneous rocks form when magma (underground) or lava (surface) cools and solidifies.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "rock_q2",
                questionText: "Marble is a metamorphic rock formed from which sedimentary rock?",
                type: "multiple_choice",
                options: ["Granite", "Sandstone", "Shale", "Limestone"],
                correctAnswer: "Limestone",
                explanation:
                  "Marble forms when limestone undergoes heat and pressure (metamorphism).",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
    ],
  },

  // ── English ────────────────────────────────────────────────────────────────
  {
    id: "english",
    name: "English",
    icon: "📖",
    color: "#f59e0b",
    gradientFrom: "#f59e0b",
    gradientTo: "#d97706",
    mastery: 78,
    topics: [
      {
        id: "grammar_writing",
        name: "Grammar & Writing",
        progress: 85,
        locked: false,
        skills: [
          {
            id: "parts_of_speech",
            name: "Parts of Speech",
            masteryLevel: "Mastered",
            xpEarned: 180,
            xpMax: 200,
            progressHistory: [80, 105, 125, 140, 155, 165, 173, 180],
            questions: [
              {
                id: "pos_q1",
                questionText: "Which word is a conjunction in: 'I wanted coffee, but she ordered tea'?",
                type: "multiple_choice",
                options: ["I", "wanted", "but", "ordered"],
                correctAnswer: "but",
                explanation:
                  "'But' is a coordinating conjunction that connects two independent clauses.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "pos_q2",
                questionText: "Identify the adverb: 'She ran quickly across the field.'",
                type: "fill_in",
                options: [],
                correctAnswer: "quickly",
                explanation:
                  "'Quickly' modifies the verb 'ran,' describing how she ran. Adverbs modify verbs, adjectives, or other adverbs.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "sentence_structure",
            name: "Sentence Structure",
            masteryLevel: "Proficient",
            xpEarned: 140,
            xpMax: 200,
            progressHistory: [40, 65, 85, 100, 115, 125, 133, 140],
            questions: [
              {
                id: "ss_q1",
                questionText: "What type of sentence is: 'Run!'?",
                type: "multiple_choice",
                options: ["Declarative", "Interrogative", "Imperative", "Exclamatory"],
                correctAnswer: "Imperative",
                explanation:
                  "An imperative sentence gives a command or request. The subject 'you' is implied.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "ss_q2",
                questionText: "A sentence with two independent clauses joined by a semicolon is called:",
                type: "multiple_choice",
                options: ["Simple", "Complex", "Compound", "Compound-Complex"],
                correctAnswer: "Compound",
                explanation:
                  "A compound sentence contains two or more independent clauses joined by a semicolon or coordinating conjunction.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
      {
        id: "literature",
        name: "Literature",
        progress: 70,
        locked: false,
        skills: [
          {
            id: "literary_devices",
            name: "Literary Devices",
            masteryLevel: "Proficient",
            xpEarned: 125,
            xpMax: 200,
            progressHistory: [25, 48, 68, 85, 98, 110, 118, 125],
            questions: [
              {
                id: "ld_q1",
                questionText: "'The wind whispered through the trees' is an example of:",
                type: "multiple_choice",
                options: ["Metaphor", "Simile", "Personification", "Alliteration"],
                correctAnswer: "Personification",
                explanation:
                  "Personification gives human qualities to non-human things. Wind cannot literally whisper.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "ld_q2",
                questionText: "A comparison using 'like' or 'as' is called a:",
                type: "fill_in",
                options: [],
                correctAnswer: "simile",
                explanation:
                  "A simile directly compares two things using 'like' or 'as' (e.g., 'brave as a lion').",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "reading_comp",
            name: "Reading Comprehension",
            masteryLevel: "Mastered",
            xpEarned: 200,
            xpMax: 200,
            progressHistory: [100, 120, 140, 158, 170, 180, 193, 200],
            questions: [
              {
                id: "rc_q1",
                questionText: "The main idea of a passage is best described as:",
                type: "multiple_choice",
                options: [
                  "The first sentence of the passage",
                  "A specific detail mentioned once",
                  "The central point the author wants to convey",
                  "The conclusion paragraph",
                ],
                correctAnswer: "The central point the author wants to convey",
                explanation:
                  "The main idea is the overarching message or central argument of the entire text.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "vocabulary",
        name: "Vocabulary",
        progress: 90,
        locked: false,
        skills: [
          {
            id: "vocab_roots",
            name: "Word Roots & Prefixes",
            masteryLevel: "Mastered",
            xpEarned: 200,
            xpMax: 200,
            progressHistory: [120, 140, 158, 170, 180, 188, 196, 200],
            questions: [
              {
                id: "vr_q1",
                questionText: "The prefix 'bio-' means:",
                type: "multiple_choice",
                options: ["Earth", "Life", "Water", "Light"],
                correctAnswer: "Life",
                explanation:
                  "'Bio-' comes from Greek 'bios' meaning life. Examples: biology, biography, biodiversity.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "reading_comprehension",
        name: "Reading Comprehension",
        progress: 75,
        locked: false,
        skills: [
          {
            id: "inference",
            name: "Making Inferences",
            masteryLevel: "Proficient",
            xpEarned: 130,
            xpMax: 200,
            progressHistory: [30, 52, 70, 88, 100, 112, 123, 130],
            questions: [
              {
                id: "inf_q1",
                questionText: "An inference is best described as:",
                type: "multiple_choice",
                options: [
                  "A direct quote from the text",
                  "A conclusion drawn from evidence and reasoning",
                  "The author's stated opinion",
                  "A summary of the text",
                ],
                correctAnswer: "A conclusion drawn from evidence and reasoning",
                explanation:
                  "An inference combines textual evidence with prior knowledge to reach a logical conclusion not explicitly stated.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
    ],
  },

  // ── History & Social Studies ────────────────────────────────────────────────
  {
    id: "history",
    name: "History & Social Studies",
    icon: "🌍",
    color: "#3b82f6",
    gradientFrom: "#3b82f6",
    gradientTo: "#2563eb",
    mastery: 40,
    topics: [
      {
        id: "us_history",
        name: "US History",
        progress: 55,
        locked: false,
        skills: [
          {
            id: "founding_documents",
            name: "Founding Documents",
            masteryLevel: "Proficient",
            xpEarned: 120,
            xpMax: 200,
            progressHistory: [25, 45, 62, 78, 90, 102, 113, 120],
            questions: [
              {
                id: "fd_q1",
                questionText: "In what year was the Declaration of Independence signed?",
                type: "fill_in",
                options: [],
                correctAnswer: "1776",
                explanation:
                  "The Declaration of Independence was adopted by the Continental Congress on July 4, 1776.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "fd_q2",
                questionText: "How many amendments are in the Bill of Rights?",
                type: "multiple_choice",
                options: ["5", "7", "10", "12"],
                correctAnswer: "10",
                explanation:
                  "The Bill of Rights consists of the first 10 amendments to the U.S. Constitution, ratified in 1791.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "civil_war",
            name: "Civil War Era",
            masteryLevel: "Practicing",
            xpEarned: 60,
            xpMax: 200,
            progressHistory: [8, 16, 25, 33, 42, 50, 56, 60],
            questions: [
              {
                id: "cw_q1",
                questionText: "The Emancipation Proclamation was issued by President:",
                type: "multiple_choice",
                options: ["Ulysses S. Grant", "Abraham Lincoln", "James Buchanan", "Andrew Johnson"],
                correctAnswer: "Abraham Lincoln",
                explanation:
                  "President Abraham Lincoln issued the Emancipation Proclamation on January 1, 1863, freeing enslaved people in Confederate states.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "world_history",
        name: "World History",
        progress: 30,
        locked: false,
        skills: [
          {
            id: "ancient_civ",
            name: "Ancient Civilizations",
            masteryLevel: "Practicing",
            xpEarned: 55,
            xpMax: 200,
            progressHistory: [5, 12, 20, 30, 38, 45, 50, 55],
            questions: [
              {
                id: "ac_q1",
                questionText: "Which river gave rise to ancient Egyptian civilization?",
                type: "multiple_choice",
                options: ["Tigris", "Euphrates", "Nile", "Amazon"],
                correctAnswer: "Nile",
                explanation:
                  "The Nile River's annual floods deposited rich silt, enabling agriculture and the growth of Egyptian civilization.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "geography",
        name: "Geography",
        progress: 50,
        locked: false,
        skills: [
          {
            id: "world_regions",
            name: "World Regions",
            masteryLevel: "Proficient",
            xpEarned: 110,
            xpMax: 150,
            progressHistory: [30, 50, 65, 78, 88, 96, 104, 110],
            questions: [
              {
                id: "wr_q1",
                questionText: "Which is the largest continent by area?",
                type: "multiple_choice",
                options: ["Africa", "North America", "Asia", "Europe"],
                correctAnswer: "Asia",
                explanation:
                  "Asia is the largest continent, covering about 44.5 million km² (approximately 30% of Earth's land area).",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "economics",
        name: "Economics",
        progress: 25,
        locked: true,
        skills: [
          {
            id: "supply_demand",
            name: "Supply & Demand",
            masteryLevel: "Struggling",
            xpEarned: 20,
            xpMax: 200,
            progressHistory: [3, 6, 9, 12, 15, 17, 19, 20],
            questions: [
              {
                id: "sd_q1",
                questionText: "When supply decreases and demand stays the same, price tends to:",
                type: "multiple_choice",
                options: ["Decrease", "Increase", "Stay the same", "Become unpredictable"],
                correctAnswer: "Increase",
                explanation:
                  "Less supply with the same demand means scarcity, which drives prices up.",
                difficulty: 2,
                xpReward: 15,
              },
            ],
          },
        ],
      },
    ],
  },

  // ── Computer Science ───────────────────────────────────────────────────────
  {
    id: "cs",
    name: "Computer Science",
    icon: "💻",
    color: "#f43f5e",
    gradientFrom: "#f43f5e",
    gradientTo: "#e11d48",
    mastery: 30,
    topics: [
      {
        id: "programming_basics",
        name: "Programming Basics",
        progress: 60,
        locked: false,
        skills: [
          {
            id: "variables",
            name: "Variables & Data Types",
            masteryLevel: "Proficient",
            xpEarned: 120,
            xpMax: 200,
            progressHistory: [25, 45, 62, 78, 90, 102, 113, 120],
            questions: [
              {
                id: "var_q1",
                questionText: "Which data type would store the value 3.14?",
                type: "multiple_choice",
                options: ["Integer", "Boolean", "Float/Double", "String"],
                correctAnswer: "Float/Double",
                explanation:
                  "Floating-point types (float/double) store decimal numbers. Integers store whole numbers only.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "var_q2",
                questionText: "A variable that cannot be changed after assignment is called:",
                type: "multiple_choice",
                options: ["Dynamic", "Constant", "Global", "Null"],
                correctAnswer: "Constant",
                explanation:
                  "Constants (const, final, etc.) are variables whose values cannot be modified after initialization.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
          {
            id: "loops",
            name: "Loops & Iteration",
            masteryLevel: "Practicing",
            xpEarned: 65,
            xpMax: 200,
            progressHistory: [10, 18, 28, 38, 48, 55, 60, 65],
            questions: [
              {
                id: "loop_q1",
                questionText: "A 'for' loop is best used when:",
                type: "multiple_choice",
                options: [
                  "You don't know how many times to repeat",
                  "You know exactly how many times to repeat",
                  "You want infinite repetition",
                  "You need to skip iterations",
                ],
                correctAnswer: "You know exactly how many times to repeat",
                explanation:
                  "For loops are ideal when the iteration count is known. While loops are better for unknown counts.",
                difficulty: 2,
                xpReward: 15,
              },
              {
                id: "loop_q2",
                questionText: "How many times does this loop run: for i in range(5)?",
                type: "fill_in",
                options: [],
                correctAnswer: "5",
                explanation:
                  "range(5) generates [0, 1, 2, 3, 4] — five values, so the loop runs 5 times.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "data_structures",
        name: "Data Structures",
        progress: 20,
        locked: false,
        skills: [
          {
            id: "arrays_lists",
            name: "Arrays & Lists",
            masteryLevel: "Practicing",
            xpEarned: 45,
            xpMax: 200,
            progressHistory: [5, 10, 18, 25, 32, 38, 42, 45],
            questions: [
              {
                id: "arr_q1",
                questionText: "What is the index of the first element in most programming languages?",
                type: "fill_in",
                options: [],
                correctAnswer: "0",
                explanation:
                  "Most languages (Python, JavaScript, Java, C++) use zero-based indexing, so the first element is at index 0.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "web_development",
        name: "Web Development",
        progress: 40,
        locked: false,
        skills: [
          {
            id: "html_css",
            name: "HTML & CSS Basics",
            masteryLevel: "Practicing",
            xpEarned: 70,
            xpMax: 200,
            progressHistory: [10, 20, 32, 42, 52, 60, 65, 70],
            questions: [
              {
                id: "html_q1",
                questionText: "What does HTML stand for?",
                type: "fill_in",
                options: [],
                correctAnswer: "HyperText Markup Language",
                explanation:
                  "HTML (HyperText Markup Language) is the standard language for creating web pages.",
                difficulty: 1,
                xpReward: 10,
              },
              {
                id: "html_q2",
                questionText: "Which CSS property changes text color?",
                type: "multiple_choice",
                options: ["font-color", "text-color", "color", "foreground"],
                correctAnswer: "color",
                explanation:
                  "The 'color' property in CSS sets the foreground (text) color of an element.",
                difficulty: 1,
                xpReward: 10,
              },
            ],
          },
        ],
      },
      {
        id: "algorithms",
        name: "Algorithms",
        progress: 15,
        locked: true,
        skills: [
          {
            id: "sorting",
            name: "Sorting Algorithms",
            masteryLevel: "Struggling",
            xpEarned: 15,
            xpMax: 200,
            progressHistory: [2, 4, 7, 9, 11, 13, 14, 15],
            questions: [
              {
                id: "sort_q1",
                questionText: "Which sorting algorithm has average-case time complexity O(n log n)?",
                type: "multiple_choice",
                options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
                correctAnswer: "Merge Sort",
                explanation:
                  "Merge Sort consistently achieves O(n log n) time complexity by dividing and merging arrays.",
                difficulty: 3,
                xpReward: 20,
              },
            ],
          },
        ],
      },
    ],
  },
];

// ── Stats / Leaderboard Mock Data ─────────────────────────────────────────────
export const LEADERBOARD = [
  { rank: 1, name: "Aria Chen", avatar: "AC", xp: 4820, streak: 15 },
  { rank: 2, name: "Marcus J.", avatar: "MJ", xp: 4310, streak: 12 },
  { rank: 3, name: "Sofia R.", avatar: "SR", xp: 3980, streak: 9 },
  { rank: 4, name: "Devon T.", avatar: "DT", xp: 3755, streak: 7 },
  { rank: 5, name: "Yuki M.", avatar: "YM", xp: 3420, streak: 5 },
];

export const USER_STATS = {
  level: 12,
  levelTitle: "Scholar",
  xp: 3200,
  xpForNextLevel: 3500,
  streak: 7,
  todayQuestions: 12,
  todayCorrect: 9,
  todayXP: 145,
  dailyGoal: 20,
  weakSpots: ["Logarithms", "Kinematics", "Genetics"],
  strongSubjects: ["Algebra I", "Geometry", "Grammar"],
  dailyChallengeProgress: 3,
  dailyChallengeGoal: 5,
  dailyChallengeXPBonus: 50,
  dailyChallengeSubject: "Algebra",
};
