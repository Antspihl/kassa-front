<template>
  <v-container>
    <v-card>
      <v-card-title>Eelnevad tellimused</v-card-title>
      <v-list>
        <v-list-item
          v-for="(order, index) in mainStore.orders"
          :key="index"
          :value="order"
          rounded="shaped"
        >
          <v-list-item-action>
            <v-btn
              color="accent"
              @click="cancelOrder(order)"
              :loading="mainStore.loading.length > 0"
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
import {ref} from "vue";
import {Order} from "@/molecules/types";

const mainStore = useMainStore();

function cancelOrder(order: Order) {
  mainStore.cancelOrder(order);
}
</script>
