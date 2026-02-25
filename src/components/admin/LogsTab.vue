<template>
  <v-row class="mb-2">
    <v-col cols="12" md="4">
      <v-text-field
        v-model="customerFilter"
        label="Otsi nime järgi"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="drinkFilter"
        label="Otsi joogi järgi"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-switch
        v-model="hideCanceled"
        label="Peida tühistatud"
        color="primary"
        hide-details
      />
    </v-col>
  </v-row>

  <v-skeleton-loader v-if="isFetchingLogs" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="filteredLogs"
    :items-per-page="10"
    :sort-desc="[true]"
  >
    <template #header.selected>
      <v-checkbox
        :model-value="allSelected"
        :indeterminate="someSelected && !allSelected"
        hide-details
        @update:model-value="toggleSelectAll"
      />
    </template>
    <template #item.selected="{ item }">
      <v-checkbox
        :model-value="selectedItems.has(item.orderId)"
        hide-details
        @update:model-value="toggleItem(item.orderId)"
      />
    </template>
    <template #item.actions="{ item }">
      <v-row v-if="!item.cancellationTimestamp">
        <div class="ml-2">
          <EditDialog :order="mapLogToOrder(item)"/>
        </div>
        <confirm-action-button
          class="ml-2"
          icon="mdi-close"
          color="accent"
          size="small"
          @confirm="onCancel(item)"
        />
      </v-row>
    </template>
    <template #item.cancellationTimestamp="{ item }">
      <span v-if="item.cancellationTimestamp">{{ item.cancellationTimestamp }}</span>
      <span v-else>-</span>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useMainStore} from '@/api/MainStore';
import EditDialog from '@/molecules/dialogs/EditDialog.vue';
import {LogItem, Order} from '@/molecules/types';
import ConfirmActionButton from "@/molecules/ConfirmActionButton.vue";

const store = useMainStore();

const headers = [
  {title: '', key: 'selected', sortable: false, width: '50px'},
  {title: 'Aeg', key: 'timestamp', width: '150px'},
  {title: 'Klient', key: 'customerName', width: '200px'},
  {title: 'Jook', key: 'drinkName', width: '200px'},
  {title: 'Kogus', key: 'quantity', width: '100px'},
  {title: 'Tühistamise aeg', key: 'cancellationTimestamp', width: '150px'},
  {title: 'Tegevused', key: 'actions', sortable: false},
];

const isFetchingLogs = computed(() => store.isFetchingLogs);
const visibleLogs = computed(() => store.logs || []);
const customerFilter = ref('');
const drinkFilter = ref('');
const hideCanceled = ref(false);
const selectedItems = ref(new Set<string>());

const filteredLogs = computed(() => {
  const customer = customerFilter.value.trim().toLowerCase();
  const drink = drinkFilter.value.trim().toLowerCase();

  let logs = visibleLogs.value;

  // Filter out canceled items if switch is on
  if (hideCanceled.value) {
    logs = logs.filter(item => !item.cancellationTimestamp);
  }

  // Apply text filters
  if (!customer && !drink) return logs;

  return logs.filter((item) => {
    const customerName = (item.customerName || '').toLowerCase();
    const drinkName = (item.drinkName || '').toLowerCase();
    const customerMatch = !customer || customerName.includes(customer);
    const drinkMatch = !drink || drinkName.includes(drink);
    return customerMatch && drinkMatch;
  });
});

const allSelected = computed(() => {
  const logs = filteredLogs.value;
  return logs.length > 0 && logs.every(item => selectedItems.value.has(item.orderId));
});

const someSelected = computed(() => {
  return selectedItems.value.size > 0;
});

function toggleSelectAll(value: boolean | null) {
  if (value) {
    selectedItems.value = new Set(filteredLogs.value.map(item => item.orderId));
  } else {
    selectedItems.value.clear();
  }
}

function toggleItem(orderId: string) {
  if (selectedItems.value.has(orderId)) {
    selectedItems.value.delete(orderId);
  } else {
    selectedItems.value.add(orderId);
  }
}

function mapLogToOrder(item: LogItem): Order {
  return {
    id: item.orderId || '',
    drink: item.drinkName || '',
    name: item.customerName || '',
    amount: Number(item.quantity) || 0,
    isSent: true,
  } as Order;
}

async function onCancel(item: LogItem) {
  if (!item || !item.orderId) return;
  await store.adminCancelLog(item.orderId);
}
</script>
