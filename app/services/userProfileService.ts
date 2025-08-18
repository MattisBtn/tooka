import { userProfileRepository } from "~/repositories/userProfileRepository";
import type {
  UserProfile,
  UserProfileFormData,
  UserProfileWithPlan,
} from "~/types/userProfile";

export const userProfileService = {
  /**
   * Get user profile with auth info and subscription plan
   */
  async getUserProfile(userId: string): Promise<UserProfileWithPlan | null> {
    try {
      const profile = await userProfileRepository.findById(userId);

      if (!profile) {
        return null;
      }

      // Get auth user info for email
      const user = useSupabaseUser();
      const authInfo = user.value
        ? {
            email: user.value.email || "",
            name: user.value.user_metadata?.name || "",
          }
        : undefined;

      return {
        ...profile,
        auth: authInfo,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Impossible de récupérer le profil utilisateur");
    }
  },

  /**
   * Create a new user profile
   */
  async createUserProfile(
    profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">
  ): Promise<UserProfile> {
    try {
      return await userProfileRepository.create(profileData);
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw new Error("Impossible de créer le profil utilisateur");
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: UserProfileFormData
  ): Promise<UserProfile> {
    try {
      // Clean up empty strings to null for optional fields
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      ) as Partial<UserProfile>;

      return await userProfileRepository.update(userId, cleanedUpdates);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Impossible de mettre à jour le profil utilisateur");
    }
  },

  /**
   * Create or update user profile (upsert)
   */
  async upsertUserProfile(
    userId: string,
    profileData: UserProfileFormData
  ): Promise<UserProfile> {
    try {
      // Clean up empty strings to null for optional fields
      const cleanedData = Object.fromEntries(
        Object.entries(profileData).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ])
      ) as Partial<UserProfile>;

      const upsertData = {
        id: userId,
        ...cleanedData,
      } as Omit<UserProfile, "created_at" | "updated_at">;

      return await userProfileRepository.upsert(upsertData);
    } catch (error) {
      console.error("Error upserting user profile:", error);
      throw new Error("Impossible de sauvegarder le profil utilisateur");
    }
  },

  /**
   * Get default profile data from auth user
   */
  getDefaultProfileData(): Partial<UserProfileFormData> {
    const user = useSupabaseUser();

    if (!user.value) {
      return {};
    }

    const metadata = user.value.user_metadata || {};
    const name = metadata.name || "";
    const nameParts = name.split(" ");

    return {
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      company_name: metadata.organization || null,
      avatar_url: metadata.avatar_url || null,
    };
  },

  /**
   * Validate profile completeness
   */
  validateProfileCompleteness(profile: UserProfile): {
    isComplete: boolean;
    missingFields: string[];
    completionPercentage: number;
  } {
    const requiredFields = ["first_name", "last_name"];
    const optionalFields = [
      "phone",
      "company_name",
      "company_address",
      "company_city",
      "company_country",
      "company_postal_code",
      "bank_account_holder",
      "bank_name",
      "bank_iban",
      "bank_bic",
    ];

    const missingRequired = requiredFields.filter(
      (field) => !profile[field as keyof UserProfile]
    );

    const filledOptional = optionalFields.filter(
      (field) => profile[field as keyof UserProfile]
    );

    const totalFields = requiredFields.length + optionalFields.length;
    const filledFields =
      requiredFields.length - missingRequired.length + filledOptional.length;
    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    return {
      isComplete: missingRequired.length === 0,
      missingFields: missingRequired,
      completionPercentage,
    };
  },

  /**
   * Get profile sections for UI organization
   */
  getProfileSections() {
    return [
      {
        key: "personal",
        title: "Informations personnelles",
        description: "Votre nom et téléphone",
        icon: "i-heroicons-user",
        color: "from-primary to-primary",
        fields: ["first_name", "last_name", "phone"],
      },
      {
        key: "company",
        title: "Informations entreprise",
        description: "Détails de votre entreprise ou société",
        icon: "i-heroicons-building-office",
        color: "from-emerald-500 to-emerald-600",
        fields: [
          "company_name",
          "company_address",
          "company_city",
          "company_country",
          "company_postal_code",
          "company_siret",
          "company_tax_id",
        ],
      },
      {
        key: "banking",
        title: "Informations bancaires",
        description: "Vos coordonnées bancaires pour les paiements",
        icon: "i-heroicons-credit-card",
        color: "from-indigo-500 to-indigo-600",
        fields: ["bank_account_holder", "bank_name", "bank_iban", "bank_bic"],
      },
    ];
  },
};
