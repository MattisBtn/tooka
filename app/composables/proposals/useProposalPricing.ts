import type { ProjectPaymentData } from "~/types/proposal";

export const useProposalPricing = (
  initialPrice = 0,
  initialDepositRequired = false,
  initialDepositAmount: number | null = null,
  initialProjectPayment?: ProjectPaymentData
) => {
  const price = ref(initialPrice);
  const depositRequired = ref(initialDepositRequired);
  const depositAmount = ref(initialDepositAmount);
  const projectPayment = reactive<ProjectPaymentData>({
    payment_method: initialProjectPayment?.payment_method || null,
    bank_iban: initialProjectPayment?.bank_iban || null,
    bank_bic: initialProjectPayment?.bank_bic || null,
    bank_beneficiary: initialProjectPayment?.bank_beneficiary || null,
  });

  const paymentMethodOptions = [
    { value: "stripe", label: "Stripe (Carte bancaire)", disabled: true },
    { value: "bank_transfer", label: "Virement bancaire" },
  ];

  const quickDepositOptions = [
    { label: "20%", value: 20 },
    { label: "30%", value: 30 },
    { label: "50%", value: 50 },
  ];

  const depositPercentage = computed(() => {
    if (!depositAmount.value || !price.value) return 0;
    return Math.round((depositAmount.value / price.value) * 100);
  });

  const setDepositFromPercentage = (percentage: number) => {
    if (price.value > 0) {
      depositAmount.value = Math.round((price.value * percentage) / 100);
    }
  };

  const reset = () => {
    price.value = initialPrice;
    depositRequired.value = initialDepositRequired;
    depositAmount.value = initialDepositAmount;
    Object.assign(projectPayment, {
      payment_method: initialProjectPayment?.payment_method || null,
      bank_iban: initialProjectPayment?.bank_iban || null,
      bank_bic: initialProjectPayment?.bank_bic || null,
      bank_beneficiary: initialProjectPayment?.bank_beneficiary || null,
    });
  };

  return {
    price,
    depositRequired,
    depositAmount,
    projectPayment,
    depositPercentage,
    paymentMethodOptions,
    quickDepositOptions,
    setDepositFromPercentage,
    reset,
  };
};
