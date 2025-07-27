import type { FormSubmitEvent } from "@nuxt/ui";
import { useAuth } from "~/composables/auth/useAuth";
import { userProfileService } from "~/services/userProfileService";
import type {
  UserProfile,
  UserProfileFormData,
  UserProfileWithAuth,
} from "~/types/userProfile";
import { userProfileFormSchema } from "~/types/userProfile";

export const useUserProfile = () => {
  const { user } = useAuth();

  // Shared reactive state using useState for singleton behavior
  const profile = useState<UserProfileWithAuth | null>(
    "user.profile",
    () => null
  );
  const isLoading = useState("user.profile.isLoading", () => false);
  const isSubmitting = useState("user.profile.isSubmitting", () => false);
  const error = useState<string | null>("user.profile.error", () => null);

  // Form state - keep local as it's component-specific
  const formState = ref<UserProfileFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: null,
    company_name: null,
    company_address: null,
    company_city: null,
    company_country: null,
    company_postal_code: null,
    company_siret: null,
    company_tax_id: null,
    bank_account_holder: null,
    bank_name: null,
    bank_iban: null,
    bank_bic: null,
  });

  // Schema for form validation
  const schema = userProfileFormSchema;

  // Computed properties
  const isProfileComplete = computed(() => {
    if (!profile.value) return false;
    const validation = userProfileService.validateProfileCompleteness(
      profile.value
    );
    return validation.isComplete;
  });

  const completionPercentage = computed(() => {
    if (!profile.value) return 0;
    const validation = userProfileService.validateProfileCompleteness(
      profile.value
    );
    return validation.completionPercentage;
  });

  const profileSections = computed(() =>
    userProfileService.getProfileSections()
  );

  // Reset error state
  const resetError = () => {
    error.value = null;
  };

  // Initialize form state from profile data
  const initializeFormState = (profileData?: UserProfile | null) => {
    if (profileData) {
      // Map profile data to form state
      formState.value = {
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone: profileData.phone || "",
        avatar_url: profileData.avatar_url,
        company_name: profileData.company_name,
        company_address: profileData.company_address,
        company_city: profileData.company_city,
        company_country: profileData.company_country,
        company_postal_code: profileData.company_postal_code,
        company_siret: profileData.company_siret,
        company_tax_id: profileData.company_tax_id,
        bank_account_holder: profileData.bank_account_holder,
        bank_name: profileData.bank_name,
        bank_iban: profileData.bank_iban,
        bank_bic: profileData.bank_bic,
      };
    } else {
      // Initialize with default data from auth user
      const defaultData = userProfileService.getDefaultProfileData();
      formState.value = {
        ...formState.value,
        ...defaultData,
      };
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    if (!user.value) {
      error.value = "Vous devez être connecté pour accéder au profil";
      return;
    }

    isLoading.value = true;
    resetError();

    try {
      const profileData = await userProfileService.getUserProfile(
        user.value.id
      );
      profile.value = profileData;
      initializeFormState(profileData);
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du profil";
      // Initialize form with default data if profile doesn't exist
      initializeFormState(null);
    } finally {
      isLoading.value = false;
    }
  };

  // Save profile
  const saveProfile = async (
    data: UserProfileFormData
  ): Promise<UserProfile | null> => {
    if (!user.value) {
      error.value = "Vous devez être connecté pour sauvegarder le profil";
      return null;
    }

    isSubmitting.value = true;
    resetError();

    try {
      // Clean phone number by removing spaces and non-digit characters (except +)
      const cleanedData = {
        ...data,
        phone: data.phone ? data.phone.replace(/\s/g, "") : data.phone,
      };

      const savedProfile = await userProfileService.upsertUserProfile(
        user.value.id,
        cleanedData
      );

      // Update local state
      profile.value = {
        ...savedProfile,
        auth: profile.value?.auth,
      };

      // Update form state
      initializeFormState(savedProfile);

      // Success notification
      const toast = useToast();
      toast.add({
        title: "Profil sauvegardé",
        description: "Vos informations ont été mises à jour avec succès",
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      return savedProfile;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde";

      // Error notification
      const toast = useToast();
      toast.add({
        title: "Erreur de sauvegarde",
        description: error.value,
        color: "error",
        icon: "i-heroicons-exclamation-triangle",
      });

      return null;
    } finally {
      isSubmitting.value = false;
    }
  };

  // Handle form submission
  const onSubmit = async (event: FormSubmitEvent<UserProfileFormData>) => {
    return await saveProfile(event.data);
  };

  // Reset form to original values
  const resetForm = () => {
    initializeFormState(profile.value);
  };

  // Check if form has changes
  const hasChanges = computed(() => {
    if (!profile.value) return true; // New profile

    return Object.keys(formState.value).some((key) => {
      const formValue = formState.value[key as keyof UserProfileFormData];
      const profileValue = profile.value![key as keyof UserProfile];

      // Handle null/empty string equivalency
      const normalizedFormValue = formValue === "" ? null : formValue;
      const normalizedProfileValue = profileValue === "" ? null : profileValue;

      return normalizedFormValue !== normalizedProfileValue;
    });
  });

  // Refresh profile data
  const refresh = async () => {
    await fetchProfile();
  };

  // Initialize profile on mount
  onMounted(async () => {
    if (user.value) {
      await fetchProfile();
    }
  });

  // Watch for user changes
  watch(
    user,
    async (newUser) => {
      if (newUser) {
        await fetchProfile();
      } else {
        profile.value = null;
        error.value = null;
      }
    },
    { immediate: false }
  );

  return {
    // State
    profile: readonly(profile),
    formState,
    isLoading: readonly(isLoading),
    isSubmitting: readonly(isSubmitting),
    error: readonly(error),

    // Computed
    isProfileComplete,
    completionPercentage,
    profileSections,
    hasChanges,
    schema,

    // Methods
    fetchProfile,
    saveProfile,
    onSubmit,
    resetForm,
    resetError,
    refresh,
  };
};
