import { z } from "zod";
import type { Database } from "./database.types";

export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type FeedbackInsert = Database["public"]["Tables"]["feedback"]["Insert"];
export type FeedbackUpdate = Database["public"]["Tables"]["feedback"]["Update"];

export type FeedbackType = Database["public"]["Enums"]["feedback_type_enum"];
export type UserRole = Database["public"]["Enums"]["user_role_enum"];

export interface FeedbackWithUser extends Feedback {
  user_profile: {
    first_name: string | null;
    last_name: string | null;
    email?: string;
  };
}

// Validation schema for feedback form
export const feedbackFormSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255, "Titre trop long"),
  description: z
    .string()
    .min(1, "Description requise")
    .max(2000, "Description trop longue"),
  type: z.enum(["bug", "feature", "question", "other"]).default("bug"),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
