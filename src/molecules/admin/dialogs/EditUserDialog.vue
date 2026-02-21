<template>
  <AdminDialog
    v-model="model"
    title="Muuda kasutajat"
    submit-text="Salvesta"
    :loading="loading"
    @submit="submit"
  >
    <v-text-field ref="nameRef" v-model="name" label="Nimi" />
    <v-text-field v-model="email" label="E-post" />
  </AdminDialog>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';
import AdminDialog from '@/molecules/admin/dialogs/AdminDialog.vue';

type UserPayload = {
  id: string | number | null;
  name: string;
  email: string;
};

const props = defineProps<{ modelValue: boolean; user: UserPayload; loading?: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: { id: string | number; name?: string; email?: string }): void;
}>();

const name = ref('');
const email = ref('');
const nameRef = ref<any>(null);

const model = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

watch(
  () => [props.modelValue, props.user],
  ([open]) => {
    if (!open) return;
    name.value = props.user?.name || '';
    email.value = props.user?.email || '';
    nextTick(() => {
      const input = nameRef.value?.$el?.querySelector('input');
      input?.focus?.();
    });
  },
  {deep: true}
);

function submit() {
  if (props.user?.id === null || props.user?.id === undefined) return;
  const payload: { id: string | number; name?: string; email?: string } = {id: props.user.id};
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim();
  if (trimmedName) payload.name = trimmedName;
  if (trimmedEmail) payload.email = trimmedEmail;
  if (!payload.name && !payload.email) return;
  emit('submit', payload);
}
</script>
