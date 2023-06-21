<script setup>
import {onMounted, reactive, ref} from 'vue'
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

const postUrl = "http://localhost:5000/order"
const namesUrl = "http://localhost:5000/names"
const drinksUrl = "http://localhost:5000/drinks"
const timeout = 1000

const isSubmitting = ref(false)
const names = ref([])
const drinks = ref([])
const isFetchingNames = ref(true)
const isFetchingDrinks = ref(true)

const rules = {
  name: {required},
  drink: {required},
  amount: {required, numeric, minValue: minValue(1)},
  names: {required},
  drinks: {required},
}

const v$ = useVuelidate(rules, state)

const submitOrder = () => {
  if (isFetchingNames.value || isFetchingDrinks.value || state.name === "" || state.drink === "") {
    return
  }
  isSubmitting.value = true
  const orderData = {
    customer_name: state.name,
    drink_name: state.drink,
    quantity: state.amount,
  };

  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.post(postUrl, orderData)
    .then(() => {
      console.log(orderData, ' placed successfully');
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

const getNames = () => {
  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.get(namesUrl)
    .then((response) => {
      console.log('Names received successfully');
      console.log(response.data)
      names.value = response.data;
      isFetchingNames.value = false;
    })
    .catch((error) => {
      console.error('Error receiving names:', error);
    });
};

const getDrinks = () => {
  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.get(drinksUrl)
    .then((response) => {
      console.log('Drinks received successfully');
      console.log(response.data)
      drinks.value = response.data;
      isFetchingDrinks.value = false;
    })
    .catch((error) => {
      console.error('Error receiving drinks:', error);
    });
};

onMounted(() => {
  getNames();
  getDrinks();
});
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

      <v-btn
      @click="console.log(Order)"
      >
        Test
      </v-btn>
    </v-form>
  </v-col>
</template>

<style scoped>

</style>
