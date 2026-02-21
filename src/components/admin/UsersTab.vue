<template>
  <AdminAddButton @click="openAddDialog">
    Lisa kasutaja
  </AdminAddButton>

  <v-skeleton-loader v-if="isFetching" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="users"
    :items-per-page="10"
  >
    <template #item.actions="{ item }">
      <AdminRowActions
        @edit="openEditDialog(item)"
        @delete="deleteUser(item)"
      />
    </template>
  </v-data-table>

  <AddUserDialog
    v-model="addDialog"
    :loading="adding"
    :import-running="importRunning"
    :import-current="importCurrent"
    :import-total="importTotal"
    @file-selected="onUsersFileChange"
    @submit="addUser"
  />

  <EditUserDialog
    v-model="editDialog"
    :user="selectedUser"
    :loading="saving"
    @submit="saveUser"
  />
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useToast} from 'vue-toastification';
import {useMainStore} from '@/api/MainStore';
import {UserRecord} from '@/molecules/types';
import AddUserDialog from '@/molecules/admin/dialogs/AddUserDialog.vue';
import EditUserDialog from '@/molecules/admin/dialogs/EditUserDialog.vue';
import {getItemId, parseCsvRows} from '@/components/admin/utils';
import AdminAddButton from '@/molecules/admin/AdminAddButton.vue';
import AdminRowActions from '@/molecules/admin/AdminRowActions.vue';

const store = useMainStore();
const toast = useToast();

const headers = [
  {title: 'ID', key: 'id', width: '120px'},
  {title: 'Nimi', key: 'name'},
  {title: 'E-post', key: 'email'},
  {title: 'Tegevused', key: 'actions', sortable: false},
];

const users = computed(() => store.adminUsers || []);
const isFetching = computed(() => store.isFetchingAdminUsers);

const addDialog = ref(false);
const editDialog = ref(false);
const adding = ref(false);
const saving = ref(false);

const importRunning = ref(false);
const importTotal = ref(0);
const importCurrent = ref(0);

const selectedUser = ref<{ id: string | number | null; name: string; email: string }>(
  {id: null, name: '', email: ''}
);

function openAddDialog() {
  addDialog.value = true;
}

function openEditDialog(item: UserRecord) {
  selectedUser.value = {
    id: getItemId(item),
    name: item.name || '',
    email: item.email || '',
  };
  editDialog.value = true;
}

async function addUser(payload: { name: string; email: string }) {
  adding.value = true;
  try {
    await store.createAdminUser(payload);
    addDialog.value = false;
  } finally {
    adding.value = false;
  }
}

async function onUsersFileChange(fileOrFiles: File | File[] | null) {
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
    ['username', 'email'].includes(firstRow[1]?.toLowerCase())
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
    const username = row[1].trim();
    if (!name || !username) {
      skipped += 1;
      importCurrent.value += 1;
      continue;
    }
    const ok = await store.createAdminUser(
      {name, email: username, username},
      {refresh: false, silent: true}
    );
    if (ok) {
      added += 1;
    } else {
      failed += 1;
    }
    importCurrent.value += 1;
  }

  await store.fetchAdminUsers();
  importRunning.value = false;
  toast.success(`Import valmis: lisatud ${added}, vahele jäetud ${skipped}, ebaõnnestus ${failed}`);
}

async function saveUser(payload: { id: string | number; name?: string; email?: string }) {
  saving.value = true;
  try {
    const updatePayload: { name?: string; email?: string } = {};
    if (payload.name) updatePayload.name = payload.name;
    if (payload.email) updatePayload.email = payload.email;
    if (Object.keys(updatePayload).length === 0) return;
    await store.updateAdminUser(payload.id, updatePayload);
    editDialog.value = false;
  } finally {
    saving.value = false;
  }
}

async function deleteUser(item: UserRecord) {
  const id = getItemId(item);
  if (id === null) return;
  await store.deleteAdminUser(id);
}
</script>
