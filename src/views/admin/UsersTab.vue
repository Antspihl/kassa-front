<template>
  <div class="d-flex justify-center mb-4">
    <v-btn color="primary" @click="openAddDialog">
      Lisa kasutaja
    </v-btn>
  </div>

  <v-skeleton-loader v-if="isFetching" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="users"
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
        @click="deleteUser(item)"
      />
    </template>
  </v-data-table>

  <AddUserDialog
    v-model="addDialog"
    :loading="adding"
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
import {useMainStore} from '@/api/MainStore';
import {UserRecord} from '@/molecules/types';
import AddUserDialog from '@/views/admin/dialogs/AddUserDialog.vue';
import EditUserDialog from '@/views/admin/dialogs/EditUserDialog.vue';
import {getItemId} from '@/views/admin/utils';

const store = useMainStore();

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
  if (!confirm(`Kustutada kasutaja ${item.name || id}?`)) return;
  await store.deleteAdminUser(id);
}
</script>
