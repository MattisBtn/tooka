<template>
    <div class="space-y-8">
        <!-- Progress Indicator -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Configuration du projet
                </h2>
                <UBadge variant="subtle" color="primary" :label="`Étape ${currentStep} sur ${totalSteps}`" />
            </div>

            <!-- Progress Bar -->
            <UProgress v-model="currentStep" :max="totalSteps" color="primary" class="mb-6" />

            <!-- Steps Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div v-for="(step, index) in steps" :key="step.key" :class="[
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    index + 1 === currentStep
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                        : index + 1 < currentStep
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                ]">
                    <div :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        index + 1 === currentStep
                            ? 'bg-primary-500'
                            : index + 1 < currentStep
                                ? 'bg-emerald-500 text-white'
                                : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400'
                    ]">
                        <UIcon v-if="index + 1 < currentStep" name="i-lucide-check" class="w-4 h-4" />
                        <span v-else>{{ index + 1 }}</span>
                    </div>
                    <div>
                        <p :class="[
                            'text-sm font-medium',
                            index + 1 === currentStep
                                ? 'text-primary-700 dark:text-primary-300'
                                : index + 1 < currentStep
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-neutral-600 dark:text-neutral-400'
                        ]">
                            {{ step.title }}
                        </p>
                        <p class="text-xs text-neutral-500 dark:text-neutral-500">
                            {{ step.description }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Current Step Content -->
        <div class="space-y-6">
            <!-- Step 1: Proposition -->
            <div v-if="currentStep === 1">
                <UCard variant="outline">
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-file-check" class="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    Module Proposition
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Souhaitez-vous créer une proposition commerciale pour ce projet ?
                                </p>
                            </div>
                        </div>
                    </template>

                    <div class="space-y-6">
                        <!-- Feature explanation -->
                        <div
                            class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                Qu'est-ce qu'une proposition ?
                            </h4>
                            <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                <li class="flex items-start gap-2">
                                    <UIcon name="i-lucide-check"
                                        class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>Devis détaillé avec contenu personnalisable</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <UIcon name="i-lucide-check"
                                        class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>Gestion des acomptes et paiements</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <UIcon name="i-lucide-check"
                                        class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>Signature électronique du client</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <UIcon name="i-lucide-check"
                                        class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>Fichiers joints (devis PDF, contrat)</span>
                                </li>
                            </ul>
                        </div>

                        <!-- Choice buttons (only show if no choice made yet) -->
                        <div v-if="!moduleConfig.proposal.enabled && !moduleConfig.proposal.configured"
                            class="flex flex-col sm:flex-row gap-4">
                            <UButton icon="i-lucide-plus" color="primary" size="lg" class="flex-1 justify-center"
                                :loading="moduleConfig.proposal.loading" @click="enableProposal">
                                Oui, créer une proposition
                            </UButton>

                            <UButton icon="i-lucide-arrow-right" variant="outline" color="neutral" size="lg"
                                class="flex-1 justify-center" @click="skipProposal">
                                Non, passer à l'étape suivante
                            </UButton>
                        </div>

                        <!-- Choice made indicator -->
                        <div v-else-if="moduleConfig.proposal.configured && !moduleConfig.proposal.enabled"
                            class="text-center py-4">
                            <UBadge color="success" variant="subtle" size="lg" label="Étape ignorée"
                                icon="i-lucide-check" />
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                                Vous avez choisi de ne pas utiliser de proposition pour ce projet.
                            </p>
                        </div>

                        <!-- Proposal Module (if enabled) -->
                        <div v-if="moduleConfig.proposal.enabled"
                            class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <!-- Utiliser le nouveau module simplifié -->
                            <ProjectProposalModuleSimple :project-id="props.projectId"
                                :project-initial-price="props.projectInitialPrice"
                                @proposal-configured="handleProposalConfigured" />
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Step 2: Moodboard -->
            <div v-if="currentStep === 2">
                <UCard variant="outline">
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-image" class="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    Module Moodboard
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ moodboardTitle }}
                                </p>
                            </div>
                        </div>
                    </template>

                    <div class="space-y-6">
                        <!-- Existing Moodboard (show directly if exists) -->
                        <div v-if="moodboardManager.exists.value"
                            class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <ProjectMoodboardModuleSimple :project-id="props.projectId"
                                @moodboard-configured="handleMoodboardConfigured" />
                        </div>

                        <!-- New Moodboard Flow (only show if no existing moodboard) -->
                        <div v-else>
                            <!-- Feature explanation -->
                            <div
                                class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                    Qu'est-ce qu'un moodboard ?
                                </h4>
                                <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                    <li class="flex items-start gap-2">
                                        <UIcon name="i-lucide-check"
                                            class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Planche d'inspiration visuelle pour le client</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <UIcon name="i-lucide-check"
                                            class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Validation des directions créatives</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <UIcon name="i-lucide-check"
                                            class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Commentaires et réactions du client</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <UIcon name="i-lucide-check"
                                            class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                        <span>Collaboration en temps réel</span>
                                    </li>
                                </ul>
                            </div>

                            <!-- Choice buttons (only show if no choice made yet) -->
                            <div v-if="!moduleConfig.moodboard.enabled && !moduleConfig.moodboard.configured"
                                class="flex flex-col sm:flex-row gap-4">
                                <UButton icon="i-lucide-plus" color="primary" size="lg" class="flex-1 justify-center"
                                    :loading="moduleConfig.moodboard.loading" @click="enableMoodboard">
                                    Oui, créer un moodboard
                                </UButton>

                                <UButton icon="i-lucide-arrow-right" variant="outline" color="neutral" size="lg"
                                    class="flex-1 justify-center" @click="skipMoodboard">
                                    Non, passer à l'étape suivante
                                </UButton>
                            </div>

                            <!-- Choice made indicator -->
                            <div v-else-if="moduleConfig.moodboard.configured && !moduleConfig.moodboard.enabled"
                                class="text-center py-4">
                                <UBadge color="success" variant="subtle" size="lg" label="Étape ignorée"
                                    icon="i-lucide-check" />
                                <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                                    Vous avez choisi de ne pas utiliser de moodboard pour ce projet.
                                </p>
                            </div>

                            <!-- Moodboard Module (if enabled) -->
                            <div v-if="moduleConfig.moodboard.enabled"
                                class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <ProjectMoodboardModuleSimple :project-id="props.projectId"
                                    @moodboard-configured="handleMoodboardConfigured" />
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Step Navigation -->
            <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <UButton v-if="canGoToPreviousStep" icon="i-lucide-arrow-left" variant="ghost" color="neutral"
                    label="Étape précédente" @click="previousStep" />
                <div v-else />

                <div class="flex items-center gap-3">
                    <UButton icon="i-lucide-save" variant="outline" color="neutral"
                        label="Sauvegarder et continuer plus tard" @click="saveAndExit" />

                    <UButton v-if="!isLastStep" icon="i-lucide-arrow-right" color="primary" label="Étape suivante"
                        :disabled="!canProceedToNextStep" @click="nextStep" />

                    <UButton v-else icon="i-lucide-check-circle" color="success" label="Terminer la configuration"
                        :disabled="!canProceedToNextStep" @click="completeOnboarding" />
                </div>
            </div>

            <!-- Workflow Error Alert -->
            <UAlert v-if="workflowError" color="error" variant="soft" icon="i-lucide-alert-circle"
                :title="workflowError" class="mt-4" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useMoodboardManager } from '~/composables/moodboards/useMoodboardManager'
import { useModuleState } from '~/composables/shared/useModuleState'

interface Props {
    projectId: string
    projectInitialPrice?: number
    existingProposal?: {
        id: string
        content_json: unknown
        content_html: string
        status: "draft" | "awaiting_client" | "revision_requested" | "completed" | "payment_pending"
        price: number
        deposit_required: boolean
        deposit_amount: number | null
        contract_url: string | null
        quote_url: string | null
    } | null
}

const props = defineProps<Props>()

// Step configuration
const steps = [
    {
        key: 'proposal',
        title: 'Proposition',
        description: 'Devis et contrat'
    },
    {
        key: 'moodboard',
        title: 'Moodboard',
        description: 'Inspiration visuelle'
    },
    {
        key: 'selection',
        title: 'Sélection',
        description: 'Choix client'
    },
    {
        key: 'gallery',
        title: 'Galerie',
        description: 'Livrable final'
    }
]

const totalSteps = steps.length
const currentStep = ref(1)

// Utiliser le composable centralisé pour l'état des modules
const {
    moduleConfig,
    enableModule,
    configureModule,
    canContinueToNextStep: _canContinueToNextStep,
    loadProject,
    startWorkflow,
    goToNextStep,
    project
} = useModuleState(props.projectId)

// Utiliser le composable pour gérer le moodboard
const moodboardManager = useMoodboardManager(props.projectId)

// Computed properties
const canContinueToNextStep = computed(() => _canContinueToNextStep(currentStep.value))

// Computed pour le texte du moodboard
const moodboardTitle = computed(() => {
    return moodboardManager.exists.value ? 'Moodboard existant' : 'Souhaitez-vous créer un moodboard d\'inspiration pour ce projet ?'
})

// Workflow error state
const workflowError = ref<string | null>(null)

// Synchroniser le currentStep avec le workflow_step du projet
const syncCurrentStep = () => {
    if (project.value?.workflow_step) {
        currentStep.value = project.value.workflow_step
    }
}

// Methods
const enableProposal = () => {
    // Utiliser la méthode du composable centralisé
    enableModule('proposal', { showForm: true }) // Afficher directement le formulaire

    const toast = useToast()
    toast.add({
        title: 'Module activé',
        description: 'Le module proposition est maintenant disponible.',
        icon: 'i-lucide-check-circle',
        color: 'success'
    })
}

const skipProposal = () => {
    // Utiliser la méthode du composable centralisé
    configureModule('proposal') // Marqué comme "configuré" puisque skippé

    const toast = useToast()
    toast.add({
        title: 'Étape ignorée',
        description: 'Le module proposition a été ignoré. Vous pourrez l\'activer plus tard si nécessaire.',
        icon: 'i-lucide-info',
        color: 'info'
    })
}

const handleProposalConfigured = () => {
    // Marquer comme configuré quand le module notifie la fin
    configureModule('proposal')
}

// Moodboard methods
const enableMoodboard = () => {
    // Utiliser la méthode du composable centralisé
    enableModule('moodboard', { showForm: true }) // Afficher directement le formulaire

    const toast = useToast()
    toast.add({
        title: 'Module activé',
        description: 'Le module moodboard est maintenant disponible.',
        icon: 'i-lucide-check-circle',
        color: 'success'
    })
}

const skipMoodboard = () => {
    // Utiliser la méthode du composable centralisé
    configureModule('moodboard') // Marqué comme "configuré" puisque skippé

    const toast = useToast()
    toast.add({
        title: 'Étape ignorée',
        description: 'Le module moodboard a été ignoré. Vous pourrez l\'activer plus tard si nécessaire.',
        icon: 'i-lucide-info',
        color: 'info'
    })
}

const handleMoodboardConfigured = () => {
    // Marquer comme configuré quand le module notifie la fin
    configureModule('moodboard')
}

const nextStep = async () => {
    if (currentStep.value < totalSteps) {
        try {
            // Vérifier si on peut passer à l'étape suivante
            if (!canContinueToNextStep.value) {
                workflowError.value = "L'étape courante doit être terminée avant de continuer"
                return
            }

            // Mettre à jour le workflow step seulement si on avance réellement
            const nextStepNumber = currentStep.value + 1
            await goToNextStep(currentStep.value)

            // Passer à l'étape suivante
            currentStep.value = nextStepNumber
            workflowError.value = null

            const toast = useToast()
            toast.add({
                title: 'Étape suivante',
                description: `Passage à l'étape ${currentStep.value}`,
                icon: 'i-lucide-arrow-right',
                color: 'success'
            })
        } catch (error) {
            console.error('Error going to next step:', error)
            workflowError.value = "Erreur lors du passage à l'étape suivante"
        }
    }
}

const previousStep = async () => {
    if (currentStep.value > 1) {
        try {
            // Mettre à jour le workflow step pour revenir en arrière
            const previousStepNumber = currentStep.value - 1
            await goToNextStep(previousStepNumber)

            currentStep.value = previousStepNumber
            workflowError.value = null

            const toast = useToast()
            toast.add({
                title: 'Étape précédente',
                description: `Retour à l'étape ${currentStep.value}`,
                icon: 'i-lucide-arrow-left',
                color: 'info'
            })
        } catch (error) {
            console.error('Error going to previous step:', error)
            workflowError.value = "Erreur lors du retour à l'étape précédente"
        }
    }
}

const saveAndExit = () => {
    const toast = useToast()
    toast.add({
        title: 'Configuration sauvegardée',
        description: 'Votre progression a été sauvegardée. Vous pouvez reprendre plus tard.',
        icon: 'i-lucide-save',
        color: 'success'
    })

    // Rediriger vers la liste des projets
    navigateTo('/projects')
}

const completeOnboarding = async () => {
    try {
        // Marquer le workflow comme terminé
        const { projectService } = await import('~/services/projectService')
        await projectService.completeWorkflow(props.projectId)

        const toast = useToast()
        toast.add({
            title: 'Configuration terminée',
            description: 'Votre projet est maintenant prêt !',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Rediriger vers la liste des projets
        navigateTo('/projects')
    } catch (error) {
        console.error('Error completing onboarding:', error)
        workflowError.value = "Erreur lors de la finalisation de la configuration"
    }
}

// Computed pour vérifier si on peut passer à l'étape suivante
const canProceedToNextStep = computed(() => {
    if (!project.value) return false

    // Vérifier si le workflow a commencé
    if (!project.value.workflow_started_at) return true // Première fois

    // Vérifier si l'étape courante est terminée
    const currentStepModule = steps[currentStep.value - 1]?.key
    if (!currentStepModule) return false

    // Fonction helper pour vérifier le statut du module
    const isModuleCompleted = (moduleKey: string) => {
        switch (moduleKey) {
            case 'proposal':
                return project.value?.proposal?.status === 'completed'
            case 'moodboard':
                return project.value?.moodboard?.status === 'completed'
            case 'selection':
                return project.value?.selection?.status === 'completed'
            case 'gallery':
                return project.value?.gallery?.status === 'completed'
            default:
                return false
        }
    }

    return isModuleCompleted(currentStepModule)
})

// Computed pour vérifier si on peut revenir à l'étape précédente
const canGoToPreviousStep = computed(() => {
    if (!project.value) return false

    // On peut toujours revenir à l'étape précédente si on n'est pas à la première étape
    return currentStep.value > 1
})

// Computed pour vérifier si l'étape actuelle est la dernière étape
const isLastStep = computed(() => {
    return currentStep.value === totalSteps
})

// Initialize state based on existing proposal
watchEffect(() => {
    if (props.existingProposal) {
        // Si une proposition existe déjà, marquer comme configuré et activé
        enableModule('proposal', { showForm: false })
        configureModule('proposal')
    }
})

// Synchroniser le currentStep quand le projet change
watch(project, () => {
    syncCurrentStep()
}, { immediate: true })

// Charger le projet et démarrer le workflow au montage
onMounted(async () => {
    try {
        // Charger les données du projet
        await loadProject()

        // Démarrer le workflow si pas encore commencé
        if (project.value && !project.value.workflow_started_at) {
            await startWorkflow()
        }

        // Charger le moodboard
        await moodboardManager.load()

        // Si un moodboard existe déjà, le marquer comme configuré
        if (moodboardManager.exists.value) {
            enableModule('moodboard', { showForm: false })
            configureModule('moodboard')
        }

        // Synchroniser le currentStep avec le workflow_step du projet
        syncCurrentStep()
    } catch (error) {
        console.error('Error initializing onboarding:', error)
        workflowError.value = "Erreur lors de l'initialisation"
    }
})
</script>