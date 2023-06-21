<script setup>
import {onMounted, reactive, ref} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, numeric, minValue} from '@vuelidate/validators'
import axios from "axios";
import {useToast} from "vue-toastification";
import CancelOrder from "./CancelOrder.vue";

const Order = {
  name: "",
  drink: "",
  amount: 1,
}

const previousOrder = ref({
  name: "",
  drink: "",
  amount: 0,
})

const state = reactive({...Order})

const postUrl = "http://localhost:5000/order"
const namesUrl = "http://localhost:5000/names"
const drinksUrl = "http://localhost:5000/drinks"

const isSubmitting = ref(false)
const names = ref([])
const drinks = ref([])
const isFetchingNames = ref(true)
const isFetchingDrinks = ref(true)
const toast = useToast()

const rules = {
  name: {required},
  drink: {required},
  amount: {required, numeric, minValue: minValue(1)},
  names: {required},
  drinks: {required},
}

const v$ = useVuelidate(rules, state)

const showCancelingToast = () => {
  toast.error({
    component: CancelOrder,
    listeners: {
      myClick: () => {
        cancelLastOrder(previousOrder.value.name, previousOrder.value.drink, previousOrder.value.amount)
      }
    }
  }, {
    position: "bottom-left",
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: false,
    draggablePercent: 0.6,
    showCloseButtonOnHover: true,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false
  });
  isSubmitting.value = false
}

const showSuccessToast = () => {
  toast.success("Viimane tellimus tühistatud", {
    position: "bottom-left",
    timeout: 3000,
    closeOnClick: false,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: false,
    draggablePercent: 0.6,
    showCloseButtonOnHover: true,
    hideProgressBar: true,
    closeButton: "button",
    icon: true,
    rtl: false
  });
}

const cancelLastOrder = (name, drink, amount) => {
  if (previousOrder.value.name === "") {
    return
  }
  console.log("Canceling order", name, " ", drink, " ", amount)
  const orderData = {
    customer_name: name,
    drink_name: drink,
    quantity: -amount,
  };

  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.post(postUrl, orderData)
    .then(() => {
      console.log(orderData, ' canceled successfully');
      showSuccessToast()
    })
    .catch((error) => {
      console.error('Error canceling order:', error);
    });

  previousOrder.value.name = ""
}

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
  // Remember previous order
  previousOrder.value.name = state.name
  previousOrder.value.drink = state.drink
  previousOrder.value.amount = state.amount

  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.post(postUrl, orderData)
    .then(() => {
      console.log(orderData, ' placed successfully');
      showCancelingToast()
    })
    .catch((error) => {
      console.error('Error placing order:', error);
    });
  clear()
};

function clear() {
  v$.value.$reset()

  for (const [key, value] of Object.entries(Order)) {
    state[key] = value
  }
}

const getNames = () => {
  console.log("Fetching names")
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
  console.log("Fetching drinks")
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
        :disabled="isFetchingNames"
        v-model="state.name"
        :items="names"
        :error-messages="v$.name.$errors.map(e => e.$message)"
        label="Nimi"
        required
        @input="v$.name.$touch"
        @blur="v$.name.$touch"
      ></v-autocomplete>

      <v-autocomplete
        :disabled="isFetchingDrinks"
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
        :disabled="isSubmitting"
        :loading="isSubmitting"
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
  </v-col>
</template>

<style scoped>

</style>
