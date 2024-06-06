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
      <v-skeleton-loader
        v-else
        type="text"
        width="100%"
        height="50px"/>
      <v-chip-group
        v-if="mainStore.drinks.length > 0"
        v-model="mainStore.currentOrder.drink"
        selected-class="text-deep-orange-darken-3"
        mandatory
        column
      >
        <v-chip
          v-for="drink in mainStore.drinks"
          :key="drink"
          :value="drink"
          @click="mainStore.currentOrder.amount = 1"
          :class="{'v-chip--active': mainStore.currentOrder.drink === drink}"
        >
          {{ drink }}
        </v-chip>
      </v-chip-group>
      <v-chip-group
        v-else
        column
      >
        <v-chip
          v-for="_ in 20"
        >
          <v-progress-circular
            indeterminate
            color="info"
            size="21"
          />
        </v-chip>
      </v-chip-group>
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
        :loading="adding"
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
import {ref} from "vue";

const mainStore = useMainStore();
const adding = ref(false)

function changeAmount(amount: number) {
  if (mainStore.currentOrder.amount === 1 && amount === 5) {
    mainStore.currentOrder.amount = 5;
    return;
  }
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
  adding.value = true;
  let newOrder = {
    name: mainStore.currentOrder.name,
    drink: mainStore.currentOrder.drink,
    amount: mainStore.currentOrder.amount,
    id: null,
    isSent: false
  }
  mainStore.addOrderRequest(newOrder);
  setTimeout(() => {
    adding.value = false;
  }, 1000);
}
</script>
