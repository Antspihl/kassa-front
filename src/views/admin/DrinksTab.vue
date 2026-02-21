<template>
  <div class="d-flex justify-center mb-4">
    <v-btn color="primary" @click="openAddDialog">
      Lisa jook
    </v-btn>
  </div>

  <v-skeleton-loader v-if="isFetching" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="drinks"
    :items-per-page="10"
  >
    <template #item.actions="{ item }">
      <v-btn
        icon="mdi-pencil"
        size="small"
        class="mr-2"
        @click="openEditDialog(item)"
      />
      <v-btn
        icon="mdi-delete"
        color="error"
        size="small"
        @click="deleteDrink(item)"
      />
    </template>
  </v-data-table>

  <AddDrinkDialog
    v-model="addDialog"
    :loading="adding"
    @submit="addDrink"
  />

  <EditDrinkDialog
    v-model="editDialog"
    :drink="selectedDrink"
    :loading="saving"
    @submit="saveDrink"
  />
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useMainStore} from '@/api/MainStore';
import {DrinkRecord} from '@/molecules/types';
import AddDrinkDialog from '@/views/admin/dialogs/AddDrinkDialog.vue';
import EditDrinkDialog from '@/views/admin/dialogs/EditDrinkDialog.vue';
import {getItemId} from '@/views/admin/utils';

const store = useMainStore();

const headers = [
  {title: 'ID', key: 'id', width: '120px'},
  {title: 'Joogi nimi', key: 'name'},
  {title: 'Hind', key: 'price', width: '140px'},
  {title: 'Tegevused', key: 'actions', sortable: false},
];

const drinks = computed(() => store.adminDrinks || []);
const isFetching = computed(() => store.isFetchingAdminDrinks);

const addDialog = ref(false);
const editDialog = ref(false);
const adding = ref(false);
const saving = ref(false);

const selectedDrink = ref<{ id: string | number | null; name: string; price: number | null }>(
  {id: null, name: '', price: null}
);

function openAddDialog() {
  addDialog.value = true;
}

function openEditDialog(item: DrinkRecord) {
  selectedDrink.value = {
    id: getItemId(item),
    name: item.name || '',
    price: item.price ?? null,
  };
  editDialog.value = true;
}

async function addDrink(payload: { name: string; price: number }) {
  adding.value = true;
  try {
    await store.createAdminDrink(payload);
    addDialog.value = false;
  } finally {
    adding.value = false;
  }
}

async function saveDrink(payload: { id: string | number; name?: string; price?: number }) {
  saving.value = true;
  try {
    const updatePayload: { name?: string; price?: number } = {};
    if (payload.name) updatePayload.name = payload.name;
    if (payload.price !== undefined) updatePayload.price = payload.price;
    if (Object.keys(updatePayload).length === 0) return;
    await store.updateAdminDrink(payload.id, updatePayload);
    editDialog.value = false;
  } finally {
    saving.value = false;
  }
}

async function deleteDrink(item: DrinkRecord) {
  const id = getItemId(item);
  if (id === null) return;
  if (!confirm(`Kustutada jook ${item.name || id}?`)) return;
  await store.deleteAdminDrink(id);
}
</script>
