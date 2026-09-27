<template>
  <v-container>
    <h2>Tellimuste logi</h2>
    <v-alert v-if="!store.isOrganizer" type="info">Logi vaatamiseks logi seadete menüüs korraldajana sisse.</v-alert>
    <template v-else>
      <v-btn class="my-3" @click="store.getLogs()">Värskenda logi</v-btn>
      <v-data-table :headers="headers" :items="store.logs" :loading="store.isFetchingLogs" :items-per-page="10">
        <template #item.timestamp="{ value }">{{ formatTimestamp(value) }}</template>
        <template #item.cancellation_timestamp="{ value }">{{ formatTimestamp(value) }}</template>
        <template #item.actions="{ item }">
          <div v-if="!item.cancellation_timestamp">
            <EditDialog :order="mapLogToOrder(item)"/>
            <v-btn icon="mdi-close" color="accent" size="small" @click="onCancel(item)"/>
          </div>
        </template>
      </v-data-table>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import {onMounted, watch} from 'vue';
import {useMainStore} from '@/api/MainStore';
import EditDialog from '@/molecules/EditDialog.vue';
import type {LogItem, Order} from '@/molecules/types';

const store = useMainStore();
const headers = [
  {title: 'Aeg', key: 'timestamp'},
  {title: 'Tellimus ID', key: 'order_id'},
  {title: 'Klient', key: 'customer_name'},
  {title: 'Jook', key: 'drink_name'},
  {title: 'Kogus', key: 'quantity'},
  {title: 'Tühistamise aeg', key: 'cancellation_timestamp'},
  {title: 'Tegevused', key: 'actions', sortable: false},
];
function formatTimestamp(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
function mapLogToOrder(item: LogItem): Order {
  return {id: item.order_id, drink: item.drink_name, name: item.customer_name, amount: Number(item.quantity), isSent: true};
}
async function onCancel(item: LogItem) {
  if (!confirm(`Tühistada tellimus ${item.order_id}?`)) return;
  await store.adminCancelLog(item.order_id);
  await store.getLogs();
}
onMounted(async () => { await store.checkOrganizer(); if (store.isOrganizer) await store.getLogs(); });
watch(() => store.isOrganizer, value => { if (value) store.getLogs(); });
</script>
