<template>
  <v-col>
    <LockDialog v-model="lockDialog" @unlocked="onUnlocked"/>

    <div v-if="unlocked">
      <v-tabs v-model="activeTab" grow>
        <v-tab value="logs">Logid</v-tab>
        <v-tab value="users">Kasutajad</v-tab>
        <v-tab value="drinks">Joogid</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="mt-4">
        <v-window-item value="logs">
          <LogsTab/>
        </v-window-item>
        <v-window-item value="users">
          <UsersTab/>
        </v-window-item>
        <v-window-item value="drinks">
          <DrinksTab/>
        </v-window-item>
      </v-window>
    </div>
  </v-col>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useMainStore} from '@/api/MainStore';
import LogsTab from '@/components/admin/LogsTab.vue';
import UsersTab from '@/components/admin/UsersTab.vue';
import DrinksTab from '@/components/admin/DrinksTab.vue';
import LockDialog from '@/components/admin/LockDialog.vue';

const store = useMainStore();

const lockDialog = ref(true);

const activeTab = ref('logs');

const unlocked = computed(() => !lockDialog.value);

async function onUnlocked() {
  try {
    await Promise.all([
      store.getLogs(),
      store.fetchAdminUsers(),
      store.fetchAdminDrinks(),
    ]);
  } catch (e) {
    console.error(e);
  }
}

</script>

<style scoped>
</style>
