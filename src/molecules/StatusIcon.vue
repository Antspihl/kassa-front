<template>
  <v-icon
    :color="status === 0 ? 'green' : status === 1 ? 'light-blue' : 'red'"
    :size="24"
  >
    {{ status === 0 ? 'mdi-arrow-up-circle' : status === 1 ? 'mdi-swap-vertical-circle' :'mdi-close-circle'}}
  </v-icon>
</template>

<script setup lang="ts">

defineProps({
  //0: adding, 1: changing, 2: canceling,
  status: Number
})
</script>
