import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type Client = Tables<"clients">;

export interface IClientFilters {
  search?: string;
  type?: "individual" | "company" | null;
}

export interface IClientRepository {
  findMany(filters: IClientFilters, pagination: IPagination): Promise<Client[]>;
  findById(id: string): Promise<Client | null>;
  create(
    data: Omit<Client, "id" | "created_at" | "updated_at">
  ): Promise<Client>;
  update(id: string, data: Partial<Client>): Promise<Client>;
  delete(id: string): Promise<void>;
}

export interface IPagination {
  page: number;
  pageSize: number;
}

// Base schema with common fields
const baseClientSchema = z.object({
  type: z.enum(["individual", "company"]),
  billing_email: z.string().email("Email invalide").min(1, "Email requis"),
  billing_address: z.string().min(1, "Adresse requise"),
  billing_city: z.string().min(1, "Ville requise"),
  billing_country: z.string().min(1, "Pays requis"),
  billing_postal: z.string().min(1, "Code postal requis"),
  billing_phone: z.string().optional(),
  notes: z.string().optional(),
});

// Individual client schema
export const individualClientSchema = baseClientSchema.extend({
  type: z.literal("individual"),
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  company_name: z.string().optional(),
  siret: z.string().optional(),
  tax_id: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
});

// Company client schema
export const companyClientSchema = baseClientSchema.extend({
  type: z.literal("company"),
  company_name: z.string().min(1, "Nom de l'entreprise requis"),
  siret: z.string().optional(),
  tax_id: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// Union schema that validates based on type
export const clientFormSchema = z.discriminatedUnion("type", [
  individualClientSchema,
  companyClientSchema,
]);

export type ClientFormData = z.infer<typeof clientFormSchema>;

// Form state interface for reactive forms
export interface IClientFormState {
  data: Partial<ClientFormData>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Enhanced form state with touched fields tracking for better UX
export interface IEnhancedClientFormState extends IClientFormState {
  touchedFields: Set<keyof ClientFormData>;
  hasAttemptedSubmit: boolean;
}
