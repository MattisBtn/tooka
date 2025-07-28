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
            <ProjectStepper :current-step="currentStep" @step-changed="handleStepChanged" />
        </div>

        <!-- Workflow Error Alert -->
        <UAlert v-if="workflowError" color="error" variant="soft" icon="i-lucide-alert-circle" :title="workflowError"
            class="mt-4" />

        <!-- Step In Progress Alert -->
        <UAlert v-if="stepInProgressMessage" color="warning" variant="soft" icon="i-lucide-clock"
            :title="stepInProgressMessage" class="mt-4" />

        <!-- Current Step Content -->
        <div class="space-y-6">
            <!-- Dynamic Step Content -->
            <div v-if="currentStepConfig">
                <UCard variant="outline">
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                :class="`w-10 h-10 bg-gradient-to-br ${currentStepConfig.gradient} rounded-lg flex items-center justify-center`">
                                <UIcon :name="currentStepConfig.icon" class="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ currentStepConfig.title }}
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ getStepTitle(currentStepConfig.key) }}
                                </p>
                            </div>
                        </div>
                    </template>

                    <div class="space-y-6">
                        <!-- Existing Module (show directly if exists) -->
                        <div
                            v-if="currentStepConfig && getManager(currentStepConfig.key as keyof typeof managers).exists.value">
                            <component :is="currentStepConfig.component" :project-id="props.projectId"
                                :project-initial-price="props.projectInitialPrice"
                                @configured="(key: keyof typeof stepsConfig) => handleModuleConfigured(key)" />
                        </div>

                        <!-- New Module Flow (only show if no existing module) -->
                        <div v-else-if="currentStepConfig">
                            <!-- Module Component (show directly since choice buttons are now in each module) -->
                            <component :is="currentStepConfig.component" :project-id="props.projectId"
                                :project-initial-price="props.projectInitialPrice"
                                @configured="(key: keyof typeof stepsConfig) => handleModuleConfigured(key)" />
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Step Navigation -->
            <div v-if="!isProjectCompleted"
                class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
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
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useGalleryManager } from '~/composables/galleries/useGalleryManager'
import { useMoodboardManager } from '~/composables/moodboards/useMoodboardManager'
import { useProposalManager } from '~/composables/proposals/useProposalManager'
import { useSelectionManager } from '~/composables/selections/useSelectionManager'
import { useModuleState } from '~/composables/shared/useModuleState'
import type { WorkflowStep } from '~/types/project'

// Import des composants
import ProjectGalleryModuleSimple from '~/components/project/gallery/GalleryModuleSimple.vue'
import ProjectMoodboardModuleSimple from '~/components/project/moodboard/MoodboardModuleSimple.vue'
import ProjectProposalModuleSimple from '~/components/project/proposal/ProposalModuleSimple.vue'
import ProjectSelectionModuleSimple from '~/components/project/selection/SelectionModuleSimple.vue'

interface Props {
    projectId: string
    projectInitialPrice?: number
}

const props = defineProps<Props>()

// Configuration centralisée des étapes
const stepsConfig = {
    proposal: {
        key: 'proposal' as const,
        title: 'Proposition',
        icon: 'i-lucide-file-check',
        gradient: 'from-emerald-500 to-emerald-600',
        color: 'text-emerald-500',
        explanationTitle: 'Qu\'est-ce qu\'une proposition ?',
        features: [
            'Devis détaillé avec contenu personnalisable',
            'Gestion des acomptes et paiements',
            'Signature électronique du client',
            'Fichiers joints (devis PDF, contrat)'
        ],
        enableButtonText: 'Oui, créer une proposition',
        skipMessage: 'Vous avez choisi de ne pas utiliser de proposition pour ce projet.',
        component: ProjectProposalModuleSimple
    },
    moodboard: {
        key: 'moodboard' as const,
        title: 'Moodboard',
        icon: 'i-lucide-image',
        gradient: 'from-pink-500 to-pink-600',
        color: 'text-pink-500',
        explanationTitle: 'Qu\'est-ce qu\'un moodboard ?',
        features: [
            'Planche d\'inspiration visuelle pour le client',
            'Validation des directions créatives',
            'Commentaires et réactions du client',
            'Collaboration en temps réel'
        ],
        enableButtonText: 'Oui, créer un moodboard',
        skipMessage: 'Vous avez choisi de ne pas utiliser de moodboard pour ce projet.',
        component: ProjectMoodboardModuleSimple
    },
    selection: {
        key: 'selection' as const,
        title: 'Sélection',
        icon: 'i-lucide-mouse-pointer-click',
        gradient: 'from-orange-500 to-orange-600',
        color: 'text-orange-500',
        explanationTitle: 'Qu\'est-ce qu\'une sélection ?',
        features: [
            'Sélection d\'images par le client',
            'Validation des choix finaux',
            'Gestion des médias supplémentaires',
            'Interface intuitive de sélection'
        ],
        enableButtonText: 'Oui, créer une sélection',
        skipMessage: 'Vous avez choisi de ne pas utiliser de sélection pour ce projet.',
        component: ProjectSelectionModuleSimple
    },
    gallery: {
        key: 'gallery' as const,
        title: 'Galerie',
        icon: 'i-lucide-images',
        gradient: 'from-violet-500 to-violet-600',
        color: 'text-violet-500',
        explanationTitle: 'Qu\'est-ce qu\'une galerie ?',
        features: [
            'Livrable final pour le client',
            'Téléchargement en haute résolution',
            'Gestion des paiements',
            'Interface client sécurisée'
        ],
        enableButtonText: 'Oui, créer une galerie',
        skipMessage: 'Vous avez choisi de ne pas utiliser de galerie pour ce projet.',
        component: ProjectGalleryModuleSimple
    }
}

const totalSteps = Object.keys(stepsConfig).length
const currentStep = ref(1)

// Utiliser le composable centralisé pour l'état des modules
const {
    configureModule,
    enableModule,
    canContinueToNextStep: _canContinueToNextStep,
    loadProject,
    startWorkflow,
    goToNextStep,
    canViewStep,
    hasStepInProgress,
    getStepInProgress,
    project
} = useModuleState(props.projectId)

// Managers
const managers = {
    proposal: useProposalManager(props.projectId),
    moodboard: useMoodboardManager(props.projectId),
    selection: useSelectionManager(props.projectId),
    gallery: useGalleryManager(props.projectId)
}

// Computed properties
const canContinueToNextStep = computed(() => _canContinueToNextStep(currentStep.value))

// Computed pour vérifier si un step peut être consulté
const canViewStepComputed = (stepNumber: number) => canViewStep(stepNumber as WorkflowStep)

// Computed pour obtenir la configuration de l'étape actuelle
const currentStepConfig = computed(() => {
    const stepKeys = Object.keys(stepsConfig) as Array<keyof typeof stepsConfig>
    const currentKey = stepKeys[currentStep.value - 1]
    return currentKey ? stepsConfig[currentKey] : null
})

// Méthodes génériques
const getManager = (key: keyof typeof managers) => managers[key]

const getStepTitle = (key: keyof typeof stepsConfig) => {
    const manager = getManager(key)
    const exists = manager.exists.value
    const config = stepsConfig[key]

    if (exists) {
        const titles = {
            proposal: 'Proposition existante',
            moodboard: 'Moodboard existant',
            selection: 'Sélection existante',
            gallery: 'Galerie existante'
        }
        return titles[key]
    }

    return `Souhaitez-vous créer ${config?.title.toLowerCase()} pour ce projet ?`
}

const handleModuleConfigured = (key: keyof typeof stepsConfig) => {
    configureModule(key)
}

// Workflow error state
const workflowError = ref<string | null>(null)

// Synchroniser le currentStep avec le workflow_step du projet
const syncCurrentStep = () => {
    if (project.value?.workflow_step) {
        currentStep.value = project.value.workflow_step
    }
}

// Handler pour les changements de step depuis le ProjectStepper
const handleStepChanged = (stepNumber: number) => {
    currentStep.value = stepNumber
    workflowError.value = null
}

// Navigation methods
const nextStep = async () => {
    if (currentStep.value < totalSteps) {
        try {
            if (!canContinueToNextStep.value) {
                workflowError.value = "L'étape courante doit être terminée avant de continuer"
                return
            }

            const nextStepNumber = currentStep.value + 1
            if (!canViewStepComputed(nextStepNumber)) {
                workflowError.value = "Le step suivant ne peut pas être consulté car un step plus avancé est configuré"
                return
            }

            await goToNextStep(currentStep.value)
            currentStep.value = nextStepNumber
            workflowError.value = null
        } catch (error) {
            console.error('Error going to next step:', error)
            workflowError.value = "Erreur lors du passage à l'étape suivante"
        }
    }
}

const previousStep = async () => {
    if (currentStep.value > 1) {
        try {
            const previousStepNumber = currentStep.value - 1
            if (!canViewStepComputed(previousStepNumber)) {
                workflowError.value = "Le step précédent ne peut pas être consulté car un step plus avancé est configuré"
                return
            }

            await goToNextStep(previousStepNumber)
            currentStep.value = previousStepNumber
            workflowError.value = null
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

    navigateTo('/projects')
}

const completeOnboarding = async () => {
    try {
        const { projectService } = await import('~/services/projectService')
        await projectService.completeWorkflow(props.projectId)

        const toast = useToast()
        toast.add({
            title: 'Configuration terminée',
            description: 'Votre projet est maintenant prêt !',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        navigateTo('/projects')
    } catch (error) {
        console.error('Error completing onboarding:', error)
        workflowError.value = "Erreur lors de la finalisation de la configuration"
    }
}

// Computed properties
const canProceedToNextStep = computed(() => {
    const canContinue = canContinueToNextStep.value
    if (hasStepInProgress()) {
        return false
    }
    return canContinue
})

const canGoToPreviousStep = computed(() => {
    if (!project.value) return false
    return currentStep.value > 1
})

const isLastStep = computed(() => {
    return currentStep.value === totalSteps
})

const stepInProgressMessage = computed(() => {
    const stepInProgress = getStepInProgress()
    if (!stepInProgress) return null

    const stepNames = {
        1: 'Proposition',
        2: 'Moodboard',
        3: 'Sélection',
        4: 'Galerie'
    }

    return `Vous devez d'abord terminer ou supprimer votre ${stepNames[stepInProgress]} (étape ${stepInProgress}) avant de configurer un autre module.`
})

const isProjectCompleted = computed(() => {
    return project.value?.workflow_completed_at !== null &&
        project.value?.workflow_completed_at !== undefined &&
        project.value?.status === "completed"
})

// Synchroniser le currentStep quand le projet change
watch(project, () => {
    syncCurrentStep()
    // Reset les erreurs de workflow quand le projet change
    workflowError.value = null
}, { immediate: true })

// Watcher pour les changements dans les managers (après suppression/modification)
watch(() => [
    managers.proposal.exists.value,
    managers.moodboard.exists.value,
    managers.selection.exists.value,
    managers.gallery.exists.value
], () => {
    // Resynchroniser le currentStep après changements dans les managers
    syncCurrentStep()
    workflowError.value = null
}, { deep: true })

// Charger le projet et démarrer le workflow au montage
onMounted(async () => {
    try {
        await loadProject()

        if (project.value && !project.value.workflow_started_at) {
            await startWorkflow()
        }

        // Charger tous les managers et configurer les modules existants
        for (const [key, manager] of Object.entries(managers)) {
            await manager.load()

            if (manager.exists.value) {
                enableModule(key as keyof typeof managers, { showForm: false })
                configureModule(key as keyof typeof managers)
            }
        }

        syncCurrentStep()
    } catch (error) {
        console.error('Error initializing onboarding:', error)
        workflowError.value = "Erreur lors de l'initialisation"
    }
})
</script>