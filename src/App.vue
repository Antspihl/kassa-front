<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/api/MainStore';

document.title = `Kassa`;

const mainStore = useMainStore();

onMounted(() => {
  // Start connection check when app mounts
  mainStore.startConnectionCheck();
});

onUnmounted(() => {
  // Clean up connection check when app unmounts
  mainStore.stopConnectionCheck();
});
</script>
