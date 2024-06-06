<template>
  <v-btn
    color="info"
    class="mx-4"
    @click="openEditDialog"
    icon="mdi-pencil"
    :loading="editing"
  ></v-btn>
  <v-dialog v-model="showDialog" max-width="500px">
    <v-card>
      <v-card-title>Muuda, mis tahad</v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="editedOrder.name"
          :items="mainStore.names"
          label="Nimi"
          required
        ></v-autocomplete>

        <v-chip-group
          v-if="mainStore.drinks.length > 0"
          v-model="editedOrder.drink"
          selected-class="text-deep-orange-darken-3"
          mandatory
          column
        >
          <v-chip
            v-for="drink in mainStore.drinks"
            :key="drink"
            :value="drink"
            @click="editedOrder.drink = drink"
            :class="{'v-chip--active': mainStore.currentOrder.drink === drink}"
          >
            {{ drink }}
          </v-chip>
        </v-chip-group>

        <v-btn-group shaped color="info" class="d-flex mb-4">
          <v-btn @click="changeAmount(-5)">-5</v-btn>
          <v-btn @click="changeAmount(-1)">-1</v-btn>
          <v-btn disabled>{{ editedOrder.amount }}</v-btn>
          <v-btn @click="changeAmount(1)">+1</v-btn>
          <v-btn @click="changeAmount(5)">+5</v-btn>
        </v-btn-group>
      </v-card-text>
      <v-card-actions>
        <v-btn
          class="ml-4"
          color="deep-orange-darken-4"
          @click="closeDialog"
          text="Välju"
        />
        <v-btn
          color="green-darken-1"
          @click="closeDialogAndSaveChanges"
          text="Salvesta muudatused"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {useMainStore} from "@/api/MainStore";
import {Order} from "@/molecules/types";
import {ref} from "vue";

const mainStore = useMainStore();
const showDialog = ref(false);
const editing = ref(false)
const editedOrder = ref({} as Order)
const oldOrder = ref({} as Order)

function changeAmount(amount: number) {
  if (editedOrder.value.amount + amount <= 1) editedOrder.value.amount = 1
  else editedOrder.value.amount += amount;
}

function openEditDialog() {
  showDialog.value = true;
  editedOrder.value = {...props.order}
  oldOrder.value = {...props.order}
}

function closeDialog() {
  showDialog.value = false;
}

function closeDialogAndSaveChanges() {
  editing.value = true
  closeDialog()
  mainStore.addChangeOrderRequest(oldOrder.value, editedOrder.value)
  setTimeout(() => {
    editing.value = false
  }, 1000)
}

const props = defineProps<{
  order: Order
}>()
</script>
