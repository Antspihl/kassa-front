<template>
  <v-container>
    <h4>Vali jook ja kogus</h4>
    <v-form class="mt-2">
      <v-autocomplete
        v-if="mainStore.names.length > 0"
        v-model="mainStore.currentOrder.name"
        :items="mainStore.names"
        label="Nimi"
        clearable
        required
        ref="autocompleteRef"
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
          :loading="adding"
          text="Lisa"
        />
        <v-btn
          color="info"
          class="mr-4"
          size="large"
          @click="clear"
          text="Reset"
        />
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import {useMainStore} from "@/api/MainStore";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";

const mainStore = useMainStore();
const adding = ref(false)

const autocompleteRef = ref<HTMLElement | null>(null);
const filteredItems = computed(() => {
  if (!mainStore.currentOrder.name) {
    return [];
  }
  return mainStore.names.filter((name) =>
    name.toLowerCase().includes(mainStore.currentOrder.name.toLowerCase())
  );
});

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
    id: 0,
    isSent: false
  }
  mainStore.addOrderRequest(newOrder);
  setTimeout(() => {
    adding.value = false;
  }, 300);
}

function handleKeydown(event: KeyboardEvent) {
  const autocompleteElement = autocompleteRef.value?.$el.querySelector('input');
  if (!autocompleteElement) return;

  switch (event.key) {
    case 'Shift':
      event.preventDefault();
      autocompleteElement.focus();
      break;
    case '1':
      event.preventDefault();
      triggerArrowKey('ArrowUp');
      break;
    case '2':
      event.preventDefault();
      triggerArrowKey('ArrowDown');
      break;
    case 'Tab':
      event.preventDefault();
      if (filteredItems.value.length > 0) {
        selectFirstItem();
      }
      break;
  }
}

function triggerArrowKey(key: 'ArrowUp' | 'ArrowDown') {
  const inputElement = autocompleteRef.value?.$el.querySelector('input');
  if (!inputElement) return;

  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    code: key,
  });
  inputElement.dispatchEvent(event);
}

function selectFirstItem() {
  if (filteredItems.value.length > 0) {
    mainStore.currentOrder.name = filteredItems.value[0];
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
