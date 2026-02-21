<template>
  <AdminDialog
    v-model="model"
    title="Muuda jooki"
    submit-text="Salvesta"
    :loading="loading"
    @submit="submit"
  >
    <v-text-field ref="nameRef" v-model="name" label="Joogi nimi" />
    <v-text-field v-model="price" label="Hind" type="number" />
  </AdminDialog>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';
import AdminDialog from '@/molecules/admin/dialogs/AdminDialog.vue';

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
