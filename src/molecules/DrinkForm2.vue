<template>
  <v-container>
    <h4>Vali kook ja kogus</h4>
    <v-form class="mt-2">
      <v-chip-group
        v-if="mainStore.drinks2.length > 0"
        v-model="mainStore.currentOrder.drink"
        selected-class="text-deep-orange-darken-3"
        mandatory
        column
      >
        <v-chip
          v-for="drink in mainStore.drinks2"
          :key="drink.name"
          :value="drink.name"
          @click="mainStore.currentOrder.amount = 1"
          :class="{'v-chip--active': mainStore.currentOrder.drink === drink.name}"
        >
          {{ drink.name }}
        </v-chip>
      </v-chip-group>
      <v-chip-group
        v-else
        column
      >
        <v-chip
          v-for="index in 20"
          :key="index"
        >
          <v-progress-circular
            indeterminate
            color="info"
            size="21"
          />
        </v-chip>
      </v-chip-group>
      <v-row class="pt-5 pl-4">
        <v-btn-group shaped color="info" class="d-flex mb-4">
          <v-btn @click="changeAmount(-5)">-5</v-btn>
          <v-btn @click="changeAmount(-1)">-1</v-btn>
          <v-btn :disabled=true>{{ mainStore.currentOrder.amount }}</v-btn>
          <v-btn @click="changeAmount(1)">+1</v-btn>
          <v-btn @click="changeAmount(5)">+5</v-btn>
        </v-btn-group>
        <v-btn
          color="success"
          class="mx-4"
          size="large"
          @click="addOrder"
          text="Lisa"
        />
        <v-btn
          color="info"
          class="mr-4"
          size="large"
          @click="() => { if (orders.length > 0) showDialog = true }"
          text="Maksa"
        />
        <v-dialog max-width="500" v-model="showDialog">
          <v-card title="Maksa:">
            <v-card-text>
              <v-list dense>
                <v-list-item v-for="(order, index) in orders" :key="index">
                  <v-row align="center">
                    <v-col cols="6">
                      <v-list-item-title class="text-left font-weight-medium">{{ order.drink }}</v-list-item-title>
                    </v-col>
                    <v-col cols="6">
                      <v-list-item-subtitle class="text-right text--secondary">{{ order.amount }} × {{ (order.price) }}€
                        => {{ order.amount * order.price }}€
                      </v-list-item-subtitle>
                    </v-col>
                  </v-row>
                </v-list-item>
              </v-list>

              <v-divider class="my-2"/>

              <v-row align="center">
                <v-col cols="6" class="text-left font-weight-medium">Summa</v-col>
                <v-col cols="6" class="text-right font-weight-medium">
                  {{ orders.reduce((acc, order) => acc + (order.amount * order.price), 0) }}€
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text="Tühista"
                color="error"
                @click="showDialog=false"
              ></v-btn>
              <v-btn
                text="Makstud"
                color="success"
                @click="sendOrder(orders)"
                :loading="sending"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>

      <v-card class="mt-5">
        <v-card-title>
          Hetke tellimuse summa => {{ orders.reduce((acc, order) => acc + (order.amount * order.price), 0) }}€
        </v-card-title>
        <v-list>
          <v-list-item
            v-for="(order, index) in orders"
            :key="index"
            :value="order"
            rounded="shaped"
          >
            <v-list-item-action>
              <v-btn
                class="mr-2"
                color="accent"
                size="small"
                @click="removeOrder(order)"
                icon="mdi-close"
              />
              {{ order.drink }}: {{ order.amount }}x {{ order.price }}€ => {{ order.amount * order.price }}€
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import {useMainStore} from "@/api/MainStore";
import {ref} from "vue";
import {tempOrder} from "@/molecules/types";

const mainStore = useMainStore();

const showDialog = ref(false)
const sending = ref(false)

const orders = ref<tempOrder[]>([]);

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

async function addOrder() {
  const drinkObj = mainStore.drinks2.find(d => d.name === mainStore.currentOrder.drink);
  const order: tempOrder = {
    drink: mainStore.currentOrder.drink,
    amount: mainStore.currentOrder.amount,
    price: drinkObj?.price ?? 0
  }
  orders.value.push(order);
  mainStore.currentOrder.amount = 1;
}

function removeOrder(order: tempOrder) {
  const index = orders.value.indexOf(order);
  if (index > -1) {
    orders.value.splice(index, 1);
  }
}

async function sendOrder(orders1: tempOrder[]) {
  if (orders1.length == 0) return;
  sending.value = true;
  try {
    await mainStore.sendTempOrders(orders1);
    orders.value = [];
    showDialog.value = false;
  } finally {
    sending.value = false;
  }
}

</script>
