import type { Tables } from "./database.types";

export type Proposal = Tables<"proposals">;
export type ProposalOption = Tables<"proposal_options">;

export interface ProposalWithOptions extends Proposal {
  options: ProposalOption[];
  selected_option?: ProposalOption;
}

export interface ProposalFormData {
  title: string;
  description?: string;
  options: ProposalOptionFormData[];
}

export interface ProposalOptionFormData {
  title: string;
  content_html?: string;
  content_json?: unknown;
  price: number;
  deposit_required: boolean;
  deposit_amount?: number;
  order_index: number;
}

export interface ProposalWithClient extends ProposalWithOptions {
  client?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    billing_email: string;
    type: "individual" | "company";
  };
}

export interface RevisionRequest {
  option_id?: string;
  comment: string;
  requested_at: string;
}
