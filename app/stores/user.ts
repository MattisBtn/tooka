import type { User } from "@supabase/supabase-js";
import { defineStore } from "pinia";
import { userProfileService } from "~/services/userProfileService";
import type {
  UserProfileFormData,
  UserProfileWithPlan,
} from "~/types/userProfile";

interface AppUserState {
  auth: User | null;
  profile: UserProfileWithPlan | null;
}

export const useUserStore = defineStore("user", () => {
  // State
  const user = ref<AppUserState>({ auth: null, profile: null });
  const isLoading = ref(false);
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

  // Unified payment setup status (Stripe Connect OR banking info)
  const hasPaymentSetup = computed(() => {
    return hasStripeConnect.value || hasBankingInfo.value;
  });

  // Get plan directly from profile (no separate API call needed)
  const plan = computed(() => user.value.profile?.subscription_plans || null);

  // Actions
  const fetchUser = async (opts?: { silent?: boolean }) => {
    try {
      if (isFetching.value) return user.value;
      isFetching.value = true;
      if (!opts?.silent) isLoading.value = true;

      const authUser = useSupabaseUser();
      if (!authUser.value) {
        user.value = { auth: null, profile: null };
        return null;
      }

      const profileWithPlan = await userProfileService.getUserProfile(
        authUser.value.id
      );
      user.value = {
        auth: authUser.value,
        profile: profileWithPlan ?? null,
      };

      return user.value;
    } catch (err) {
      // keep UI responsive; do not mutate state on error beyond loading flags
      console.error("Error fetching user:", err);
      throw err;
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

    // Refresh the full profile with plan data
    const updatedProfile = await userProfileService.getUserProfile(
      supabaseUser.value.id
    );

    user.value = {
      auth: supabaseUser.value,
      profile: updatedProfile,
    };

    return saved;
  };

  const clear = () => {
    user.value = { auth: null, profile: null };
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

  return {
    // State
    user,
    isLoading: isLoading,

    // Getters
    plan,

    isLogged,
    hasStripeConnect,
    hasBankingInfo,
    hasPaymentSetup,

    // Actions
    fetchUser,
    updateProfile,
    clear,
    getDefaultProfileData,
  };
});
