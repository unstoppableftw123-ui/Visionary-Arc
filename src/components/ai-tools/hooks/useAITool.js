import { useState, useContext } from "react";
import { AuthContext } from "../../../App";
import { callAI } from "../../../services/aiRouter";
import { awardActivityXP } from "../../../services/xpService";

// ─── Mock responses per tool type ────────────────────────────────────────────

export function detectTool(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("lesson plan")) return "lessonPlan";
  if (p.includes("multiple choice quiz") || (p.includes("quiz") && p.includes("choices"))) return "quiz";
  if (p.includes("grading rubric") || p.includes("rubric")) return "rubric";
  if (p.includes("report card comment")) return "reportCard";
  if (p.includes("experienced teacher") && p.includes("feedback")) return "writingFeedbackTeacher";
  if (p.includes("unpack this standard")) return "standards";
  if (p.includes("classroom accommodations")) return "accommodations";
  if (p.includes("rewrite this text")) return "textLeveler";
  if (p.includes("patient, encouraging tutor")) return "aiTutor";
  if (p.includes("study partner")) return "studyBot";
  if (p.includes("progressively harder")) return "quizMe";
  if (p.includes("writing coach")) return "writingFeedbackStudent";
  if (p.includes("research assistant")) return "research";
  if (p.includes("based only on the content of the document")) return "chatDocs";
  if (p.includes("expand their idea")) return "expandIdea";
  if (p.includes("debate partner")) return "debate";
  if (p.includes("break down a task")) return "stepByStep";
  return "generic";
}

export const MOCK_RESPONSES = {
  lessonPlan: `## Lesson Plan: Introduction to Fractions

**Grade:** 7th | **Subject:** Math | **Duration:** 45 minutes

---

### 1. Hook / Engagement Opener *(5 min)*
Begin with a real-world pizza problem: "If 3 friends share a pizza cut into 8 slices, how much does each person get?" Allow students to discuss in pairs before revealing the answer. Connect to prior knowledge of division.

### 2. Direct Instruction *(12 min)*
- Define numerator and denominator with visual fraction bars on the board
- Model three examples with increasing complexity: 1/2, 3/4, 5/8
- Introduce equivalent fractions using area models
- Key vocabulary: **numerator**, **denominator**, **equivalent**, **simplify**

### 3. Guided Practice *(10 min)*
Work through 5 problems together as a class using whiteboards:
1. Write 0.5 as a fraction
2. Identify the numerator in 7/12
3. Create an equivalent fraction for 2/4
4. Compare 3/5 and 4/7 using cross-multiplication
5. Simplify 6/9

### 4. Independent Practice *(13 min)*
Students complete a worksheet with 10 problems covering all four skills practiced. Circulate and provide targeted support. Early finishers attempt challenge problems with mixed numbers.

### 5. Exit Ticket *(5 min)*
"Write one fraction equivalent to 3/6 and explain how you know they are equal in 1-2 sentences." Collect before dismissal to inform tomorrow's warm-up.

---
*Materials: Whiteboard markers, fraction bar manipulatives, independent practice worksheet*`,

  quiz: `## Math Quiz: Fractions & Decimals
**Grade:** 7th | **Difficulty:** Medium | **Questions:** 10

---

**1.** Which fraction is equivalent to 0.75?
- A) 1/4
- B) 3/4 ✓
- C) 7/5
- D) 3/5

**2.** What is the simplified form of 12/16?
- A) 6/8
- B) 4/6
- C) 3/4 ✓
- D) 2/3

**3.** Which of the following is greater?
- A) 2/5
- B) 3/8
- C) 4/9
- D) 5/12 ✓

**4.** A pizza is cut into 8 equal slices. Tom eats 3 slices. What fraction of the pizza remains?
- A) 3/8
- B) 5/8 ✓
- C) 3/5
- D) 5/3

**5.** What is 1/4 + 2/4?
- A) 3/8
- B) 2/8
- C) 3/4 ✓
- D) 1/2

**6.** Convert 2.5 to a mixed number.
- A) 5/2
- B) 2 1/5
- C) 2 1/2 ✓
- D) 25/10

**7.** Which fraction is closest to 1?
- A) 3/8
- B) 7/12
- C) 4/5 ✓
- D) 2/3

**8.** Simplify: 15/20
- A) 3/5
- B) 5/6
- C) 3/4 ✓
- D) 4/5

**9.** What is 3/5 of 25?
- A) 10
- B) 12
- C) 15 ✓
- D) 18

**10.** Which expression equals 1?
- A) 4/5 + 1/5 ✓
- B) 3/4 + 1/2
- C) 2/3 + 2/3
- D) 5/6 + 1/3

---

### Answer Key
1-B, 2-C, 3-D, 4-B, 5-C, 6-C, 7-C, 8-C, 9-C, 10-A`,

  rubric: `## Grading Rubric

| Criterion | Excellent (4) | Proficient (3) | Developing (2) | Beginning (1) |
|-----------|--------------|----------------|----------------|---------------|
| **Thesis & Argument** | Thesis is clear, specific, and insightful; argument is consistently supported throughout | Thesis is clear and arguable; argument is mostly supported | Thesis is present but vague; argument has gaps | Thesis is missing or unclear; argument is not evident |
| **Evidence & Analysis** | Uses 3+ specific, relevant pieces of evidence with sophisticated analysis connecting to thesis | Uses 2-3 pieces of evidence with adequate analysis | Uses some evidence but analysis is surface-level | Little to no evidence; no analysis present |
| **Organization** | Introduction, body, and conclusion flow logically; transitions are smooth and purposeful | Clear structure with some minor transitions issues | Structure is present but inconsistent; transitions are abrupt | No discernible organization; ideas are scattered |
| **Writing Conventions** | No grammatical errors; sophisticated and varied sentence structure | 1-2 minor errors; mostly varied sentence structure | 3-5 errors that sometimes impede clarity | 6+ errors that significantly impede clarity |
| **Voice & Style** | Engaging, academic voice maintained throughout; precise word choice | Generally academic voice; mostly appropriate word choice | Voice is inconsistent; some informal language | Informal or off-task language throughout |

---
*Total Points: /20 | Grade Conversion: 18-20=A, 14-17=B, 10-13=C, 6-9=D, 0-5=F*`,

  reportCard: `Alex demonstrates a strong work ethic and actively contributes to class discussions with thoughtful, well-developed responses. Their critical thinking skills are evident in analytical tasks, and they consistently show growth in applying concepts independently. To continue progressing, Alex would benefit from organizing written responses more carefully before submitting and seeking clarification when uncertain. With continued effort and attention to detail, Alex is well-positioned for continued success.`,

  writingFeedbackTeacher: `## Writing Feedback

### Overall Impression
This piece demonstrates clear understanding of the topic and a genuine authorial voice. The writing has strong potential and shows the student has engaged meaningfully with the material.

### Strengths
1. **Opening Hook:** The anecdote in the introduction effectively draws the reader in — "Ever since I was seven..." immediately establishes personal connection.
2. **Specific Evidence:** The student cites concrete details rather than vague claims, which strengthens the argument considerably.
3. **Sentence Variety:** A mix of short, punchy sentences and longer compound sentences creates a natural, readable rhythm.

### Areas for Growth
1. **Thesis Clarity:** The central argument could be stated more precisely in the introduction. The reader shouldn't have to infer the main claim.
2. **Concluding Paragraph:** The conclusion restates the introduction rather than synthesizing learning and extending the argument forward.
3. **Transition Phrases:** Paragraph-to-paragraph transitions are abrupt in sections 2 and 3. Explicit connective phrases would help the reader follow the logic.

### Priority Next Step
Focus the next revision on sharpening the thesis statement. Try writing it as a single sentence that answers: *What am I arguing, and why does it matter?* This one change will strengthen the entire essay.`,

  standards: `## Standards Analysis

### Plain-Language Explanation
Students must be able to read complex informational texts, identify the author's central argument, and explain how the author uses specific evidence and reasoning to support that argument. Students should also evaluate whether the evidence is sufficient and relevant.

### Key Vocabulary
- **Central idea** — the main point or argument the author is making
- **Evidence** — facts, examples, statistics, or quotations used to support a claim
- **Inference** — a conclusion drawn from evidence, not directly stated
- **Textual evidence** — specific words, phrases, or sentences from the text
- **Reasoning** — the logical connection between a claim and its supporting evidence

### "I Can" Statements
1. I can identify the central idea of an informational text.
2. I can explain how an author uses evidence to support their argument.
3. I can evaluate whether the evidence the author provides is relevant and sufficient.
4. I can cite specific textual evidence when explaining what a text says.
5. I can distinguish between an author's stated claims and inferences I draw as a reader.

### Common Student Misconceptions
- Students often confuse the **topic** (what the text is about) with the **central idea** (what the author is arguing about the topic).
- Students may list evidence without explaining the *connection* to the argument.
- Students frequently paraphrase loosely instead of citing specific textual evidence.

### Quick Formative Assessment Idea
**Exit Ticket:** Show students a short paragraph (3-4 sentences). Ask: (1) What is the author's claim? (2) Write one piece of evidence they use. (3) Does the evidence support the claim? Why or why not? Collect and sort into three piles to guide next day's instruction.`,

  accommodations: `## Classroom Accommodations

### Instructional
1. **Break tasks into smaller steps** — Provide multi-step directions one at a time rather than all at once
2. **Pre-teach vocabulary** — Introduce key terms 1-2 days before a lesson using visual word walls
3. **Use graphic organizers** — Offer structured note-taking templates (T-charts, concept maps) for each lesson
4. **Provide worked examples** — Show 2-3 solved problems before independent practice to model thinking

### Assessment
5. **Extended time** — Allow 1.5x time on tests and quizzes
6. **Alternative response formats** — Accept verbal responses, bullet points, or audio recordings in place of full paragraphs
7. **Reduced question sets** — Assign every other problem or core problems only, covering same skills
8. **Chunked assessments** — Break longer tests into 2-3 shorter sessions across days

### Environmental
9. **Preferential seating** — Seat near the front, away from high-traffic/noise areas
10. **Minimize visual distractions** — Provide a clean copy of worksheets without decorative borders or excess images

### Technology
11. **Text-to-speech tools** — Google Read&Write, Natural Reader for reading-heavy content
12. **Speech-to-text** — Allow voice dictation for written responses (Google Docs voice typing)`,

  textLeveler: `## Leveled Text

*Rewritten for the target reading level, with all facts and meaning preserved:*

---

The water cycle is how water moves around Earth. It never stops and never ends.

First, the sun heats water in the ocean. Some of that water turns into water vapor. Water vapor is like invisible water in the air. This step is called **evaporation**.

Next, the water vapor rises up into the sky. It gets cold up high. The vapor turns back into tiny drops of water. These drops form clouds. This step is called **condensation**.

Then the water drops get heavy. They fall back to the ground as rain or snow. This is called **precipitation**.

When rain falls on land, it flows into rivers and lakes. Some of it soaks into the ground. Then the cycle starts all over again.

---
*Key vocabulary terms are bolded. Sentence length and complexity reduced for target reading level.*`,

  aiTutor: `Great question! Let me help you understand this step by step.

Before I explain, I want to ask: **What do you think is happening in this situation?** Even a rough guess is fine — it helps me understand where to start.

Here's a way to think about it:

Imagine you have a jar of marbles. If you want to know how many marbles are in the jar, you could count them one by one. That's similar to what we're doing here — we're breaking a big question into smaller, countable pieces.

**Let's start with the basics:**

1. What do you already know about the topic?
2. What specifically is confusing — is it the concept itself, or how to apply it?

Try to answer those questions in your own words, and I'll guide you from there. Remember: there are no wrong attempts here. Every guess gets us closer to understanding! 💡

*What would you like to try first?*`,

  studyBot: `## Study Guide

Let's make sure you're ready! Here are the **5 key concepts** to focus on:

### 1. Core Concept
The fundamental idea you need to understand is *why* this works, not just *that* it works. Connect it to something you already know.

### 2. Key Vocabulary
Make sure you can define and use these terms in a sentence. Don't just memorize — try explaining them to someone else.

### 3. Common Problem Types
There are usually 2-3 types of questions you'll see. Identify the pattern: What is this question *really* asking?

### 4. Connections
How does this topic connect to what you studied last week? What comes after this in the unit? Seeing the bigger picture helps things stick.

### 5. Practice Check
Before we move on — **Quick quiz time!**

*Question 1:* In your own words, what is the most important thing to remember about this topic?

Take your time. Type your answer and I'll give you feedback! 🎯`,

  quizMe: `## Practice Quiz

**Topic:** Your selected subject
**Format:** Multiple choice + Short answer

---

**Question 1 (Easy):**
What is the most basic definition of the concept?
- A) First option
- B) **Correct answer** ✓
- C) Third option
- D) Fourth option

**Question 2 (Easy):**
Which of the following is an example of this concept in everyday life?
- A) **Best example** ✓
- B) Unrelated example
- C) Opposite of concept
- D) Partial example

**Question 3 (Medium):**
How would you apply this concept to solve the following problem? [scenario]
- A) Incorrect approach
- B) **Correct application** ✓
- C) Common misconception
- D) Overly simplified answer

**Question 4 (Medium):**
What happens if this variable changes? Explain the relationship.
*(Short answer — write 1-2 sentences)*

**Question 5 (Hard):**
Analyze this real-world situation. Which principle best explains what is happening?
- A) Related but wrong principle
- B) Irrelevant concept
- C) **Correct principle** ✓
- D) Opposite principle

---

### Answers: 1-B, 2-A, 3-B, 5-C
*Check your short answer: Did you explain the relationship and direction of change?*`,

  writingFeedbackStudent: `## Writing Feedback for You

### What's Working Well
Your opening paragraph immediately establishes *why* this topic matters — that's exactly what a strong introduction does. I especially liked the line where you said "...this affects everyone, not just students" — that's a great move to connect to your reader.

Your sentence variety is strong too. You naturally shift between short punchy statements and longer explanations, which keeps the writing interesting.

### One Main Thing to Improve
**Your conclusion needs to do more work.** Right now it mostly repeats your introduction. A strong conclusion should answer: *"So what? Why does this matter beyond the paper?"* Try ending with a forward-looking thought or a call to action.

### One Sentence to Revise
**Your current sentence:**
> "This is a very important topic and people should care about it."

**Try something like:**
> "Until we address [specific issue], [specific consequence] will continue — and that affects all of us."

See how the revised version is *specific* and *urgent*? That's the difference between telling and showing.

Keep going — you're on the right track! 🎯`,

  research: `## Research Guide

### Overview
This is a well-studied topic with a rich body of academic and journalistic sources. Here's a 3-4 sentence foundation: The topic involves multiple competing perspectives shaped by historical, economic, and social factors. Researchers have studied this across different populations and time periods. Current consensus highlights several key patterns, though debate continues on causes and solutions. Understanding the basics will help you engage with more complex arguments.

### Key Points & Arguments
1. **Historical context** — how did this issue develop over time?
2. **Current state** — what does the evidence show today?
3. **Point of debate** — where do experts disagree and why?
4. **Counterarguments** — what do critics of the mainstream view say?
5. **Real-world implications** — who is affected and how?

### Where to Look for Sources
- **Statistics & Data:** Look for government agency reports (CDC, Census Bureau, Dept. of Education) or university research centers — search "[topic] + data + site:.gov" or "[topic] + report + site:.edu"
- **Expert Opinions:** Look for peer-reviewed journal articles on Google Scholar — filter by date (last 5 years) for recent findings
- **Background Info:** Encyclopædia Britannica Academic, JSTOR, or PBS LearningMedia for accessible overviews
- **Multiple Perspectives:** Search "[topic] + pros and cons" on AllSides.com to see how different outlets frame the issue

### Guiding Research Questions
1. What are the root causes of this issue, and how do different sources explain them?
2. What evidence exists on both sides of the main debate?
3. Who is most impacted by this issue, and what solutions have been proposed or tried?`,

  chatDocs: `## Document Q&A

Based on the document you provided, here is the answer to your question:

---

The document directly addresses this in the relevant section. According to the text:

> *"[Relevant quote from document would appear here based on your actual content]"*

This means that the key point you're asking about is explained in terms of the relationship between the main concepts presented. The author's argument hinges on this specific detail, which supports the broader conclusion found later in the document.

**If your question asked about something not covered in the document:** This specific information is not explicitly stated in the document you shared. The document focuses on [related topics], but does not directly address [your specific question]. You may need to consult an additional source for this detail.

---
*Note: In the live version, this response will be grounded entirely in your uploaded document's content.*`,

  expandIdea: `## Ways to Expand Your Idea

Great starting point! Here are **3 directions** you could take this:

---

**Direction 1: Add concrete detail**
> "More specifically, this happens because [specific mechanism or cause]. For example, in [real-world context], we can see that [specific illustration of your point]."

This direction works well if you want to make your idea more *specific and credible* with evidence.

---

**Direction 2: Add a counterargument**
> "Some might argue that [opposing view]. However, this overlooks [key factor], which actually shows that [your point is still valid/more nuanced]."

This direction works well if you're writing a persuasive piece and want to show you've considered other views.

---

**Direction 3: Zoom out to the bigger picture**
> "This matters beyond just [your immediate topic] — it connects to a larger pattern in [broader field/society], where [bigger implications of your idea]."

This direction works well for conclusions or if you want to make your idea feel more significant.

---

**Which direction feels right for what you're writing?** Once you pick one, try drafting 2-3 sentences in that direction. You've got this! ✍️`,

  debate: `## Opening Argument

I'll take the opposing position: **[Counter position to your stated argument]**

---

Here's my opening case:

The evidence strongly suggests the opposite of what you've proposed. First, consider the practical reality: [concrete point 1 based on your topic]. This alone challenges the premise of your argument.

Furthermore, [concrete point 2] — a factor that proponents of your position often overlook. The data consistently shows [supporting detail], which makes it difficult to sustain your claim under scrutiny.

Finally, the historical record is instructive here. In every comparable case where [scenario related to topic], the outcome was [outcome that supports my side]. This pattern is not coincidental.

---

**Your turn.** Respond to my opening argument. What's your strongest counter?

*Remember: Focus on the argument, not the person. Let's debate the ideas!* ⚔️`,

  stepByStep: `## Breaking Down Your Task

### What This Task Is Really Asking
At its core, this task wants you to demonstrate that you understand [key concept] well enough to apply it independently. Don't overthink it — break it into pieces and tackle each one.

### Steps to Complete It

1. **Read the full prompt carefully** — Underline or highlight the key action words (explain, compare, calculate, analyze). These tell you *exactly* what to do.

2. **Gather what you need** — Pull out your notes, textbook, or any provided materials. Don't start without the resources that will help you.

3. **Plan before you write/solve** — Spend 2-3 minutes outlining your approach. For essays: main points. For problems: write out the formula or strategy.

4. **Work through it section by section** — Don't try to do everything at once. Complete each part fully before moving to the next.

5. **Check your work** — Re-read the original prompt and verify you answered what was actually asked. This one step can save your grade.

6. **Clean up and finalize** — Fix any obvious errors, make sure labels/headers are clear, and submit with confidence.

### Hardest Step Tip
Most students rush **Step 1** — they start too fast before fully understanding what's asked. Spend at least 60 seconds just reading and re-reading the instructions.

### Before You Start — Check Your Understanding
**Can you finish this sentence in your own words?**
> *"My goal in this task is to _____ by _____, which shows my teacher that I understand _____."*

If you can complete that sentence, you're ready to go. What does your answer sound like? 🚀`,

  generic: `## AI-Generated Response

Based on your inputs, here is the generated content:

---

This is a comprehensive response tailored to your specific request. The content has been organized to be immediately usable in your classroom or study session.

**Key Points:**
- First actionable insight derived from your inputs
- Second specific recommendation based on context provided
- Third supporting detail that adds depth and nuance
- Fourth practical application for your specific use case

**Next Steps:**
Consider how you can adapt this content to your specific students' needs and the learning environment. The most effective implementations are those that are customized to the local context.

---

*Connect your OpenRouter API key with Claude claude-sonnet-4-20250514 to receive fully personalized, context-aware responses.*`,
};

// ─── Interpolate template ────────────────────────────────────────────────────

export function interpolate(template, data) {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const safeValue = Array.isArray(value) ? value.join(", ") : (value ?? "");
    result = result.replace(new RegExp(`\\[${key}\\]`, "g"), safeValue);
  });
  return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const TOOL_FEATURE_MAP = {
  "Lesson Plan Generator": "lesson_plan",
  "Rubric Builder": "lesson_plan",
  "Quiz Generator": "quiz",
  "Essay Feedback": "essay_feedback",
  "Summarizer": "summarize",
  "Flashcard Generator": "flashcards",
  "Slide Deck Builder": "slides",
};

const TOOL_ACTIVITY_MAP = {
  "Flashcard Generator": "flashcards",
  "Quiz Generator": "quiz",
  "Summarizer": "summary",
};

export function useAITool() {
  const { user, refreshCoins } = useContext(AuthContext);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async ({ toolName, formData }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const feature = TOOL_FEATURE_MAP[toolName] ?? "fast";
    const prompt = "Generate output for: " + JSON.stringify(formData);

    try {
      const text = await callAI({ feature, prompt, userId: user?.id, onCoinsUpdated: refreshCoins });
      setResult(text);
      // Award XP for successful generation (fire-and-forget)
      const activityType = TOOL_ACTIVITY_MAP[toolName];
      if (user?.id && activityType) {
        awardActivityXP(user.id, activityType, null).catch(() => {});
      }
      return text;
    } catch (err) {
      if (err.message === "INSUFFICIENT_COINS") {
        setError("Not enough coins. Visit Store to top up.");
      } else {
        setError(err.message || "Generation failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, isLoading, error, generate, reset };
}
