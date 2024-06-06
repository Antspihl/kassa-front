<template>
  <v-container>
    <v-card>
      <v-card-title>
        Eelnevad tellimused
        <v-btn
          icon="mdi-refresh"
          @click="fetchOrders()"
        />
        <v-btn
          icon="mdi-delete"
          @click="mainStore.orders = []"
        />
      </v-card-title>
      <v-list>
        <v-skeleton-loader
          v-if="loading"
          v-for="_ in mainStore.SHOWN_ORDERS_AMOUNT"
          type="list-item-avatar-two-line"
          />
        <v-list-item
          v-else
          v-for="(order, index) in mainStore.orders.slice(0, mainStore.SHOWN_ORDERS_AMOUNT)"
          :key="index"
          :value="order"
          rounded="shaped"
        >
          <v-list-item-action>
            <v-btn
              color="accent"
              @click="cancelOrder(order)"
              :loading="canceling"
              icon="mdi-close"
            />
            <EditDialog
              :order="order"
            />
            {{ order.name }}: {{ order.amount }}x {{ order.drink }}
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import {useMainStore} from "@/api/MainStore";
import EditDialog from "@/molecules/EditDialog.vue";
import {Order} from "@/molecules/types";
import {ref} from "vue";

const mainStore = useMainStore();
const loading = ref(false)
const canceling = ref(false)

function fetchOrders() {
  loading.value = true;
  mainStore.fetchOrders().then(() => {
    loading.value = false;
  });
}

function cancelOrder(order: Order) {
  canceling.value = true
  mainStore.addCancelOrderRequest(order)
  setTimeout(() => {
    canceling.value = false
  }, 1500)
}
</script>
