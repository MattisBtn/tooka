import type {
  CompanyApiResponse,
  CompanyApiResult,
  CompanySearchItem,
} from "~/types/userProfile";

export const useCompanySearch = () => {
  const config = useRuntimeConfig();

  const isLoading = ref(false);
  const searchResults = ref<CompanySearchItem[]>([]);

  const searchCompanies = async (
    query: string
  ): Promise<CompanySearchItem[]> => {
    if (!query || query.length < 3) {
      searchResults.value = [];
      return [];
    }

    isLoading.value = true;

    try {
      const response = await $fetch<CompanyApiResponse>("/search", {
        baseURL: config.public.companySearchApiUrl,
        params: { q: query, per_page: 25 },
      });

      const items: CompanySearchItem[] = response.results.map((company) => ({
        label: company.nom_complet,
        value: company,
        icon: "i-heroicons-building-office",
      }));

      searchResults.value = items;
      return items;
    } catch (error) {
      console.error("Error searching companies:", error);
      searchResults.value = [];
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const fillCompanyData = (company: CompanyApiResult) => {
    return {
      company_name: company.nom_complet,
      company_address: company.siege.geo_adresse,
      company_city: company.siege.libelle_commune,
      company_postal_code: company.siege.code_postal,
      company_country: "France",
      company_siret: company.siege.siret,
    };
  };

  return {
    isLoading: readonly(isLoading),
    searchResults: readonly(searchResults),
    searchCompanies,
    fillCompanyData,
  };
};
