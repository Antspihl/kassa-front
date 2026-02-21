<template>
  <v-dialog v-model="model" max-width="520">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <slot />
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn text="Tühista" @click="close"/>
        <v-btn color="primary" :text="submitText" :loading="loading" @click="submit"/>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed} from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  submitText: string;
  loading?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit'): void;
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

function close() {
  emit('update:modelValue', false);
}

function submit() {
  emit('submit');
}
</script>
