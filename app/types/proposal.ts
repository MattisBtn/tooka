import { z } from "zod";
import type { Database } from "./database.types";

// Types de base depuis la base de données
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type ProposalInsert =
  Database["public"]["Tables"]["proposals"]["Insert"];
export type ProposalUpdate =
  Database["public"]["Tables"]["proposals"]["Update"];

// Union type pour tous les statuts possibles
export type ProposalStatus =
  | "draft"
  | "awaiting_client"
  | "revision_requested"
  | "completed"
  | "payment_pending";

// Interface étendue avec relations
export interface ProposalWithProject extends Proposal {
  project: {
    id: string;
    title: string;
    client_id: string;
    payment_method: "stripe" | "bank_transfer" | null;
    bank_iban: string | null;
    bank_bic: string | null;
    bank_beneficiary: string | null;
  };
}

// Schema de validation pour la création/modification de proposition
export const proposalFormSchema = z.object({
  content_html: z.string().min(1, "Le contenu HTML est requis"),
  content_json: z.any(),
  price: z.number().min(0, "Le prix doit être positif"),
  deposit_required: z.boolean(),
  deposit_amount: z.number().nullable(),
  contract_url: z.string().nullable(),
  quote_url: z.string().nullable(),
});

// Schema de validation pour le projet avec paiement
export const projectPaymentSchema = z
  .object({
    payment_method: z.enum(["stripe", "bank_transfer"]).nullable(),
    bank_iban: z.string().nullable(),
    bank_bic: z.string().nullable(),
    bank_beneficiary: z.string().nullable(),
  })
  .refine(
    (data) => {
      if (data.payment_method === "bank_transfer") {
        return data.bank_iban && data.bank_bic && data.bank_beneficiary;
      }
      return true;
    },
    {
      message: "Les coordonnées bancaires sont requises pour les virements",
      path: ["bank_iban"],
    }
  );

// Types pour l'accès client
export interface ClientProposalAccess {
  project: {
    id: string;
    title: string;
    hasPassword: boolean;
    bankDetails?: {
      iban: string;
      bic: string;
      beneficiary: string;
      reference: string;
    };
  };
  proposal: {
    id: string;
    content_html: string;
    content_json: unknown;
    price: number;
    deposit_required: boolean;
    deposit_amount: number | null;
    status: ProposalStatus;
    contract_url: string | null;
    quote_url: string | null;
    project_id: string;
    revision_last_comment: string | null;
    created_at: string;
    updated_at: string;
  };
}

// Types pour les données de paiement côté client
export interface PaymentData {
  method: string;
  amount: number;
  reference: string;
  bankDetails?: {
    iban: string;
    bic: string;
    beneficiary: string;
    reference: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment: PaymentData;
  proposal: {
    id: string;
    status: ProposalStatus;
    clientName: string;
    projectTitle: string;
  };
}

export type ProposalFormData = z.infer<typeof proposalFormSchema>;
export type ProjectPaymentData = z.infer<typeof projectPaymentSchema>;
