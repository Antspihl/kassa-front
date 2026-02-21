<template>
  <v-btn
    icon="mdi-pencil"
    color="info"
    size="small"
    class="mr-2"
    @click="$emit('edit')"
  />
  <v-tooltip v-model="showConfirm" location="top">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-close"
        color="accent"
        size="small"
        @click="onDeleteClick"
      />
    </template>
    Kindel?
  </v-tooltip>
</template>

<script setup lang="ts">
import {ref} from 'vue';

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const showConfirm = ref(false);
let confirmTimeout: number | null = null;

function onDeleteClick() {
  if (!showConfirm.value) {
    showConfirm.value = true;
    if (confirmTimeout) {
      clearTimeout(confirmTimeout);
    }
    confirmTimeout = window.setTimeout(() => {
      showConfirm.value = false;
      confirmTimeout = null;
    }, 2000);
    return;
  }

  showConfirm.value = false;
  if (confirmTimeout) {
    clearTimeout(confirmTimeout);
    confirmTimeout = null;
  }
  emit('delete');
}
</script>
