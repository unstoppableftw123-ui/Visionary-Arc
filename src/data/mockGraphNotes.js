/**
 * Mock studio notes for the Notes Graph when localStorage has no saved notes.
 * Each note has markdown content with headings and [[wikilinks]] for a rich graph demo.
 */

export function getMockGraphNotes() {
  const now = new Date();
  const recent = (daysAgo) =>
    new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      note_id: "graph-mock-calculus",
      title: "Calculus Fundamentals",
      tags: ["math", "SAT"],
      updated_at: recent(1),
      content: `# Calculus Fundamentals

## Limits and continuity
Understanding limits is the foundation. A function is continuous at a point when the limit equals the function value. See [[Derivatives Explained]] for how limits lead to the derivative.

### Key theorems
Squeeze theorem and intermediate value theorem are essential. We use them throughout [[Integration Basics]].

## Applications
Rate of change problems connect to [[Physics Motion Notes]]. Optimization uses derivatives.`,
    },
    {
      note_id: "graph-mock-derivatives",
      title: "Derivatives Explained",
      tags: ["math"],
      updated_at: recent(2),
      content: `# Derivatives Explained

## Definition
The derivative is the limit of the difference quotient. It represents instantaneous rate of change. This builds on [[Calculus Fundamentals]].

## Rules
Power rule, product rule, quotient rule, chain rule. Practice with [[Practice Problems Math]].

### Common derivatives
Sine, cosine, exponential, logarithm. Memorize these for [[Integration Basics]].`,
    },
    {
      note_id: "graph-mock-integration",
      title: "Integration Basics",
      tags: ["math", "SAT"],
      updated_at: recent(0),
      content: `# Integration Basics

## Antiderivatives
Reversing the derivative. The indefinite integral and +C. Connected to [[Derivatives Explained]].

## Definite integrals
Area under the curve. Fundamental theorem links to [[Calculus Fundamentals]]. Riemann sums as the foundation.

### Techniques
Substitution and by parts. See [[Practice Problems Math]] for exercises.`,
    },
    {
      note_id: "graph-mock-physics",
      title: "Physics Motion Notes",
      tags: ["physics", "math"],
      updated_at: recent(3),
      content: `# Physics Motion Notes

## Kinematics
Position, velocity, acceleration. Velocity is the derivative of position; acceleration is the derivative of velocity. So [[Derivatives Explained]] is essential here.

## Projectile motion
Parabolic motion under gravity. Uses calculus for max height and range. Compare with [[Calculus Fundamentals]] applications.`,
    },
    {
      note_id: "graph-mock-practice",
      title: "Practice Problems Math",
      tags: ["math", "SAT"],
      updated_at: recent(1),
      content: `# Practice Problems Math

## Limits
Problems on continuity and squeeze theorem. Review [[Calculus Fundamentals]] first.

## Derivatives
Chain rule and applications. From [[Derivatives Explained]].

## Integrals
Substitution and area. From [[Integration Basics]].`,
    },
    {
      note_id: "graph-mock-vocab",
      title: "SAT Vocabulary Core",
      tags: ["SAT", "english"],
      updated_at: recent(4),
      content: `# SAT Vocabulary Core

## High-frequency words
Ubiquitous, pragmatic, ambiguous. Study in context. See [[Practice Problems Math]] for cross-subject review.

### Mnemonics
Techniques to remember definitions. Link to [[Calculus Fundamentals]] for structured note-taking.`,
    },
    {
      note_id: "graph-mock-reading",
      title: "Reading Strategies",
      tags: ["SAT", "english"],
      updated_at: recent(5),
      content: `# Reading Strategies

## Active reading
Annotate and summarize. Connects to how we take [[Physics Motion Notes]] and [[Calculus Fundamentals]].

## Evidence-based answers
Always support with the text. Practice in [[SAT Vocabulary Core]] passages.`,
    },
  ];
}
