<template>
  <v-dialog v-model="model" max-width="520">
    <v-card>
      <v-card-title>Lisa kasutaja</v-card-title>
      <v-card-text>
        <v-text-field ref="nameRef" v-model="name" label="Nimi" />
        <v-text-field v-model="email" label="E-post" />
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn text="Tühista" @click="close"/>
        <v-btn color="primary" text="Lisa" :loading="loading" @click="submit"/>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';

const props = defineProps<{ modelValue: boolean; loading?: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: { name: string; email: string }): void;
}>();

const name = ref('');
const email = ref('');
const nameRef = ref<any>(null);

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    name.value = '';
    email.value = '';
    nextTick(() => {
      const input = nameRef.value?.$el?.querySelector('input');
      input?.focus?.();
    });
  }
);

function close() {
  emit('update:modelValue', false);
}

function submit() {
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim();
  if (!trimmedName || !trimmedEmail) return;
  emit('submit', {name: trimmedName, email: trimmedEmail});
}
</script>
