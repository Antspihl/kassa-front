<script setup>
import {reactive, ref} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, numeric, minValue} from '@vuelidate/validators'
import axios from "axios";

const Order = {
  name: "",
  drink: "",
  amount: null,
}

const state = reactive({
  ...Order,
})

const postUrl = "{{http://localhost:3000/orders}}"
const timeout = 1000

let isNameLoading = ref(false)
let isDrinkLoading = ref(false)
let namesFile = ref(null)
let drinksFile = ref(null)
let names = ref([])
let drinks = ref([])

const rules = {
  name: {required},
  drink: {required},
  amount: {required, numeric, minValue: minValue(1)},
  names: {required},
  drinks: {required},
}

const v$ = useVuelidate(rules, state)

function loadNames() {
  isNameLoading.value = true
  console.log("Loading names")
  console.log(namesFile)

  if (namesFile === null) {
    console.log("namesFile is null")
  } else {
    const namesFile = document.querySelector('input[type=file]').files[0]
    const namesReader = new FileReader()
    namesReader.readAsText(namesFile, "UTF-8")
    namesReader.onload = function (evt) {
      names = evt.target.result.split(",")
      console.log("Names loaded")
    }
    namesReader.onerror = function () {
      names = ["Vigane fail"]
    }
  }
  setTimeout(() => (isNameLoading.value = false), timeout)
}

function loadDrinks() {
  isDrinkLoading.value = true
  console.log("Loading drinks")
  console.log(drinksFile)

  if (drinksFile === null) {
    console.log("drinksFile is null")
  } else {
    const drinksFile = document.querySelector('input[type=file]').files[0]
    const drinksReader = new FileReader()
    drinksReader.readAsText(drinksFile, "UTF-8")
    drinksReader.onload = function (evt) {
      drinks = evt.target.result.split(",")
      console.log("Drinks loaded")
    }
    drinksReader.onerror = function () {
      drinks = ["Vigane fail"]
    }
  }
  setTimeout(() => (isDrinkLoading.value = false), timeout)

}

function emptyNames() {
  isNameLoading.value = true
  names.valueOf().splice(0)
  setTimeout(() => (isNameLoading.value = false), timeout)
}

function emptyDrinks() {
  isDrinkLoading.value = true
  drinks.valueOf().splice(0)
  setTimeout(() => (isDrinkLoading.value = false), timeout)
}

const submitOrder = () => {
  clear()
  const orderData = {
    customer_name: Order.name,
    drink_name: Order.drink,
    quantity: Order.amount,
  };

  axios.post(postUrl, orderData)
    .then(() => {
      console.log('Order placed successfully');
    })
    .catch((error) => {
      console.error('Error placing order:', error);
    });
};

function clear() {
  v$.value.$reset()

  for (const [key, value] of Object.entries(Order)) {
    state[key] = value
  }
}
</script>

<template>
  <v-col>
    <v-form class="mt-2">
      <v-autocomplete
        v-model="state.name"
        :items="names"
        :error-messages="v$.name.$errors.map(e => e.$message)"
        label="Nimi"
        required
        @input="v$.name.$touch"
        @blur="v$.name.$touch"
      ></v-autocomplete>

      <v-autocomplete
        v-model="state.drink"
        :items="drinks"
        :error-messages="v$.drink.$errors.map(e => e.$message)"
        label="Jook"
        required
        @input="v$.drink.$touch"
        @blur="v$.drink.$touch"
      ></v-autocomplete>

      <v-text-field
        v-model="state.amount"
        :error-messages="v$.amount.$errors.map(e => e.$message)"
        label="Kogus"
        required
        @change="v$.amount.$touch"
        @blur="v$.amount.$touch"
      ></v-text-field>

      <v-btn
        class="me-4"
        @click="submitOrder"
      >
        Esita tellimus
      </v-btn>
      <v-btn @click="clear">
        Tühjenda
      </v-btn>
    </v-form>

    <v-file-input
      class="mt-8"
      name="namesInput"
      ref="namesFile"
      accept=".txt"
      label="Lae nimede fail üles(.txt fail: asi1,asi2,asi3)"
    ></v-file-input>

    <v-btn
      v-if="names.length === 0"
      class="me-4"
      @click="loadNames"
      :loading="isNameLoading"
      :disabled="isNameLoading"
    >Lae nimed sisse
      <template v-slot:loader>
        <v-progress-linear indeterminate color="cyan"></v-progress-linear>
      </template>
    </v-btn>
    <v-btn
      v-if="names.length !== 0"
      class="me-4"
      @click="emptyNames"
      color="error"
      :loading="isNameLoading"
      :disabled="isNameLoading"
    >Tühjenda nimed
    </v-btn>

    <v-btn
      v-if="drinks.length === 0"
      @click="loadDrinks"
      :loading="isDrinkLoading"
      :disabled="isDrinkLoading"
    >Lae joogid sisse
    </v-btn>
    <v-btn
      v-if="drinks.length !== 0"
      @click="emptyDrinks"
      :loading="isDrinkLoading"
      :disabled="isDrinkLoading"
    >Tühjenda joogid
    </v-btn>
  </v-col>
</template>

<style scoped>

</style>
