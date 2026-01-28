<template>
  <v-container>
    <h2 class="mb-6">Logid</h2>
    <v-card>
      <v-card-text>
        <v-skeleton-loader v-if="isFetchingLogs" type="table" />

        <v-data-table
          v-else
          :headers="headers"
          :items="logs"
          :items-per-page="10"
          class="elevation-1"
          sort-by="timestamp"
          :sort-desc="[true]"
        >
          <template #item.cancellation_timestamp="{ item }">
            <span v-if="item.cancellation_timestamp">{{ item.cancellation_timestamp }}</span>
            <span v-else>-</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn color="error" small @click="onCancel(item)">Tühista</v-btn>
            <v-btn color="primary" small @click="openEdit(item)" class="ml-2">Muuda</v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>Muuda tellimust</v-card-title>
        <v-card-text>
          <v-form ref="editForm">
            <v-text-field v-model="editForm.customer_name" label="Klient" />
            <v-text-field v-model="editForm.drink_name" label="Jook" />
            <v-text-field v-model.number="editForm.quantity" type="number" label="Kogus" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeEdit">Tühista</v-btn>
          <v-btn color="primary" @click="saveEdit">Salvesta</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMainStore } from '@/api/MainStore';

const store = useMainStore();

const headers = [
  { text: 'Aeg', value: 'timestamp', sortable: true },
  { text: 'Tellimus ID', value: 'order_id', sortable: true },
  { text: 'Klient', value: 'customer_name', sortable: true },
  { text: 'Jook', value: 'drink_name', sortable: true },
  { text: 'Kogus', value: 'quantity', sortable: true },
  { text: 'Tühistamise aeg', value: 'cancellation_timestamp', sortable: true },
  { text: 'Tegevused', value: 'actions', sortable: false },
];

const logs = computed(() => store.logs || []);
const isFetchingLogs = computed(() => store.isFetchingLogs);

const editDialog = ref(false);
const editingOrderId = ref<string | null>(null);
const editForm = ref({ customer_name: '', drink_name: '', quantity: 1 });

onMounted(async () => {
  await store.getLogs();
});

function openEdit(item: any) {
  editingOrderId.value = item.order_id;
  editForm.value = {
    customer_name: item.customer_name,
    drink_name: item.drink_name,
    quantity: item.quantity,
  };
  editDialog.value = true;
}

function closeEdit() {
  editDialog.value = false;
  editingOrderId.value = null;
}

async function saveEdit() {
  if (!editingOrderId.value) return;
  const payload = {
    customer_name: editForm.value.customer_name,
    drink_name: editForm.value.drink_name,
    quantity: Number(editForm.value.quantity),
  };
  await store.adminChangeLog(editingOrderId.value, payload);
  closeEdit();
}

async function onCancel(item: any) {
  if (!item || !item.order_id) return;
  // simple confirmation
  if (!confirm(`Tühistada tellimus ${item.order_id}?`)) return;
  await store.adminCancelLog(item.order_id);
}
</script>
