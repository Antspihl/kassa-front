<template>
  <v-dialog v-model="model" max-width="520">
    <v-card>
      <v-card-title>Muuda jooki</v-card-title>
      <v-card-text>
        <v-text-field ref="nameRef" v-model="name" label="Joogi nimi" />
        <v-text-field v-model="price" label="Hind" type="number" />
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn text="Tühista" @click="close"/>
        <v-btn color="primary" text="Salvesta" :loading="loading" @click="submit"/>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';

type DrinkPayload = {
  id: string | number | null;
  name: string;
  price: number | null;
};

const props = defineProps<{ modelValue: boolean; drink: DrinkPayload; loading?: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: { id: string | number; name?: string; price?: number }): void;
}>();

const name = ref('');
const price = ref('');
const nameRef = ref<any>(null);

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

watch(
  () => [props.modelValue, props.drink],
  ([open]) => {
    if (!open) return;
    name.value = props.drink?.name || '';
    price.value = props.drink?.price === null || props.drink?.price === undefined
      ? ''
      : String(props.drink.price);
    nextTick(() => {
      const input = nameRef.value?.$el?.querySelector('input');
      input?.focus?.();
    });
  },
  {deep: true}
);

function close() {
  emit('update:modelValue', false);
}

function submit() {
  if (props.drink?.id === null || props.drink?.id === undefined) return;
  const payload: { id: string | number; name?: string; price?: number } = {id: props.drink.id};
  const trimmedName = name.value.trim();
  if (trimmedName) payload.name = trimmedName;
  const parsedPrice = Number(price.value);
  if (!Number.isNaN(parsedPrice)) payload.price = parsedPrice;
  if (!payload.name && payload.price === undefined) return;
  emit('submit', payload);
}
</script>
