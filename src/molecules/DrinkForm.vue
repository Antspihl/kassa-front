<template>
  <v-container>
    <h4>Vali jook ja kogus</h4>
    <v-form class="mt-2">
      <v-autocomplete
        v-if="mainStore.names.length > 0"
        v-model="mainStore.currentOrder.name"
        :items="mainStore.names"
        label="Nimi"
        required
      ></v-autocomplete>
      <v-card v-else class="mb-4">
        <v-card-text>
          <h1>Laen nimesid...</h1>
        </v-card-text>
        <v-progress-linear :indeterminate="true" color="primary"></v-progress-linear>
      </v-card>
      <v-chip-group
        v-if="mainStore.drinks.length > 0"
        v-model="mainStore.currentOrder.drink"
        selected-class="text-deep-orange-darken-3"
        mandatory
      >
        <v-chip
          v-for="drink in mainStore.drinks"
          :key="drink"
          :value="drink"
          @click="mainStore.currentOrder.drink = drink"
          :class="{'v-chip--active': mainStore.currentOrder.drink === drink}"
        >
          {{ drink }}
        </v-chip>
      </v-chip-group>
      <v-card v-else class="mb-4">
        <v-card-text>
          <h1>Laen jooke...</h1>
        </v-card-text>
        <v-progress-linear :indeterminate="true" color="primary"></v-progress-linear>
      </v-card>
      <v-btn-group shaped color="info" class="d-flex mb-4">
        <v-btn @click="changeAmount(-5)">-5</v-btn>
        <v-btn @click="changeAmount(-1)">-1</v-btn>
        <v-btn :disabled=true>{{ mainStore.currentOrder.amount }}</v-btn>
        <v-btn @click="changeAmount(1)">+1</v-btn>
        <v-btn @click="changeAmount(5)">+5</v-btn>
      </v-btn-group>
      <v-btn
        color="success"
        class="mr-4"
        size="large"
        @click="addOrder"
        :loading="mainStore.loading.length > 0"
      >
        Lisa tellimus
      </v-btn>
      <v-btn
        color="info"
        class="mr-4"
        size="large"
        @click="clear"
      >
        Reset
      </v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import {useMainStore} from "@/api/MainStore";
import {Order} from "@/molecules/types";

const mainStore = useMainStore();

function changeAmount(amount: number) {
  if (mainStore.currentOrder.amount + amount < 1) {
    mainStore.currentOrder.amount = 1;
    return;
  }
  mainStore.currentOrder.amount += amount;
}

function clear() {
  mainStore.currentOrder.name = "";
  mainStore.currentOrder.amount = 1;
}

function addOrder() {
  let newOrder = {
    name: mainStore.currentOrder.name,
    drink: mainStore.currentOrder.drink,
    amount: mainStore.currentOrder.amount,
    id: null,
    isSent: false
  } as Order
  mainStore.addOrder(newOrder);
}
</script>
