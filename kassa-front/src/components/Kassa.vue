<script setup>
import {onMounted, reactive, ref} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, numeric, minValue} from '@vuelidate/validators'
import axios from "axios";
import {useToast} from "vue-toastification";

const Order = {
  name: "",
  drink: "",
  amount: 1,
}

const previousOrders = ref([])

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

const showSuccessToast = (text) => {
  toast.success(text, {
    position: "bottom-right",
    timeout: 3000,
    closeOnClick: false,
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

const showErrorToast = (text) => {
  toast.error(text, {
    position: "bottom-right",
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
  isSubmitting.value = false
}

const cancelOrder = (name, drink, amount) => {
  isSubmitting.value = true
  console.log("Canceling order", name, " ", drink, " ", amount)
  const orderData = {
    customer_name: name,
    drink_name: drink,
    quantity: -amount,
  };

  //Remove order from previous orders
  previousOrders.value = previousOrders.value.filter(order => order.name !== name || order.drink !== drink || order.amount !== amount)

  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.post(postUrl, orderData)
    .then(() => {
      console.log(orderData, ' canceled successfully');
      showSuccessToast("Tellimus tühistatud")
    })
    .catch((error) => {
      console.error('Error canceling order:', error);
      showErrorToast("Tellimuse tühistamine ebaõnnestus")
    });
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

  rememberOrder(state.name, state.drink, state.amount)

  axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  axios.post(postUrl, orderData)
    .then(() => {
      console.log(orderData, ' placed successfully');
      showSuccessToast("Tellimus esitatud")
    })
    .catch((error) => {
      console.error('Error placing order:', error);
      showErrorToast("Tellimuse esitamine ebaõnnestus")
    });
  clear()
};

function clear() {
  v$.value.$reset()

  for (const [key, value] of Object.entries(Order)) {
    state[key] = value
  }
}

function rememberOrder(name, drink, amount) {
  previousOrders.value.unshift({name: name, drink: drink, amount: amount})
  if (previousOrders.value.length > 4) {
    previousOrders.value.pop()
  }
}

const getNames = async () => {
  try {
    console.log("Fetching names");
    const response = await axios.get(namesUrl);
    showSuccessToast("Nimed laetud");
    console.log(response.data);
    names.value = response.data;
    isFetchingNames.value = false;
  } catch (error) {
    console.error('Error receiving names:', error);
    showErrorToast("Nimede laadimine ebaõnnestus");
    getNames();
  }
};

const getDrinks = async () => {
  try {
    console.log("Fetching drinks");
    const response = await axios.get(drinksUrl);
    showSuccessToast("Joogid laetud");
    console.log(response.data);
    drinks.value = response.data;
    isFetchingDrinks.value = false;
  } catch (error) {
    console.error('Error receiving drinks:', error);
    showErrorToast("Jookide laadimine ebaõnnestus");
    getDrinks();
  }
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
        <v-btn :disabled=true @change="v$.amount.$touch">{{ state.amount }}</v-btn>
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

  <v-col>
    <v-table>
      <thead>
      <tr>
        <th class="text-left">
          Nimi
        </th>
        <th class="text-left">
          Jook
        </th>
        <th class="text-left">
          Kogus
        </th>
        <th class="text-left">
          Kas tühistada?
        </th>
      </tr>
      </thead>
      <tbody>
      <tr
        v-for="item in previousOrders.values()"
      >
        <td>{{ item.name }}</td>
        <td>{{ item.drink }}</td>
        <td>{{ item.amount }}</td>
        <v-btn
          @click="cancelOrder(item.name, item.drink, item.amount)"
          color="deep-orange-darken-4"
          class="mt-2"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          Tühista tellimus
        </v-btn>
      </tr>
      </tbody>
    </v-table>
  </v-col>
</template>

<style scoped>

</style>
