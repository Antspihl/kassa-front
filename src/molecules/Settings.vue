<template>
  <v-menu :close-on-content-click="false" width="235">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon="mdi-wrench"/>
    </template>
    <v-list>
      <v-list-item>
        <v-btn @click="mainStore.fetchNames()" prepend-icon="mdi-account-group" text="Uuenda nimesid"/>
      </v-list-item>
      <v-list-item>
          <v-btn @click="mainStore.fetchDrinks()" prepend-icon="mdi-glass-cocktail" text="Uuenda jooke"/>
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
          placeholder="http://localhost:5000"
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
import { ref } from "vue";
import axios from "axios";
import {API_URL, setApiUrl, useMainStore} from "@/api/MainStore";
import {useToast} from "vue-toastification";

const mainStore = useMainStore();
const toast = useToast();
const editableApiUrl = ref(API_URL);
const isSyncing = ref(false);

function updateApiUrl() {
  if (editableApiUrl.value && editableApiUrl.value.trim() !== '') {
    setApiUrl(editableApiUrl.value.trim());
    mainStore.apiUrl = editableApiUrl.value.trim();
    toast.success("API URL uuendatud: " + editableApiUrl.value.trim());
  }
}

function resetApiUrl() {
  const defaultUrl = "http://localhost:5000";
  editableApiUrl.value = defaultUrl;
  setApiUrl(defaultUrl);
  mainStore.apiUrl = defaultUrl;
  toast.success("API URL taastatud vaikimisi väärtusele");
}

async function syncNow() {
  if (isSyncing.value) return;
  isSyncing.value = true;
  try {
    const response = await axios.post(API_URL + '/admin/sync');
    if (response && response.data && response.data.synced === true) {
      toast.success('Sünkroonimine õnnestus');
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
