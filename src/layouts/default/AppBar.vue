<template>
  <v-toolbar color="primary" :flat="true">
    <v-img class="mr-4 ml-4 pa-2" :max-height="64" :max-width="120" src="@/assets/sov_logo.png"/>
    <v-btn size="x-large" :active="false" variant="text" height="64" to="/" text="Avaleht"/>
    <v-btn size="x-large" :active="false" variant="text" height="64" to="/arved" text="Arved"/>
    <v-spacer></v-spacer>
    <v-tooltip text="Päri uuesti nimed ja joogid">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" @click="refreshNamesAndDrinks" icon="mdi-refresh"/>
      </template>
    </v-tooltip>
  </v-toolbar>
</template>

<script setup>
import {useMainStore} from "@/api/MainStore";

const mainStore = useMainStore();

function refreshNamesAndDrinks() {
  mainStore.drinks = [];
  mainStore.names = [];
  mainStore.fetchNames();
  mainStore.fetchDrinks();
}
</script>
