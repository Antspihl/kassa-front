<template>
  <v-menu :close-on-content-click="false">
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
      <v-list-item>
        <v-list-item-title>
          Näidatud tellimuste arv:
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
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import {useMainStore} from "@/api/MainStore";
const mainStore = useMainStore();
</script>
