import { z } from "zod";

export const personalInfoSchema = z.object({
  first_name: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  last_name: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  bio: z.string()
    .min(10, "Bio must be at least 10 characters")
    .max(500, "Bio must be less than 500 characters"),
});

export const preferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type OtherInfoFormData = z.infer<typeof preferencesSchema>;
