<template>
  <v-row class="pt-4">
    <v-col cols="6">
      <DrinkForm v-if="!mainStore.sohvik"/>
      <DrinkForm2 v-else/>
      <v-divider v-if="!mainStore.sohvik"/>
      <RequestList v-if="!mainStore.sohvik"/>
    </v-col>
    <v-divider vertical></v-divider>
    <v-col cols="6">
      <OrderList/>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import {onMounted} from "vue";
import {useMainStore} from "@/api/MainStore";
import DrinkForm from "@/molecules/DrinkForm.vue";
import OrderList from "@/molecules/OrderList.vue";
import RequestList from "@/molecules/RequestList.vue";
import DrinkForm2 from "@/molecules/DrinkForm2.vue";

const mainStore = useMainStore();


onMounted(async () => {
  const items = ["orders", "names", "drinks", "drinks2", "requestList"];
  for (const item of items) {
    const itemString = localStorage.getItem(item);
    if (itemString) {
      if (item === "orders") {
        mainStore.orders = JSON.parse(itemString);
      }
      if (item === "names") {
        mainStore.names = JSON.parse(itemString);
      } else if (item === "drinks") {
        mainStore.drinks = JSON.parse(itemString);
      } else if (item === "drinks2") {
        mainStore.drinks2 = JSON.parse(itemString);
      } else if (item === "requestList") {
        mainStore.requestList = JSON.parse(itemString);
      }
    } else if (item === "names") {
      await mainStore.fetchNames();
    } else if (item === "drinks") {
      await mainStore.fetchDrinks();
    } else if (item === "drinks2") {
      await mainStore.fetchDrinks2();
    }
  }

  mainStore.currentOrder = {
    name: "",
    drink: mainStore.drinks[0],
    amount: 1,
    id: "",
    isSent: false
  }

  // Restart sending requests if there are any pending
  if (mainStore.requestList.length > 0) {
    mainStore.startSendingRequests();
  }
});
</script>

