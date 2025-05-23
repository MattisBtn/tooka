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

// Validation helpers
const validateSIRET = (siret?: string): boolean => {
  if (!siret) return true; // Optional field

  // Remove spaces and non-digits
  const cleanSiret = siret.replace(/\s/g, "").replace(/\D/g, "");

  // Must be exactly 14 digits
  if (cleanSiret.length !== 14) return false;

  // SIRET validation algorithm (Luhn-like)
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleanSiret[i] || "0");

    // Double every other digit starting from the right (even positions from right)
    if ((14 - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
};

const validateFrenchVAT = (vat?: string): boolean => {
  if (!vat) return true; // Optional field

  // Remove spaces and convert to uppercase
  const cleanVat = vat.replace(/\s/g, "").toUpperCase();

  // Must start with FR and be 13 characters total
  if (!cleanVat.startsWith("FR") || cleanVat.length !== 13) return false;

  // Extract parts: FR + 2 control digits + 9 SIREN digits
  const controlDigits = cleanVat.substring(2, 4);
  const sirenPart = cleanVat.substring(4, 13);

  // Control digits and SIREN must be numeric
  if (!/^\d{2}$/.test(controlDigits) || !/^\d{9}$/.test(sirenPart))
    return false;

  // Validate control digits
  const key = parseInt(controlDigits);
  const siren = parseInt(sirenPart);
  const calculatedKey = (12 + 3 * (siren % 97)) % 97;

  return key === calculatedKey;
};

const validateIBAN = (iban?: string): boolean => {
  if (!iban) return true; // Optional field

  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();

  // Basic format check (15-34 characters, starts with 2 letters)
  if (
    !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban) ||
    cleanIban.length < 15 ||
    cleanIban.length > 34
  ) {
    return false;
  }

  // Move first 4 characters to end and convert letters to numbers
  const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (letter) =>
    (letter.charCodeAt(0) - 55).toString()
  );

  // Check mod 97
  return BigInt(numeric) % 97n === 1n;
};

const validateBIC = (bic?: string): boolean => {
  if (!bic) return true; // Optional field

  // Remove spaces and convert to uppercase
  const cleanBic = bic.replace(/\s/g, "").toUpperCase();

  // BIC format: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch)
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanBic);
};

// Base schema with common fields
const baseClientSchema = z.object({
  type: z.enum(["individual", "company"]),
  billing_email: z.string().email("Email invalide").min(1, "Email requis"),
  billing_address: z.string().min(1, "Adresse requise"),
  billing_city: z.string().min(1, "Ville requise"),
  billing_country: z.string().min(1, "Pays requis"),
  billing_postal: z
    .string()
    .min(1, "Code postal requis")
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
  billing_phone: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || /^(?:\+33|0)[1-9](?:[0-9]{8})$/.test(val.replace(/\s/g, "")),
      "Format de téléphone invalide (ex: +33123456789 ou 0123456789)"
    ),
  notes: z.string().optional(),
});

// Individual client schema
export const individualClientSchema = baseClientSchema.extend({
  type: z.literal("individual"),
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  company_name: z.string().optional(),
  siret: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || validateSIRET(val),
      "SIRET invalide (14 chiffres avec clé de contrôle valide)"
    ),
  tax_id: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || validateFrenchVAT(val),
      "Numéro de TVA invalide (format: FR + 2 chiffres + 9 chiffres SIREN)"
    ),
  iban: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || validateIBAN(val),
      "IBAN invalide"
    ),
  bic: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || validateBIC(val),
      "Code BIC invalide (8 ou 11 caractères)"
    ),
});

// Company client schema
export const companyClientSchema = baseClientSchema.extend({
  type: z.literal("company"),
  company_name: z.string().min(1, "Nom de l'entreprise requis"),
  siret: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateSIRET(val),
      "SIRET invalide (14 chiffres avec clé de contrôle valide)"
    ),
  tax_id: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateFrenchVAT(val),
      "Numéro de TVA invalide (format: FR + 2 chiffres + 9 chiffres SIREN)"
    ),
  iban: z
    .string()
    .optional()
    .refine((val) => !val || validateIBAN(val), "IBAN invalide"),
  bic: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateBIC(val),
      "Code BIC invalide (8 ou 11 caractères)"
    ),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// Union schema that validates based on type
export const clientFormSchema = z.discriminatedUnion("type", [
  individualClientSchema,
  companyClientSchema,
]);

export type ClientFormData = z.infer<typeof clientFormSchema>;
