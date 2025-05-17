<script setup lang="ts">
const user = useSupabaseUser()

// Redirect based on authentication status
onMounted(() => {
  navigateTo(user.value ? '/dashboard' : '/login')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <ULoading size="lg" color="primary" />
  </div>
</template>