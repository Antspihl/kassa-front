<template>
  <v-row class="pt-4">
    <v-col cols="6">
      <DrinkForm/>
      <v-divider/>
      <RequestList/>
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

const mainStore = useMainStore();


onMounted(async () => {
  const items = ["orders", "names", "drinks", "requestList"];
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
      } else if (item === "requestList") {
        mainStore.requestList = JSON.parse(itemString);
      }
    } else if (item === "names") {
      await mainStore.fetchNames();
    } else if (item === "drinks") {
      await mainStore.fetchDrinks();
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

