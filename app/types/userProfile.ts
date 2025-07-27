import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type UserProfile = Tables<"user_profiles">;

export interface IUserProfileRepository {
  findById(id: string): Promise<UserProfile | null>;
  create(
    data: Omit<UserProfile, "id" | "created_at" | "updated_at">
  ): Promise<UserProfile>;
  update(id: string, data: Partial<UserProfile>): Promise<UserProfile>;
  upsert(
    data: Omit<UserProfile, "created_at" | "updated_at">
  ): Promise<UserProfile>;
}

// Validation helpers
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

// User profile form validation schema
export const userProfileFormSchema = z.object({
  // Personal information
  first_name: z.string().min(1, "Prénom requis").max(100, "Prénom trop long"),
  last_name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || /^(?:\+33|0)[1-9](?:[0-9]{8})$/.test(val.replace(/\s/g, "")),
      "Format de téléphone invalide (ex: +33123456789 ou 0123456789)"
    ),
  avatar_url: z.string().url().optional().nullable(),

  // Company information
  company_name: z
    .string()
    .max(255, "Nom d'entreprise trop long")
    .optional()
    .nullable(),
  company_address: z
    .string()
    .max(500, "Adresse trop longue")
    .optional()
    .nullable(),
  company_city: z.string().max(100, "Ville trop longue").optional().nullable(),
  company_country: z.string().max(100, "Pays trop long").optional().nullable(),
  company_postal_code: z
    .string()
    .max(20, "Code postal trop long")
    .optional()
    .nullable(),
  company_siret: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === "" || validateSIRET(val),
      "SIRET invalide (14 chiffres avec clé de contrôle valide)"
    ),
  company_tax_id: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === "" || validateFrenchVAT(val),
      "Numéro de TVA invalide (format: FR + 2 chiffres + 9 chiffres SIREN)"
    ),

  // Banking information
  bank_account_holder: z
    .string()
    .max(255, "Nom du titulaire trop long")
    .optional()
    .nullable(),
  bank_name: z
    .string()
    .max(255, "Nom de banque trop long")
    .optional()
    .nullable(),
  bank_iban: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === "" || validateIBAN(val),
      "IBAN invalide"
    ),
  bank_bic: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === "" || validateBIC(val),
      "Code BIC invalide (8 ou 11 caractères)"
    ),

  // Preferences (removed language, preferred_currency, timezone as per user request)
});

export type UserProfileFormData = z.infer<typeof userProfileFormSchema>;

// User profile with auth user information for display
export interface UserProfileWithAuth extends UserProfile {
  auth?: {
    email: string;
    name?: string;
  };
}

// Stripe Connect types - adaptés aux champs de la base de données
export interface StripeConnectAccount {
  account_id: string;
  status: "not_connected" | "pending" | "complete" | "restricted" | "rejected";
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  connected_at: string | null;
}

export interface StripeConnectOnboardingSession {
  url: string;
  account_id: string;
}

// Enhanced user profile with Stripe Connect information
export interface UserProfileWithStripe extends UserProfileWithAuth {
  stripe_account?: StripeConnectAccount;
}

// French Company API Types
export interface CompanyApiResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  sigle: string | null;
  nombre_etablissements: number;
  nombre_etablissements_ouverts: number;
  siege: {
    activite_principale: string;
    adresse: string;
    code_postal: string;
    commune: string;
    libelle_commune: string;
    departement: string;
    region: string;
    coordonnees: string;
    latitude: string;
    longitude: string;
    geo_adresse: string;
    siret: string;
    numero_voie: string | null;
    type_voie: string | null;
    libelle_voie: string | null;
    complement_adresse: string | null;
    date_creation: string;
    etat_administratif: string;
  };
  activite_principale: string;
  date_creation: string;
  etat_administratif: string;
  nature_juridique: string;
}

export interface CompanyApiResponse {
  results: CompanyApiResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CompanySearchItem {
  label: string;
  value: CompanyApiResult;
  icon: string;
}
