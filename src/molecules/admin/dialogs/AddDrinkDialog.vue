<template>
  <AdminDialog
    v-model="model"
    title="Lisa jook"
    submit-text="Lisa"
    :loading="loading"
    @submit="submit"
  >
    <v-text-field ref="nameRef" v-model="name" label="Joogi nimi" />
    <v-text-field v-model="price" label="Hind" type="number" />
    <v-file-input
      class="mt-2"
      label="Impordi CSV (name, price)"
      accept=".csv,text/csv"
      prepend-icon="mdi-file-upload"
      @update:modelValue="onFileChange"
    />
    <v-progress-linear
      v-if="importRunning"
      :model-value="importProgress"
      height="20"
      class="mt-3"
    >
      <template #default>
        Loading {{ importCurrent }} out of {{ importTotal }}
      </template>
    </v-progress-linear>
  </AdminDialog>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';
import AdminDialog from '@/molecules/admin/dialogs/AdminDialog.vue';

const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
  importRunning?: boolean;
  importCurrent?: number;
  importTotal?: number;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: { name: string; price: number }): void;
  (e: 'file-selected', file: File | File[] | null): void;
}>();

const name = ref('');
const price = ref('');
const nameRef = ref<any>(null);

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const importProgress = computed(() => {
  const total = props.importTotal ?? 0;
  const current = props.importCurrent ?? 0;
  if (total <= 0) return 0;
  return Math.round((current / total) * 100);
});

const importRunning = computed(() => props.importRunning ?? false);
const importCurrent = computed(() => props.importCurrent ?? 0);
const importTotal = computed(() => props.importTotal ?? 0);

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

function onFileChange(file: File | File[] | null) {
  emit('file-selected', file);
}

function submit() {
  const trimmedName = name.value.trim();
  const parsedPrice = Number(price.value);
  if (!trimmedName || Number.isNaN(parsedPrice)) return;
  emit('submit', {name: trimmedName, price: parsedPrice});
}
</script>
