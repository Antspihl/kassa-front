<script setup>
import {reactive} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, alpha, numeric, minValue} from '@vuelidate/validators'

const initialState = {
  name: "",
  drink: "",
  amount: null,
}

const state = reactive({
  ...initialState,
})

const postUrl = "http://localhost:3000/orders"
const names = []
const drinks = []

const rules = {
  name: {required, alpha},
  drink: {required, alpha},
  amount: {required, numeric, minValue: minValue(1)},
  names: {required},
  drinks: {required},
}

const v$ = useVuelidate(rules, state)

function clear() {
  v$.value.$reset()

  for (const [key, value] of Object.entries(initialState)) {
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
        :counter="10"
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
      label="Lae nimede fail üles(.txt fail: nimi1, nimi2, nimi3)"
    ></v-file-input>
    <v-btn>Lae nimed sisse</v-btn>

    <v-file-input
      chips
      class="mt-8"
      accept=".txt"
      label="Lae jookide fail üles(.txt fail: jook1, jook2, jook3)"
    ></v-file-input>
    <v-btn>Lae joogid sisse</v-btn>

  </v-col>
</template>

<style scoped>

</style>
