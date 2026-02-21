<template>
  <v-dialog v-model="model" max-width="520">
    <v-card>
      <v-card-title>Lisa jook</v-card-title>
      <v-card-text>
        <v-text-field ref="nameRef" v-model="name" label="Joogi nimi" />
        <v-text-field v-model="price" label="Hind" type="number" />
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
  (e: 'submit', payload: { name: string; price: number }): void;
}>();

const name = ref('');
const price = ref('');
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
    price.value = '';
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
  const parsedPrice = Number(price.value);
  if (!trimmedName || Number.isNaN(parsedPrice)) return;
  emit('submit', {name: trimmedName, price: parsedPrice});
}
</script>
