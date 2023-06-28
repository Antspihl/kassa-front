<script setup>
import {onMounted, reactive, ref} from 'vue'
import {useVuelidate} from '@vuelidate/core'
import {required, numeric, minValue} from '@vuelidate/validators'
import axios from "axios";
import {useToast} from "vue-toastification";
import {forEach} from "core-js/stable/dom-collections";

const Order = {
  name: "",
  drink: "",
  amount: 1,
}

const previousOrders = ref([])
const currentOrders = ref([])

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
}

const dialogOpen = ref(false);

const openDialog = () => {
  dialogOpen.value = true;
};

const closeDialog = () => {
  dialogOpen.value = false;
};

const saveOrder = () => {
  v$.value.$touch()
  dialogOpen.value = false;
  currentOrders.value.push({name: state.name, drink: state.drink, amount: state.amount})
};

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
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false
  });
}

const cancelOrder = async (name, drink, amount) => {
  isSubmitting.value = true
  console.log("Canceling order", name, " ", drink, " ", amount)
  const orderData = {
    customer_name: name,
    drink_name: drink,
    quantity: -amount,
  };

  //Remove order from previous orders
  setTimeout(() => {
    let result = []
    let found = false
    for (const order of previousOrders.value) {
      if (order.drink === drink && order.amount === amount && order.name === name && !found) {
        found = true
      } else {
        result.push(order)
      }
    }
    previousOrders.value = result
  }, 3000)

  try {
    console.log("Canceling order", orderData)
    await axios.post(postUrl, orderData);
    console.log(orderData, ' placed successfully');
    showSuccessToast("Tellimus esitatud:\n"
      + orderData.customer_name + ": " + orderData.quantity + "x" + orderData.drink_name);
  } catch (error) {
    console.error('Error placing order:', error);
    showErrorToast("Tellimuse esitamine ebaõnnestus:\n"
      + orderData.customer_name + ": " + orderData.quantity + "x" + orderData.drink_name);
    await cancelOrder(name, drink, amount);
  }
}

const submitOrders = async() => {
  for (const order of currentOrders.value) {
    await submitOrder(order)
  }
}

const submitOrder = async (order) => {
  v$.value.$touch()
  if (state.name === "" || state.drink === "") {
    return
  }
  isSubmitting.value = true
  const orderData = {
    customer_name: order.name,
    drink_name: order.drink,
    quantity: order.amount,
  };

  try {
    console.log("Submitting order", orderData)
    await axios.post(postUrl, orderData);
    console.log(orderData, ' placed successfully');
    showSuccessToast("Tellimus esitatud:\n"
      + orderData.customer_name + ": " + orderData.quantity + "x" + orderData.drink_name);
    rememberOrder(order.name, order.drink, order.amount)
    removeOrder(orderData.customer_name, orderData.drink_name, orderData.quantity)
  } catch (error) {
    console.error('Error placing order:', error);
    showErrorToast("Tellimuse esitamine ebaõnnestus:\n"
      + orderData.customer_name + ": " + orderData.quantity + "x" + orderData.drink_name);
    await submitOrder(order);
  }
};

function clear() {
  v$.value.$reset()

  for (const [key, value] of Object.entries(Order)) {
    state[key] = value
  }
}

function removeOrder(name, drink, amount) {
  //Remove only first matching element
  let result = []
  let found = false
  for (const order of currentOrders.value) {
    if (order.drink === drink && order.amount === amount && order.name === name && !found) {
      found = true
    } else {
      result.push(order)
    }
  }
  currentOrders.value = result
}

function rememberOrder(name, drink, amount) {
  previousOrders.value.unshift({name: name, drink: drink, amount: amount})
  if (previousOrders.value.length > 6) {
    previousOrders.value.pop()
  }
}

function reset() {
  isSubmitting.value = false
}

const getNames = async (reFetchTimeout) => {
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
    setTimeout(() => {
      getNames(reFetchTimeout * 1.5)
    }, reFetchTimeout)
  }
};

const getDrinks = async (reFetchTimeout) => {
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
    setTimeout(() => {
      getDrinks(reFetchTimeout * 1.5)
    }, reFetchTimeout)
  }
};

onMounted(() => {
  getNames(1000);
  getDrinks(1000);
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
      <v-btn-group>
        <v-btn
          @click="openDialog"
          color="green-darken-1"
          class="mr-4"
        >
          Lisa tellimus
        </v-btn>
        <v-btn
          :disabled="isSubmitting"
          :loading="isSubmitting"
          color="indigo-darken-4"
          class="mr-4"
          @click="submitOrders"
        >
          Saada pilve
        </v-btn>
        <v-btn
          color="deep-orange-darken-4"
          class="mr-4"
          :disabled="state.drink === '' && state.name === ''"
          @click="clear"
        >
          Tühjenda
        </v-btn>
        <v-btn
          @click="reset"
        >
          Reset
        </v-btn>
      </v-btn-group>
      <v-dialog v-model="dialogOpen" max-width="500px">
        <v-card>
          <v-card-title>Vali jook ja kogus</v-card-title>
          <v-card-text>
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
          </v-card-text>
          <v-card-actions>
            <v-btn
              class="ml-4"
              color="deep-orange-darken-4"
              @click="closeDialog">Välju
            </v-btn>
            <v-btn
              color="green-darken-1"
              @click="saveOrder">Lisa
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-card class="mt-6">
        <v-card-title>Hetke tellimus</v-card-title>
        <v-list>
          <v-list-item
            v-for="(order, index) in currentOrders"
            :key="index"
            :value="order"
            rounded="shaped"
          >
            <v-list-item-action>
              <v-btn
                color="deep-orange-darken-4"
                @click="removeOrder(order.name, order.drink, order.amount)"
                class="mr-8"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              >
                Eemalda
              </v-btn>
              {{ order.name }}: {{ order.amount }}x {{ order.drink }}
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card>
    </v-form>
  </v-col>

  <v-col>
    <v-card>
      <v-card-title>Eelnevad tellimused</v-card-title>
      <v-list>
        <v-list-item
          v-for="(order, index) in previousOrders"
          :key="index"
          :value="order"
          rounded="shaped"
        >
          <v-list-item-action>
            <v-btn
              color="deep-orange-darken-4"
              @click="cancelOrder(order.name, order.drink, order.amount)"
              class="mr-8"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              Tühista
            </v-btn>
            {{ order.name }}: {{ order.amount }}x {{ order.drink }}
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </v-col>
</template>

<style scoped>

</style>
