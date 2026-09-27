<template>
  <v-menu :close-on-content-click="false" width="320">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon="mdi-wrench"/>
    </template>
    <v-list>
      <v-list-item v-if="!mainStore.isOrganizer">
        <v-text-field v-model="password" type="password" label="Korraldaja parool" density="compact" @keyup.enter="login"/>
        <v-btn @click="login" :loading="isLoggingIn" color="info" text="Logi sisse"/>
      </v-list-item>
      <v-list-item v-else>
        <v-btn @click="logout" text="Logi välja"/>
      </v-list-item>
      <v-list-item v-if="mainStore.modeLoaded && !mainStore.modeLocked">
        <v-radio-group :model-value="mainStore.mode" label="Õhtu tüüp" hide-details
                       @update:model-value="setMode">
          <v-radio label="Kohe tasutud" value="paid"/>
          <v-radio label="Järgmise päeva arved" value="unpaid"/>
        </v-radio-group>
      </v-list-item>
      <v-list-item>
        <v-btn @click="importNames" prepend-icon="mdi-account-group" text="Uuenda nimesid"/>
      </v-list-item>
      <v-list-item>
          <v-btn @click="importDrinks" prepend-icon="mdi-glass-cocktail" text="Uuenda jooke"/>
      </v-list-item>
      <v-list-item class="pl-6">
        <v-list-item-title>
          Näidatud tellimuste arv:
        </v-list-item-title>
          <v-chip-group
            mandatory
            color="accent"
            v-model="mainStore.SHOWN_ORDERS_AMOUNT"
          >
            <v-chip
              v-for="amount in [5, 10, 15, 20]"
              :key="amount"
              :value="amount"
              @click="mainStore.SHOWN_ORDERS_AMOUNT = amount"
              :class="{'v-chip--active': mainStore.SHOWN_ORDERS_AMOUNT === amount}"
            >
              {{ amount }}
            </v-chip>
          </v-chip-group>

      </v-list-item>
      <v-list-item class="pl-6">
        <v-list-item-title>
          API URL:
        </v-list-item-title>
        <v-text-field
          v-model="editableApiUrl"
          @blur="updateApiUrl"
          @keyup.enter="updateApiUrl"
          density="compact"
          hide-details
          :placeholder="DEFAULT_API_URL"
        />
      </v-list-item>
      <v-list-item class="pl-6">
        <v-btn
          @click="resetApiUrl"
          prepend-icon="mdi-restore"
          text="Taasta vaikimisi URL"
          size="small"
          variant="tonal"
        />
      </v-list-item>
      <v-list-item v-if="syncStatus" class="py-0 pr-0 pl-4">
        <small>Viimane sünk: {{ formatSyncTime(syncStatus.lastSuccess) }}</small>
        <v-alert v-if="syncStatus.lastError" density="compact" type="error">{{ syncStatus.lastError }}</v-alert>
      </v-list-item>
      <v-list-item class="pl-6">
        <v-btn
          @click="syncNow"
          :loading="isSyncing"
          prepend-icon="mdi-sync"
          text="Sünkrooni"
          size="small"
          variant="tonal"
        />
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";
import {API_URL, DEFAULT_API_URL, setApiUrl, useMainStore} from "@/api/MainStore";
import {useToast} from "vue-toastification";

const mainStore = useMainStore();
const toast = useToast();
const editableApiUrl = ref(API_URL);
const isSyncing = ref(false);
const syncStatus = ref(null);
const password = ref('');
const isLoggingIn = ref(false);

function formatSyncTime(value) {
  if (!value) return 'puudub';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'puudub';
  const pad = number => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

async function login() {
  if (isLoggingIn.value) return;
  isLoggingIn.value = true;
  try {
    await mainStore.organizerLogin(password.value);
    password.value = '';
    toast.success('Sisse logitud');
    await loadSyncStatus();
  } catch (e) {
    const status = e?.response?.status;
    const message = status === 401 ? 'Vale parool'
      : status === 429 ? 'Liiga palju katseid. Proovi hiljem uuesti'
      : status === 503 ? 'ADMIN_PASSWORD puudub serveri seadistusest'
      : e?.response?.data?.error || `Sisselogimine ebaõnnestus. Kontrolli API URL-i: ${API_URL}`;
    toast.error(message);
  } finally {
    isLoggingIn.value = false;
  }
}
async function logout() { await mainStore.organizerLogout(); }
async function setMode(mode) {
  try { await mainStore.setMode(mode); toast.success('Õhtu tüüp salvestatud'); }
  catch (e) { toast.error(e?.response?.data?.error || 'Õhtu tüübi salvestamine ebaõnnestus'); await mainStore.loadMode(); }
}
async function importNames() {
  try { await mainStore.importNames(); } catch (e) { toast.error(e?.response?.data?.error || 'Nimede import ebaõnnestus'); }
}
async function importDrinks() {
  try { await mainStore.importDrinks(); } catch (e) { toast.error(e?.response?.data?.error || 'Jookide import ebaõnnestus'); }
}
async function loadSyncStatus() {
  try { syncStatus.value = (await axios.get(API_URL + '/admin/sync-status')).data; } catch { /* login state will be checked elsewhere */ }
}
watch(() => mainStore.apiUrl, () => loadSyncStatus(), {immediate: true});

function updateApiUrl() {
  try {
    const oldUrl = API_URL;
    const newUrl = setApiUrl(editableApiUrl.value || '');
    editableApiUrl.value = newUrl;
    mainStore.apiUrl = newUrl;
    if (newUrl !== oldUrl) {
      mainStore.modeLoaded = false;
      sessionStorage.removeItem('organizerLoggedIn');
      mainStore.isOrganizer = false;
      mainStore.loadMode().catch(() => toast.error('API URL salvestatud, kuid serveriga ei õnnestunud ühendust saada'));
      toast.success('API URL uuendatud: ' + newUrl);
    }
  } catch (e) {
    toast.error(e?.message || 'Vigane API URL');
  }
}

function resetApiUrl() {
  editableApiUrl.value = '';
  updateApiUrl();
}

async function syncNow() {
  if (isSyncing.value) return;
  isSyncing.value = true;
  try {
    const response = await axios.post(API_URL + '/admin/sync');
    if (response && response.data && response.data.synced === true) {
      toast.success('Sünkroonimine õnnestus');
      await loadSyncStatus();
    } else {
      const err = response && response.data && response.data.error ? response.data.error : 'Tundmatu viga';
      toast.error('Sünkroonimine ebaõnnestus: ' + err);
    }
  } catch (e) {
    const errMsg = e?.response?.data?.error || e?.message || String(e);
    toast.error('Sünkroonimine ebaõnnestus: ' + errMsg);
  } finally {
    isSyncing.value = false;
  }
}
</script>
