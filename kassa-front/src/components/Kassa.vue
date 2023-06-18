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

const items = [
  'Item 1',
  'Item 2',
  'Item 3',
  'Item 4',
]

const rules = {
  name: {required, alpha},
  drink: {required, alpha},
  amount: {required, numeric, minValue: minValue(1)},
  items: {required},
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
  <v-theme-provider theme="sov" with-background="true">
    <v-form>
      <v-autocomplete
        v-model="state.name"
        :error-messages="v$.name.$errors.map(e => e.$message)"
        :counter="10"
        label="Nimi"
        required
        @input="v$.name.$touch"
        @blur="v$.name.$touch"
      ></v-autocomplete>

      <v-autocomplete
        v-model="state.drink"
        :error-messages="v$.drink.$errors.map(e => e.$message)"
        label="Jook"
        required
        @input="v$.drink.$touch"
        @blur="v$.drink.$touch"
      ></v-autocomplete>

      <v-select
        v-model="state.amount"
        :items="items"
        :error-messages="v$.amount.$errors.map(e => e.$message)"
        label="Item"
        required
        @change="v$.amount.$touch"
        @blur="v$.amount.$touch"
      ></v-select>

      <v-btn
        class="me-4"
        @click="v$.$validate"
      >
        submit
      </v-btn>
      <v-btn @click="clear">
        clear
      </v-btn>
    </v-form>
  </v-theme-provider>
</template>


<style scoped>

</style>
