import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type Proposal = Tables<"proposals">;

export interface IProposalFilters {
  search?: string;
  status?:
    | "draft"
    | "awaiting_client"
    | "revision_requested"
    | "completed"
    | null;
  project_id?: string;
}

export interface IProposalRepository {
  findMany(
    filters: IProposalFilters,
    pagination: IPagination
  ): Promise<Proposal[]>;
  findById(id: string): Promise<Proposal | null>;
  findByProjectId(projectId: string): Promise<Proposal | null>;
  create(
    data: Omit<Proposal, "id" | "created_at" | "updated_at">
  ): Promise<Proposal>;
  update(id: string, data: Partial<Proposal>): Promise<Proposal>;
  delete(id: string): Promise<void>;
}

export interface IPagination {
  page: number;
  pageSize: number;
}

// Proposal status options for UI
export interface ProposalStatusItem {
  value: "draft" | "awaiting_client" | "revision_requested" | "completed";
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Validation schema for proposal form
export const proposalFormSchema = z
  .object({
    content_json: z.array(z.any()).default([]),
    content_html: z.string().default(""),
    price: z
      .number()
      .min(0, "Le prix doit être positif")
      .refine((val) => val > 0, "Le prix est requis"),
    deposit_required: z.boolean().default(false),
    deposit_amount: z
      .number()
      .min(0, "Le montant de l'acompte doit être positif")
      .optional()
      .nullable(),
    contract_url: z.string().optional().nullable(),
    quote_url: z.string().optional().nullable(),
    status: z
      .enum(["draft", "awaiting_client", "revision_requested", "completed"])
      .default("draft"),
  })
  .refine(
    (data) => {
      // If deposit is required, deposit_amount must be provided and > 0
      if (data.deposit_required) {
        return data.deposit_amount && data.deposit_amount > 0;
      }
      return true;
    },
    {
      message: "Le montant de l'acompte est requis quand l'acompte est activé",
      path: ["deposit_amount"],
    }
  )
  .refine(
    (data) => {
      // If deposit_amount is provided, it should not exceed the total price
      if (data.deposit_amount && data.price) {
        return data.deposit_amount <= data.price;
      }
      return true;
    },
    {
      message: "Le montant de l'acompte ne peut pas dépasser le prix total",
      path: ["deposit_amount"],
    }
  );

export type ProposalFormData = z.infer<typeof proposalFormSchema>;

// Proposal with project information for display
export interface ProposalWithProject extends Proposal {
  project?: {
    id: string;
    title: string;
    status: "draft" | "in_progress" | "completed";
  };
}
