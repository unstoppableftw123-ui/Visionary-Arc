import { z } from "zod";

// ── Note (Notes Studio) ─────────────────────────────────────────────────────
export const noteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or fewer"),
  content: z
    .string()
    .min(1, "Note content cannot be empty")
    .max(10000, "Content must be 10,000 characters or fewer"),
});

// ── Comment / Chat Message ───────────────────────────────────────────────────
export const commentSchema = z.object({
  text: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message must be 500 characters or fewer"),
});

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or fewer"),
  bio: z
    .string()
    .max(500, "Bio must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Task ─────────────────────────────────────────────────────────────────────
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or fewer"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer")
    .refine((v) => /\d/.test(v), "Password must contain at least one number")
    .refine(
      (v) => /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(v),
      "Password must contain at least one special character (!@#$%^&* etc.)"
    ),
});

// ── Community Server ─────────────────────────────────────────────────────────
export const serverSchema = z.object({
  name: z
    .string()
    .min(1, "Server name is required")
    .max(100, "Name must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Community Note ───────────────────────────────────────────────────────────
export const communityNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or fewer"),
  content: z
    .string()
    .max(10000, "Content must be 10,000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Community Goal ───────────────────────────────────────────────────────────
export const goalSchema = z.object({
  title: z
    .string()
    .min(1, "Goal title is required")
    .max(100, "Title must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
  target: z
    .number({ invalid_type_error: "Target must be a number" })
    .int("Target must be a whole number")
    .positive("Target must be greater than 0"),
});

// ── Community Resource ───────────────────────────────────────────────────────
export const resourceSchema = z.object({
  title: z
    .string()
    .min(1, "Resource title is required")
    .max(100, "Title must be 100 characters or fewer"),
  url: z
    .string()
    .url("Enter a valid URL (e.g. https://…)")
    .optional()
    .or(z.literal("")),
  content: z
    .string()
    .max(5000, "Content must be 5,000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Study Hub Content ────────────────────────────────────────────────────────
export const studyContentSchema = z.object({
  content: z
    .string()
    .min(1, "Please enter some content to study")
    .max(50000, "Content must be 50,000 characters or fewer"),
});

// ── Helper: extract first Zod error per field ────────────────────────────────
/**
 * Parses a ZodError into a plain { fieldName: "first error message" } map.
 * @param {import("zod").ZodError} zodError
 * @returns {Record<string, string>}
 */
export function formatZodErrors(zodError) {
  const result = {};
  for (const issue of zodError.errors) {
    const key = issue.path.join(".");
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
