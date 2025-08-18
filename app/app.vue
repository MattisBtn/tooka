<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

useScriptCrisp({
  id: config.public.CRISP_ID as string,
});
</script>