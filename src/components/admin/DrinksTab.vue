<template>
  <AdminAddButton @click="openAddDialog">
    Lisa jook
  </AdminAddButton>

  <v-skeleton-loader v-if="isFetching" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="drinks"
    :items-per-page="10"
  >
    <template #item.actions="{ item }">
      <AdminRowActions
        @edit="openEditDialog(item)"
        @delete="deleteDrink(item)"
      />
    </template>
  </v-data-table>

  <AddDrinkDialog
    v-model="addDialog"
    :loading="adding"
    :import-running="importRunning"
    :import-current="importCurrent"
    :import-total="importTotal"
    @file-selected="onDrinksFileChange"
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
import {useToast} from 'vue-toastification';
import {useMainStore} from '@/api/MainStore';
import {DrinkRecord} from '@/molecules/types';
import AddDrinkDialog from '@/molecules/admin/dialogs/AddDrinkDialog.vue';
import EditDrinkDialog from '@/molecules/admin/dialogs/EditDrinkDialog.vue';
import {getItemId, parseCsvRows} from '@/components/admin/utils';
import AdminAddButton from '@/molecules/admin/AdminAddButton.vue';
import AdminRowActions from '@/molecules/admin/AdminRowActions.vue';

const store = useMainStore();
const toast = useToast();

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

const importRunning = ref(false);
const importTotal = ref(0);
const importCurrent = ref(0);

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

async function onDrinksFileChange(fileOrFiles: File | File[] | null) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
  if (!file || importRunning.value) return;

  const text = await file.text();
  const rows = parseCsvRows(text);
  if (rows.length === 0) return;

  const [firstRow] = rows;
  let startIndex = 0;
  if (
    firstRow &&
    firstRow[0]?.toLowerCase() === 'name' &&
    ['price'].includes(firstRow[1]?.toLowerCase())
  ) {
    startIndex = 1;
  }

  const dataRows = rows
    .slice(startIndex)
    .filter((row) => row.length >= 2 && row[0] && row[1]);

  if (dataRows.length === 0) return;

  importRunning.value = true;
  importTotal.value = dataRows.length;
  importCurrent.value = 0;
  let added = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const name = row[0].trim();
    const price = Number(row[1]);
    if (!name || Number.isNaN(price)) {
      skipped += 1;
      importCurrent.value += 1;
      continue;
    }
    const ok = await store.createAdminDrink(
      {name, price},
      {refresh: false, silent: true}
    );
    if (ok) {
      added += 1;
    } else {
      failed += 1;
    }
    importCurrent.value += 1;
  }

  await store.fetchAdminDrinks();
  importRunning.value = false;
  toast.success(`Import valmis: lisatud ${added}, vahele jäetud ${skipped}, ebaõnnestus ${failed}`);
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
  await store.deleteAdminDrink(id);
}
</script>
