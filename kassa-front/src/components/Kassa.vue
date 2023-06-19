<script setup>
import {reactive, ref} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, numeric, minValue} from '@vuelidate/validators'
import axios from "axios";

const Order = {
  name: "",
  drink: "",
  amount: 1,
}

const state = reactive({
  ...Order,
})

const postUrl = "{{http://localhost:3000/orders}}"
const timeout = 1000

const isSubmitting = ref(false)
const isNameLoading = ref(false)
const isDrinkLoading = ref(false)
const file = ref(null)
const names = ref([])
const drinks = ref([])

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
  console.log(file)

  if (file.value === null) {
    console.log("namesFile is null")
  } else {
    const namesFile = document.querySelector('input[type=file]').files[0]
    const namesReader = new FileReader()
    try {
      namesReader.readAsText(namesFile, "UTF-8")
    } catch (e) {
      console.log(e)
    }
    namesReader.onload = function (evt) {
      names.value = evt.target.result.split(",")
      console.log("Names loaded")
    }
    namesReader.onerror = function () {
      names.value = ["Vigane fail"]
    }
  }
  setTimeout(() => (isNameLoading.value = false), timeout)
}

function loadDrinks() {
  isDrinkLoading.value = true
  console.log("Loading drinks")
  console.log(file)

  if (file.value === null) {
    console.log("drinksFile is null")
  } else {
    const drinksFile = document.querySelector('input[type=file]').files[0]
    const drinksReader = new FileReader()
    try {
      drinksReader.readAsText(drinksFile, "UTF-8")
    } catch (e) {
      console.log(e)
    }
    drinksReader.onload = function (evt) {
      drinks.value = evt.target.result.split(",")
      console.log("Drinks loaded")
    }
    drinksReader.onerror = function () {
      drinks.value = ["Vigane fail"]
    }
  }
  setTimeout(() => (isDrinkLoading.value = false), timeout)

}

function emptyNames() {
  isNameLoading.value = true
  names.value = []
  setTimeout(() => (isNameLoading.value = false), timeout)
  console.log("Emptying names")
}

function emptyDrinks() {
  isDrinkLoading.value = true
  drinks.value = []
  setTimeout(() => (isDrinkLoading.value = false), timeout)
  console.log("Emptying drinks")
}

const submitOrder = () => {
  isSubmitting.value = true
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
  setTimeout(() => (isSubmitting.value = false), timeout)
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

      <v-btn-group shaped color="indigo-darken-4" class="d-flex mb-4">
        <v-btn @click="state.amount--;" :disabled="state.amount === 1">-</v-btn>
        <v-btn disabled @change="v$.amount.$touch">{{ state.amount }}</v-btn>
        <v-btn @click="state.amount++">+</v-btn>
      </v-btn-group>

        <v-btn
        class="me-4"
        color="indigo-darken-4"
        @click="submitOrder"
      >
        Esita tellimus
      </v-btn>
      <v-btn
        color="deep-orange-darken-4"
        @click="clear"
      >
        Tühjenda
      </v-btn>
    </v-form>

    <v-expansion-panels class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title>Lae info üles</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-file-input
            class="mt-8"
            ref="file"
            accept=".txt"
            label="Lae nimede fail üles(.txt fail: asi1,asi2,asi3)"
          ></v-file-input>

          <v-btn
            v-if="names.length === 0"
            class="me-4 ml-10"
            @click="loadNames"
            color="indigo-darken-4"
            :loading="isNameLoading"
            :disabled="isNameLoading"
          >Lae nimed sisse
            <template v-slot:loader>
              <v-progress-linear
                indeterminate
                color="deep-orange-darken-4"
              ></v-progress-linear>
            </template>
          </v-btn>
          <v-btn
            v-if="names.length !== 0"
            class="me-4 ml-10"
            @click="emptyNames"
            color="deep-orange-darken-4"
            :loading="isNameLoading"
            :disabled="isNameLoading"
          >Tühjenda nimed
            <template v-slot:loader>
              <v-progress-linear
                indeterminate
                color="indigo-darken-4"
              ></v-progress-linear>
            </template>
          </v-btn>

          <v-btn
            v-if="drinks.length === 0"
            @click="loadDrinks"
            color="indigo-darken-4"
            :loading="isDrinkLoading"
            :disabled="isDrinkLoading"
          >Lae joogid sisse
            <v-progress-linear
              indeterminate
              color="deep-orange-darken-4"
            ></v-progress-linear>
          </v-btn>
          <v-btn
            v-if="drinks.length !== 0"
            @click="emptyDrinks"
            color="deep-orange-darken-4"
            :loading="isDrinkLoading"
            :disabled="isDrinkLoading"
          >Tühjenda joogid
            <v-progress-linear
              indeterminate
              color="indigo-darken-4"
            ></v-progress-linear>
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-col>
</template>

<style scoped>

</style>
