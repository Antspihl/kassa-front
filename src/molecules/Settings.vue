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
        {{ API_URL }}
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import {API_URL, useMainStore} from "@/api/MainStore";
const mainStore = useMainStore();

async function updateDrinks() {
  await mainStore.fetchDrinks();
  await mainStore.fetchDrinks2();
}
</script>
