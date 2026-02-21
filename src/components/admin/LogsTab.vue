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
  </v-row>

  <v-skeleton-loader v-if="isFetchingLogs" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="filteredLogs"
    :items-per-page="10"
    :sort-desc="[true]"
  >
    <template #item.actions="{ item }">
      <v-row v-if="!item.cancellationTimestamp">
        <div class="ml-2">
          <EditDialog :order="mapLogToOrder(item)"/>
        </div>
        <v-tooltip v-model="confirmState[item.orderId || '']" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-close"
              color="accent"
              size="small"
              @click="onCancel(item)"
            />
          </template>
          Kindel?
        </v-tooltip>
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
import EditDialog from '@/molecules/EditDialog.vue';
import {LogItem, Order} from '@/molecules/types';

const store = useMainStore();

const headers = [
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
const confirmState = ref<Record<string, boolean>>({});
const confirmTimeouts = new Map<string, number>();

const filteredLogs = computed(() => {
  const customer = customerFilter.value.trim().toLowerCase();
  const drink = drinkFilter.value.trim().toLowerCase();
  if (!customer && !drink) return visibleLogs.value;

  return visibleLogs.value.filter((item) => {
    const customerName = (item.customerName || '').toLowerCase();
    const drinkName = (item.drinkName || '').toLowerCase();
    const customerMatch = !customer || customerName.includes(customer);
    const drinkMatch = !drink || drinkName.includes(drink);
    return customerMatch && drinkMatch;
  });
});

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
  const id = item.orderId;
  const isArmed = confirmState.value[id];
  if (!isArmed) {
    confirmState.value = {...confirmState.value, [id]: true};
    const existing = confirmTimeouts.get(id);
    if (existing) {
      clearTimeout(existing);
    }
    const timeout = window.setTimeout(() => {
      const next = {...confirmState.value};
      delete next[id];
      confirmState.value = next;
      confirmTimeouts.delete(id);
    }, 2000);
    confirmTimeouts.set(id, timeout);
    return;
  }

  const existing = confirmTimeouts.get(id);
  if (existing) {
    clearTimeout(existing);
    confirmTimeouts.delete(id);
  }
  const next = {...confirmState.value};
  delete next[id];
  confirmState.value = next;
  await store.adminCancelLog(item.orderId);
}
</script>
