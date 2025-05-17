<script setup lang="ts">
import * as z from 'zod'
import type { IRegistrationData } from '~/types/auth'

definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Create an account - Flow'
})

const { register, loading, error, resetError } = useAuth()
const router = useRouter()

const registrationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z.string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters')
})

const formData = reactive<IRegistrationData>({
    email: '',
    password: '',
    name: ''
})

const emailConfirmationRequired = ref(false)

const handleRegister = async () => {
    resetError()

    const { success, needsEmailConfirmation } = await register(formData)

    if (success) {
        if (needsEmailConfirmation) {
            emailConfirmationRequired.value = true
        } else {
            await router.push('/dashboard')
        }
    }
}
</script>

<template>
    <div>
        <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
            <p class="text-gray-500 dark:text-gray-400">Start your journey with Flow</p>
        </div>

        <UCard class="shadow-lg">
            <div v-if="emailConfirmationRequired" class="py-8 px-4">
                <UIcon name="lucide:mail-check" class="h-12 w-12 mx-auto text-primary-500 mb-4" />
                <h2 class="text-xl font-semibold text-center mb-2">Check your email</h2>
                <p class="text-gray-500 dark:text-gray-400 text-center mb-4">
                    We've sent a confirmation link to <span class="font-medium">{{ formData.email }}</span>.
                    Please check your inbox and click the link to activate your account.
                </p>
                <UButton to="/login" color="primary" variant="outline" block>
                    Return to login
                </UButton>
            </div>

            <UForm v-else :schema="registrationSchema" :state="formData" class="space-y-6" @submit="handleRegister">
                <UFormField label="Full name" name="name" class="w-full">
                    <UInput v-model="formData.name" placeholder="John Doe" autocomplete="name"
                        trailing-icon="lucide:user" class="w-full" />
                </UFormField>

                <UFormField label="Email" name="email" class="w-full">
                    <UInput v-model="formData.email" type="email" placeholder="you@example.com" autocomplete="email"
                        trailing-icon="lucide:mail" class="w-full" />
                </UFormField>

                <UFormField label="Password" name="password" class="w-full">
                    <UInput v-model="formData.password" type="password" placeholder="••••••••"
                        autocomplete="new-password" trailing-icon="lucide:lock" class="w-full" />
                    <template #hint>
                        <span class="text-xs text-gray-500">Password must be at least 6 characters</span>
                    </template>
                </UFormField>

                <UAlert v-if="error" :description="error.message" color="error" variant="soft"
                    icon="lucide:alert-circle" />

                <div class="mt-2">
                    <UCheckbox label="I agree to the Terms of Service and Privacy Policy" name="terms" required />
                </div>

                <UButton type="submit" color="primary" block :loading="loading" :disabled="loading">
                    Create account
                </UButton>

                <div class="text-center pt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?
                        <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </NuxtLink>
                    </p>
                </div>
            </UForm>
        </UCard>
    </div>
</template>