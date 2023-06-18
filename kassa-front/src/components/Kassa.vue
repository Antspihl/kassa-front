<script setup>
import {reactive} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, numeric, minValue} from '@vuelidate/validators'

const Order = {
  name: "",
  drink: "",
  amount: null,
}

const state = reactive({
  ...Order,
})


const postUrl = "http://localhost:3000/orders"
let nameLoading = false
let drinkLoading = false
let names = [];
let drinks = [];

const rules = {
  name: {required},
  drink: {required},
  amount: {required, numeric, minValue: minValue(1)},
  names: {required},
  drinks: {required},
}

const v$ = useVuelidate(rules, state)

function loadNames() {
  nameLoading = true
  const namesFile = document.querySelector('input[type=file]').files[0]
  const namesReader = new FileReader()
  namesReader.readAsText(namesFile, "UTF-8")
  namesReader.onload = function (evt) {
    names = evt.target.result.split(",")
  }
  namesReader.onerror = function () {
    names = ["Vigane fail"]
  }
  nameLoading = false
}

function loadDrinks() {
  drinkLoading = true
  const drinksFile = document.querySelector('input[type=file]').files[0]
  const drinksReader = new FileReader()
  drinksReader.readAsText(drinksFile, "UTF-8")
  drinksReader.onload = function (evt) {
    drinks = evt.target.result.split(",")
  }
  drinksReader.onerror = function (evt) {
    drinks = ["Vigane fail"]
  }
  drinkLoading = false
}

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
        @click="v$.$validate"
      >
        Esita tellimus
      </v-btn>
      <v-btn @click="clear">
        Tühjenda
      </v-btn>
    </v-form>

    <v-file-input
      chips
      class="mt-8"
      accept=".txt"
      label="Lae nimede fail üles(.txt fail: nimi1,nimi2,nimi3)"
    ></v-file-input>
    <v-btn
      @click="loadNames"
      :loading="nameLoading"
    >Lae nimed sisse</v-btn>

    <v-file-input
      chips
      class="mt-8"
      accept=".txt"
      label="Lae jookide fail üles(.txt fail: jook1,jook2,jook3)"
    ></v-file-input>
    <v-btn
      @click="loadDrinks"
      :loading="drinkLoading"
    >Lae joogid sisse</v-btn>

  </v-col>
</template>

<style scoped>

</style>
