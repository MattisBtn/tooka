# 🚀 Implémentation Abonnement SaaS avec Stripe (Architecture Cohérente)

## 📋 Vue d'ensemble

Ce document détaille l'implémentation d'un système d'abonnement SaaS avec Stripe pour l'application Flow, en suivant l'architecture existante.

### Architecture Actuelle

- **Frontend**: Nuxt 3 + TypeScript + Nuxt UI
- **Backend**: Supabase + API routes Nuxt
- **Paiements**: Stripe (déjà configuré pour Connect)
- **Base de données**: PostgreSQL via Supabase
- **Pattern**: Services + Stores + Composables + API routes (sécurité)

## 🗄️ Phase 1: Migration Base de Données

### 1. Tables à créer

```sql
-- Table des plans d'abonnement
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ajouter les champs subscription à user_profiles
ALTER TABLE user_profiles ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE user_profiles ADD COLUMN subscription_end_date TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN stripe_subscription_id VARCHAR(255);

-- Index pour les performances
CREATE INDEX idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles(subscription_status);
```

### 2. Données initiales

```sql
-- Insérer les plans de base
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Starter', 'Pour débuter', 39, 420, '["3 projets", "Support email", "Stockage 1GB"]'),
('Pro', 'Pour les professionnels', 69, 744, '["Projets illimités", "Support prioritaire", "Stockage 10GB"]'),
('Pro+', 'Pour les entreprises', 89, 960, '["Tout inclus", "Support dédié", "Stockage illimité"]');
```

## 📝 Phase 2: Types TypeScript

### Fichier: `app/types/subscription.ts`

```typescript
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "unpaid";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  status: SubscriptionStatus;
  end_date: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export type BillingInterval = "monthly" | "yearly";

export interface CheckoutSession {
  url: string;
  session_id: string;
}
```

## 🔧 Phase 3: Configuration Stripe

### Variables d'environnement

```env
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Configuration Nuxt

```typescript
// nuxt.config.ts - Ajouter aux runtimeConfig
runtimeConfig: {
  public: {
    // ... existing config
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  },
  // ... existing config
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
}
```

## 🚀 Phase 4: Repository (Pattern existant)

### Fichier: `app/repositories/subscriptionRepository.ts`

```typescript
import { supabase } from "~/lib/supabase";
import type { SubscriptionPlan, UserSubscription } from "~/types/subscription";

export const subscriptionRepository = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "subscription_status, subscription_end_date, stripe_subscription_id, stripe_customer_id"
      )
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserSubscription(
    userId: string,
    updates: Partial<UserSubscription>
  ): Promise<void> {
    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
  },
};
```

## 🔧 Phase 5: Service (Pattern existant)

### Fichier: `app/services/subscriptionService.ts`

```typescript
import { subscriptionRepository } from "~/repositories/subscriptionRepository";
import type {
  SubscriptionPlan,
  UserSubscription,
  BillingInterval,
} from "~/types/subscription";

export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    return await subscriptionRepository.getPlans();
  },

  async getCurrentSubscription(
    userId: string
  ): Promise<UserSubscription | null> {
    return await subscriptionRepository.getUserSubscription(userId);
  },

  async updateSubscription(
    userId: string,
    updates: Partial<UserSubscription>
  ): Promise<void> {
    await subscriptionRepository.updateUserSubscription(userId, updates);
  },

  // Méthodes pour l'API routes (sécurité)
  async createCheckoutSession(
    userId: string,
    priceId: string,
    interval: BillingInterval
  ): Promise<{ url: string }> {
    const response = await $fetch("/api/stripe/checkout/create", {
      method: "POST",
      body: { user_id: userId, price_id: priceId, interval },
    });
    return response;
  },
};
```

## 🎨 Phase 6: Store (Pattern existant)

### Fichier: `app/stores/subscription.ts`

```typescript
import { defineStore } from "pinia";
import { subscriptionService } from "~/services/subscriptionService";
import type {
  SubscriptionPlan,
  UserSubscription,
  BillingInterval,
} from "~/types/subscription";

export const useSubscriptionStore = defineStore("subscription", () => {
  // State
  const plans = ref<SubscriptionPlan[]>([]);
  const currentSubscription = ref<UserSubscription | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const hasActiveSubscription = computed(
    () => currentSubscription.value?.status === "active"
  );
  const isTrialing = computed(
    () => currentSubscription.value?.status === "trialing"
  );
  const isPastDue = computed(
    () => currentSubscription.value?.status === "past_due"
  );

  // Actions
  const reset = () => {
    plans.value = [];
    currentSubscription.value = null;
    error.value = null;
  };

  const fetchPlans = async () => {
    try {
      loading.value = true;
      error.value = null;
      plans.value = await subscriptionService.getPlans();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch plans");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchCurrentSubscription = async (userId: string) => {
    try {
      loading.value = true;
      error.value = null;
      currentSubscription.value =
        await subscriptionService.getCurrentSubscription(userId);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch subscription");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createSubscription = async (
    userId: string,
    priceId: string,
    interval: BillingInterval
  ) => {
    try {
      loading.value = true;
      error.value = null;
      const { url } = await subscriptionService.createCheckoutSession(
        userId,
        priceId,
        interval
      );
      window.location.href = url;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create subscription");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    plans: readonly(plans),
    currentSubscription: readonly(currentSubscription),
    loading: readonly(loading),
    error: readonly(error),

    // Getters
    isLoading,
    hasError,
    hasActiveSubscription,
    isTrialing,
    isPastDue,

    // Actions
    reset,
    fetchPlans,
    fetchCurrentSubscription,
    createSubscription,
  };
});
```

## 🚀 Phase 8: API Routes (Sécurité seulement)

### Création de session Checkout

**Fichier: `server/api/stripe/checkout/create.post.ts`**

```typescript
import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.price_id || !body.user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Price ID and User ID are required",
    });
  }

  const { price_id, user_id, interval = "monthly" } = body;
  const config = useRuntimeConfig();
  const supabase = await serverSupabaseServiceRole(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    // Récupérer les infos utilisateur
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id, first_name, last_name")
      .eq("id", user_id)
      .single();

    if (userError) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    let customerId = userProfile?.stripe_customer_id;

    // Créer le customer Stripe s'il n'existe pas
    if (!customerId) {
      const { data: authUser } = await supabase.auth.getUser();
      const customer = await stripe.customers.create({
        email: authUser.user?.email,
        name: `${userProfile?.first_name} ${userProfile?.last_name}`,
        metadata: { user_id },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID
      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user_id);
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "subscription",
      success_url: `${
        config.public.baseUrl || "http://localhost:3000"
      }/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.baseUrl || "http://localhost:3000"}/pricing`,
      metadata: { user_id, interval },
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe checkout creation error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stripe error: ${error.message}`,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create checkout session",
    });
  }
});
```

### Webhooks Stripe

**Fichier: `server/api/stripe/webhooks.post.ts`**

```typescript
import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing body or signature",
    });
  }

  const config = useRuntimeConfig();
  const supabase = await serverSupabaseServiceRole(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    const webhook = stripe.webhooks.constructEvent(
      body,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );

    switch (webhook.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(webhook.data.object, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdate(webhook.data.object, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(webhook.data.object, supabase);
        break;
    }

    return { received: true };
  } catch (error) {
    console.error("Webhook error:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Webhook error",
    });
  }
});

async function handleCheckoutCompleted(session: any, supabase: any) {
  const { user_id } = session.metadata;

  await supabase
    .from("user_profiles")
    .update({
      subscription_status: "active",
      stripe_subscription_id: session.subscription,
    })
    .eq("id", user_id);
}

async function handleSubscriptionUpdate(subscription: any, supabase: any) {
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", subscription.customer)
    .single();

  if (userProfile) {
    await supabase
      .from("user_profiles")
      .update({
        subscription_status: subscription.status,
        subscription_end_date: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("id", userProfile.id);
  }
}

async function handleSubscriptionCancellation(
  subscription: any,
  supabase: any
) {
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", subscription.customer)
    .single();

  if (userProfile) {
    await supabase
      .from("user_profiles")
      .update({
        subscription_status: "canceled",
        subscription_end_date: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("id", userProfile.id);
  }
}
```

## 🎨 Phase 9: Composants UI

### Fichier: `app/components/subscription/Pricing.vue`

```vue
<template>
  <div class="space-y-8">
    <!-- Intervalle de facturation -->
    <div class="flex justify-center">
      <UToggle
        v-model="selectedInterval"
        :options="[
          { label: 'Mensuel', value: 'monthly' },
          { label: 'Annuel', value: 'yearly' },
        ]"
        color="primary"
      />
    </div>

    <!-- Grille des plans -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard
        v-for="plan in plans"
        :key="plan.id"
        class="relative"
        :class="{ 'ring-2 ring-primary-500': isCurrentPlan(plan) }"
      >
        <template #header>
          <div class="text-center">
            <h3 class="text-xl font-semibold">{{ plan.name }}</h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ plan.description }}
            </p>
          </div>
        </template>

        <div class="text-center mb-6">
          <div class="text-3xl font-bold">
            {{ formatPrice(selectedPrice(plan)) }}
            <span
              class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
            >
              /{{ selectedInterval }}
            </span>
          </div>
          <div
            v-if="selectedInterval === 'yearly'"
            class="text-sm text-green-600 dark:text-green-400 mt-1"
          >
            Économisez {{ calculateSavings(plan) }}%
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <div
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-center"
          >
            <UIcon
              name="i-heroicons-check"
              class="w-4 h-4 text-green-500 mr-2"
            />
            <span class="text-sm">{{ feature }}</span>
          </div>
        </div>

        <UButton
          :loading="loading"
          :disabled="loading || isCurrentPlan(plan)"
          :color="isCurrentPlan(plan) ? 'gray' : 'primary'"
          @click="handleSubscribe(plan)"
          class="w-full"
        >
          {{ getButtonText(plan) }}
        </UButton>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SubscriptionPlan } from "~/types/subscription";

const {
  plans,
  currentSubscription,
  loading,
  selectedInterval,
  createSubscription,
  setInterval,
} = useSubscription();

const selectedPrice = (plan: SubscriptionPlan) => {
  return selectedInterval.value === "monthly"
    ? plan.price_monthly
    : plan.price_yearly;
};

const isCurrentPlan = (plan: SubscriptionPlan) => {
  return currentSubscription.value?.status === "active" && plan.name === "Pro"; // À adapter selon vos besoins
};

const getButtonText = (plan: SubscriptionPlan) => {
  if (isCurrentPlan(plan)) return "Plan actuel";
  return `Choisir ${plan.name}`;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};

const calculateSavings = (plan: SubscriptionPlan) => {
  const yearlyPrice = plan.price_yearly;
  const monthlyPrice = plan.price_monthly * 12;
  return Math.round(((monthlyPrice - yearlyPrice) / monthlyPrice) * 100);
};

const handleSubscribe = async (plan: SubscriptionPlan) => {
  if (isCurrentPlan(plan)) return;

  const priceId =
    selectedInterval.value === "monthly"
      ? plan.stripe_price_id_monthly
      : plan.stripe_price_id_yearly;

  await createSubscription(priceId, selectedInterval.value);
};
</script>
```

## 🛡️ Phase 10: Middleware de Protection

### Fichier: `middleware/subscription.ts`

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();

  // Pages nécessitant un abonnement actif
  const protectedRoutes = ["/dashboard", "/projects/create", "/analytics"];

  // Si c'est une route protégée
  if (protectedRoutes.some((route) => to.path.startsWith(route))) {
    // Si pas d'utilisateur connecté
    if (!user.value) {
      return navigateTo("/login");
    }

    // Si pas d'abonnement actif
    if (!hasActiveSubscription.value) {
      return navigateTo("/pricing");
    }
  }
});
```

### Justification du Store dans le Middleware

**Pourquoi utiliser le store ici ?** Le middleware accède à `hasActiveSubscription` qui provient du store, évitant ainsi de refaire une requête à chaque navigation. Le store cache l'état de l'abonnement, améliorant les performances.

## 📄 Phase 11: Pages

### Fichier: `app/pages/pricing.vue`

```vue
<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold mb-4">Choisissez votre plan</h1>
      <p class="text-xl text-neutral-600 dark:text-neutral-400">
        Commencez gratuitement, évoluez selon vos besoins
      </p>
    </div>

    <Pricing />
  </div>
</template>
```

### Fichier: `app/pages/subscription/success.vue`

```vue
<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-md mx-auto text-center">
      <div class="mb-6">
        <UIcon
          name="i-heroicons-check-circle"
          class="w-16 h-16 text-green-500 mx-auto"
        />
      </div>

      <h1 class="text-2xl font-bold mb-4">Abonnement activé !</h1>
      <p class="text-neutral-600 dark:text-neutral-400 mb-8">
        Votre abonnement a été activé avec succès.
      </p>

      <UButton to="/dashboard" color="primary" class="w-full">
        Accéder au dashboard
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
onMounted(async () => {
  const { fetchCurrentSubscription } = useSubscription();
  const { user } = useAuth();
  if (user.value?.id) {
    await fetchCurrentSubscription(user.value.id);
  }
});
</script>
```

## 🔧 Phase 12: Configuration Stripe Dashboard

### 1. Créer les produits et prix

Dans le dashboard Stripe, créer :

```
Product: "Flow Starter"
- Price: 9.99€/mois (price_starter_monthly)
- Price: 99.99€/an (price_starter_yearly)

Product: "Flow Pro"
- Price: 29.99€/mois (price_pro_monthly)
- Price: 299.99€/an (price_pro_yearly)

Product: "Flow Enterprise"
- Price: 99.99€/mois (price_enterprise_monthly)
- Price: 999.99€/an (price_enterprise_yearly)
```

### 2. Configurer les webhooks

Endpoint: `https://votreapp.com/api/stripe/webhooks`

Événements à écouter :

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 🚀 Phase 13: Déploiement

### 1. Migration de base de données

```bash
# Exécuter les scripts SQL dans Supabase
```

### 2. Variables d'environnement

```env
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Tests

```bash
# Tester avec les cartes de test Stripe
# 4242 4242 4242 4242 (succès)
# 4000 0000 0000 0002 (déclined)
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Vérifier les signatures webhook**
2. **Ne jamais stocker les données de carte**
3. **Utiliser HTTPS en production**
4. **Validation côté serveur**

### Gestion des erreurs

```typescript
// Gestion d'erreur simple
try {
  const session = await stripe.checkout.sessions.create({...});
} catch (error) {
  if (error instanceof Stripe.errors.StripeError) {
    console.error('Stripe error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 🎯 Checklist de Déploiement

- [ ] Migration DB exécutée
- [ ] Types TypeScript créés
- [ ] Repository subscription créé
- [ ] Service subscription créé
- [ ] Store subscription créé (multi-vues, coûteux, global)
- [ ] Composable subscription créé (interface simplifiée)
- [ ] Composant UI créé
- [ ] Middleware configuré
- [ ] Pages créées
- [ ] API routes (webhooks + checkout) configurées
- [ ] Produits/prix Stripe configurés
- [ ] Variables d'environnement définies
- [ ] Tests effectués

## 📋 Architecture Decision Summary

### Store vs Composable Usage

**Store (Pinia)** utilisé pour :

- ✅ Données d'abonnement (multi-vues, coûteuses)
- ✅ Plans de souscription (cache global)
- ✅ État utilisateur (global dans l'app)

**Composable** utilisé pour :

- ✅ Interface simplifiée pour les composants
- ✅ Gestion de l'état local (selectedInterval)
- ✅ Encapsulation de la logique métier

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Guide Subscriptions Stripe](https://stripe.com/docs/billing/subscriptions)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
