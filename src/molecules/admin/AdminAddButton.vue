<template>
  <div class="d-flex justify-center mb-4">
    <v-btn color="primary" @click="$emit('click')">
      <slot />
    </v-btn>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'click'): void }>();
</script>
