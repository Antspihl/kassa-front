<template>
  <v-skeleton-loader v-if="isFetchingLogs" type="table"/>
  <v-data-table
    v-else
    :headers="headers"
    :items="visibleLogs"
    :items-per-page="10"
    :sort-desc="[true]"
  >
    <template #item.actions="{ item }">
      <v-row v-if="!item.cancellationTimestamp">
        <div class="ml-2">
          <EditDialog :order="mapLogToOrder(item)"/>
        </div>
        <v-btn
          icon="mdi-close"
          color="accent"
          size="small"
          @click="onCancel(item)"
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
import {computed} from 'vue';
import {useMainStore} from '@/api/MainStore';
import EditDialog from '@/molecules/EditDialog.vue';
import {LogItem, Order} from '@/molecules/types';

const store = useMainStore();

const headers = [
  {title: 'Aeg', key: 'timestamp', width: '150px'},
  {title: 'Tellimus ID', key: 'orderId', width: '300px'},
  {title: 'Klient', key: 'customerName', width: '200px'},
  {title: 'Jook', key: 'drinkName', width: '200px'},
  {title: 'Kogus', key: 'quantity', width: '100px'},
  {title: 'Tühistamise aeg', key: 'cancellationTimestamp', width: '150px'},
  {title: 'Tegevused', key: 'actions', sortable: false},
];

const isFetchingLogs = computed(() => store.isFetchingLogs);
const visibleLogs = computed(() => store.logs || []);

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
  if (!confirm(`Tühistada tellimus ${item.orderId}?`)) return;
  await store.adminCancelLog(item.orderId);
}
</script>
