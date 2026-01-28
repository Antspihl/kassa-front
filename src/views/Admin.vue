<template>
  <v-col>
    <div v-if="lockDialog" class="lock-card-wrapper">
      <v-card class="lock-card">
        <v-card-text>
          <div class="mt-4" style="font-size: 28px; letter-spacing: 6px; text-align: center;">
            {{ displayEntered }}
          </div>
          <div class="red--text text-center mt-2" v-if="errorMessage">{{ errorMessage }}</div>

          <v-row class="mt-4" justify="center">
            <v-col cols="12">
              <v-row justify="center" class="numpad-row">
                <v-col cols="4" v-for="n in [1,2,3]" :key="`r1-${n}`">
                  <v-btn large block @click="appendDigit(String(n))">{{ n }}</v-btn>
                </v-col>
              </v-row>
              <v-row justify="center" class="numpad-row">
                <v-col cols="4" v-for="n in [4,5,6]" :key="`r2-${n}`">
                  <v-btn large block @click="appendDigit(String(n))">{{ n }}</v-btn>
                </v-col>
              </v-row>
              <v-row justify="center" class="numpad-row">
                <v-col cols="4" v-for="n in [7,8,9]" :key="`r3-${n}`">
                  <v-btn large block @click="appendDigit(String(n))">{{ n }}</v-btn>
                </v-col>
              </v-row>
              <v-row justify="center" class="numpad-row">
                <v-col cols="4">
                  <v-btn large block color="error" @click="backspace">←</v-btn>
                </v-col>
                <v-col cols="4">
                  <v-btn large block @click="appendDigit('0')">0</v-btn>
                </v-col>
                <v-col cols="4">
                  <v-btn large block color="primary" @click="submitCode">OK</v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>

    <div v-if="unlocked">
      <v-skeleton-loader v-if="isFetchingLogs" type="table"/>
      <v-data-table
        v-else
        :headers="headers"
        :items="visibleLogs"
        :items-per-page="10"
        :sort-desc="[true]"
      >
        <template #item.actions="{ item }">
          <v-row v-if="!item.cancellation_timestamp">
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
        <template #item.cancellation_timestamp="{ item }">
          <span v-if="item.cancellation_timestamp">{{ item.cancellation_timestamp }}</span>
          <span v-else>-</span>
        </template>
      </v-data-table>
    </div>
  </v-col>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useMainStore} from '@/api/MainStore';
import EditDialog from '@/molecules/EditDialog.vue';
import {LogItem, Order} from '@/molecules/types';

const store = useMainStore();

const headers = [
  {title: 'Aeg', key: 'timestamp', width: '150px'},
  {title: 'Tellimus ID', key: 'order_id', width: '300px'},
  {title: 'Klient', key: 'customer_name', width: '200px'},
  {title: 'Jook', key: 'drink_name', width: '200px'},
  {title: 'Kogus', key: 'quantity', width: '100px'},
  {title: 'Tühistamise aeg', key: 'cancellation_timestamp', width: '150px'},
  {title: 'Tegevused', key: 'actions', sortable: false},
];

const isFetchingLogs = computed(() => store.isFetchingLogs);

const lockDialog = ref(true);
const expectedCode = ref('');
const entered = ref('');
const errorMessage = ref('');

const unlocked = computed(() => !lockDialog.value);
const visibleLogs = computed(() => (unlocked.value ? (store.logs || []) : []));

onMounted(async () => {
  expectedCode.value = getCurrentTimeCode();
  lockDialog.value = true;
});

function getCurrentTimeCode(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${mm}${hh}`;
}

function appendDigit(digit: string) {
  if (entered.value.length >= 4) return;
  entered.value += digit;
  errorMessage.value = '';
}

function backspace() {
  entered.value = entered.value.slice(0, -1);
  errorMessage.value = '';
}

const displayEntered = computed(() => {
  const filled = entered.value.padEnd(4, '•');
  return filled.split('').join(' ');
});

async function submitCode() {
  if (entered.value.length !== 4) {
    errorMessage.value = 'Sisesta 4 numbrit';
    return;
  }
  if (entered.value === expectedCode.value) {
    lockDialog.value = false;
    errorMessage.value = '';
    try {
      await store.getLogs();
    } catch (e) {
      console.error(e);
    }
  } else {
    errorMessage.value = 'Vale kood';
    entered.value = '';
  }
}

function mapLogToOrder(item: LogItem): Order {
  return {
    id: item.order_id || '',
    drink: item.drink_name || '',
    name: item.customer_name || '',
    amount: Number(item.quantity) || 0,
    isSent: true,
  } as Order;
}

async function onCancel(item: LogItem) {
  if (!item || !item.order_id) return;
  if (!confirm(`Tühistada tellimus ${item.order_id}?`)) return;
  await store.adminCancelLog(item.order_id);
}
</script>

<style scoped>
.numpad-row {
  margin-bottom: 8px;
}

.lock-card-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: none;
}

.lock-card {
  pointer-events: auto;
  width: 420px;
}
</style>
