import type { User } from "@supabase/supabase-js";
import { defineStore } from "pinia";
import { subscriptionService } from "~/services/subscriptionService";
import { userProfileService } from "~/services/userProfileService";
import type { SubscriptionPlan } from "~/types/subscription";
import type {
  UserProfileFormData,
  UserProfileWithAuth,
} from "~/types/userProfile";

interface AppUserState {
  auth: User | null;
  profile: UserProfileWithAuth | null;
}

export const useUserStore = defineStore("user", () => {
  // State
  const user = ref<AppUserState>({ auth: null, profile: null });
  const isLoading = ref(false);
  const planRef = ref<SubscriptionPlan | null>(null);
  // Internal fetching flag to avoid concurrent requests without affecting UI loading
  const isFetching = ref(false);

  // Getters
  const isLogged = computed(() => Boolean(user.value.auth?.id));
  const hasStripeConnect = computed(() => {
    const p = user.value.profile;
    return Boolean(p?.stripe_account_id);
  });
  const hasBankingInfo = computed(() => {
    const p = user.value.profile;
    return Boolean(p?.bank_account_holder && p?.bank_iban && p?.bank_bic);
  });

  // Derived profile info (add here if needed later)

  // Actions
  const fetchUser = async (opts?: { silent?: boolean }) => {
    const supabaseUser = useSupabaseUser();
    try {
      if (isFetching.value) return user.value;
      isFetching.value = true;
      if (!opts?.silent) isLoading.value = true;

      if (!supabaseUser.value) {
        user.value = { auth: null, profile: null };
        planRef.value = null;
        return null;
      }

      const profileWithAuth = await userProfileService.getUserProfile(
        supabaseUser.value.id
      );

      user.value = {
        auth: supabaseUser.value,
        profile: profileWithAuth ?? null,
      };

      // Load plan if needed
      if (user.value.profile?.plan_id) {
        try {
          planRef.value = await subscriptionService.getPlanById(
            user.value.profile.plan_id
          );
        } catch {
          planRef.value = null;
        }
      } else {
        planRef.value = null;
      }

      return user.value;
    } finally {
      if (!opts?.silent) isLoading.value = false;
      isFetching.value = false;
    }
  };

  const updateProfile = async (data: UserProfileFormData) => {
    const supabaseUser = useSupabaseUser();
    if (!supabaseUser.value) return null;

    // Map Partial<UserProfile> into the form expected by service (UserProfileFormData-like)
    const saved = await userProfileService.upsertUserProfile(
      supabaseUser.value.id,
      data
    );

    user.value = {
      auth: supabaseUser.value,
      profile: {
        ...saved,
        auth: {
          email: supabaseUser.value.email || "",
          name: supabaseUser.value.user_metadata?.name || "",
        },
      },
    };

    // Refresh plan if plan_id changed
    if (saved.plan_id) {
      try {
        planRef.value = await subscriptionService.getPlanById(saved.plan_id);
      } catch {
        planRef.value = null;
      }
    } else {
      planRef.value = null;
    }

    return saved;
  };

  const clear = () => {
    user.value = { auth: null, profile: null };
    planRef.value = null;
  };

  const getDefaultProfileData = (): Partial<UserProfileFormData> => {
    const authUser = useSupabaseUser();
    if (!authUser.value) return {};
    const metadata = authUser.value.user_metadata || {};
    const name: string = metadata.name || "";
    const nameParts = name.split(" ");
    return {
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      company_name: (metadata.organization as string) || null,
      avatar_url: (metadata.avatar_url as string) || null,
    };
  };

  // Getter for plan to respect requested API
  const plan = computed(() => planRef.value);

  return {
    // State
    user,
    isLoading: readonly(isLoading),

    // Getters
    plan,

    isLogged,
    hasStripeConnect,
    hasBankingInfo,

    // Actions
    fetchUser,
    updateProfile,
    clear,
    getDefaultProfileData,
  };
});
