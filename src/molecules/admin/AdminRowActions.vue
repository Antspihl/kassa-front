<template>
  <div class="d-inline-flex align-center">
    <v-btn
      icon="mdi-pencil"
      color="info"
      size="small"
      class="mr-2"
      @click="$emit('edit')"
    />
    <confirm-action-button
      icon="mdi-delete"
      color="accent"
      size="small"
      @confirm="$emit('delete')"
    />
  </div>
</template>

<script setup lang="ts">
import ConfirmActionButton from "@/molecules/ConfirmActionButton.vue";

defineEmits<{
  (e: "edit"): void;
  (e: "delete"): void;
}>();
</script>
