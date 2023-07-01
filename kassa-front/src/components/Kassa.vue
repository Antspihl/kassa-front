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

const editOrder = ref({
  name: "",
  drink: "",
  amount: 1,
})

const previousOrders = ref([])
const currentOrders = ref([])

const state = reactive({...Order})

const postUrl = "http://localhost:5000/order"
const namesUrl = "http://localhost:5000/names"
const drinksUrl = "http://localhost:5000/drinks"

const names = ref([])
const drinks = ref([])
const isSubmitting = ref(false)
const isFetchingNames = ref(true)
const isFetchingDrinks = ref(true)
const doneFetching = ref(false)
const orderDialogOpen = ref(false);
const editDialogOpen = ref(false);

const toast = useToast()

const rules = {
  name: {required},
  drink: {required},
  amount: {required, numeric, minValue: minValue(1)},
  oldName: {required},
  oldDrink: {required},
  oldAmount: {required, numeric, minValue: minValue(1)},
}
const v$ = useVuelidate(rules, state)

const openEditDialog = (order) => {
  openDialog("edit")
  editOrder.value = order
}

const openDialog = (dialogName) => {
  if (dialogName === "order") {
    orderDialogOpen.value = true;
  } else if (dialogName === "edit") {
    editDialogOpen.value = true;
  }
};

const closeDialog = (dialogName) => {
  if (dialogName === "order") {
    orderDialogOpen.value = false;
  } else if (dialogName === "edit") {
    editDialogOpen.value = false;
  }
};

const saveOrder = () => {
  if (v$.value.$invalid) {
    v$.value.$touch();
    if (v$.value.name.$invalid) {
      showErrorToast("Nime valimine on kohustuslik");
      closeDialog('order');
    } else if (v$.value.drink.$invalid) {
      showErrorToast("Joogi valimine on kohustuslik");
    } else if (v$.value.amount.$invalid) {
      showErrorToast("Kogus peab olema vähemalt 1");
    }
    return;
  }
  orderDialogOpen.value = false;
  currentOrders.value.push({name: state.name, drink: state.drink, amount: state.amount});
  localStorage.setItem("currentOrders", JSON.stringify(currentOrders.value));
};

const saveOrderChanges = async (oldOrder, newOrder) => {
  if (oldOrder.name === newOrder.name && oldOrder.drink === newOrder.drink && oldOrder.amount === newOrder.amount) {
    console.log("No changes made", oldOrder, newOrder)
    return
  }
  if (v$.value.$invalid) {
    console.log("Invalid data for edit")
    v$.value.$touch();
    if (v$.value.name.$invalid) {
      showErrorToast("Nime valimine on kohustuslik");
      closeDialog('edit');
    } else if (v$.value.drink.$invalid) {
      showErrorToast("Joogi valimine on kohustuslik");
    } else if (v$.value.amount.$invalid) {
      showErrorToast("Kogus peab olema vähemalt 1");
    }
    return;
  }
  console.log("Saving order changes", oldOrder, newOrder)
  let oldIndex = previousOrders.value.indexOf(oldOrder)
  previousOrders.value[oldIndex] = newOrder
  await cancelOrder(oldOrder.name, oldOrder.drink, oldOrder.amount)
  await submitOrder(newOrder)
  closeDialog('edit')
}

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
  localStorage.setItem("previousOrders", JSON.stringify(previousOrders.value))

  try {
    console.log("Canceling order", orderData)
    await axios.post(postUrl, orderData);
    console.log(orderData, ' canceled successfully');
    showSuccessToast("Tellimus tühistatud:\n"
      + orderData.customer_name + ": " + orderData.quantity + "x" + orderData.drink_name);
  } catch (error) {
    console.error('Error canceling order:', error);
    showErrorToast("Tellimuse tühistamine ebaõnnestus:\n"
      + orderData.customer_name + ": " + orderData.quantity + "x" + orderData.drink_name);
    await cancelOrder(name, drink, amount);
  }
}

const submitOrders = async () => {
  for (const order of currentOrders.value) {
    await submitOrder(order)
  }
}

const submitOrder = async (order) => {
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

const clear = () => {
  v$.value.$reset()

  for (const [key, value] of Object.entries(Order)) {
    state[key] = value
  }
}

const removeOrder = (name, drink, amount) => {
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
  localStorage.setItem("currentOrders", JSON.stringify(currentOrders.value))
}

const rememberOrder = (name, drink, amount) => {
  previousOrders.value.unshift({name: name, drink: drink, amount: amount})
  if (previousOrders.value.length > 6) {
    previousOrders.value.pop()
  }
  localStorage.setItem("previousOrders", JSON.stringify(previousOrders.value))
}

const getNames = async (reFetchTimeout) => {
  try {
    console.log("Fetching names");
    const response = await axios.get(namesUrl);
    showSuccessToast("Nimed laetud");
    console.log(response.data);
    names.value = response.data;
    localStorage.setItem("names", JSON.stringify(names.value));
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
    localStorage.setItem("drinks", JSON.stringify(drinks.value));
    isFetchingDrinks.value = false;
  } catch (error) {
    console.error('Error receiving drinks:', error);
    showErrorToast("Jookide laadimine ebaõnnestus");
    setTimeout(() => {
      getDrinks(reFetchTimeout * 1.5)
    }, reFetchTimeout)
  }
};

onMounted(async () => {
  const previousOrdersString = localStorage.getItem("previousOrders")
  const currentOrdersString = localStorage.getItem("currentOrders")
  const namesString = localStorage.getItem("names")
  const drinksString = localStorage.getItem("drinks")

  if (previousOrdersString) previousOrders.value = JSON.parse(previousOrdersString)
  if (currentOrdersString) currentOrders.value = JSON.parse(currentOrdersString)

  if (namesString) {
    names.value = JSON.parse(namesString)
    isFetchingNames.value = false;
  } else {
    await getNames(1000);
  }
  if (drinksString) {
    drinks.value = JSON.parse(drinksString)
    isFetchingDrinks.value = false;
  } else {
    await getDrinks(1000);
  }
  doneFetching.value = true;
});
</script>

<template>
  <v-col>
    <v-form class="mt-2">
      <v-autocomplete
        v-if="!isFetchingNames"
        v-model="state.name"
        :items="names"
        :error-messages="v$.name.$errors.map(e => e.$message)"
        label="Nimi"
        required
        @input="v$.name.$touch"
        @blur="v$.name.$touch"
      ></v-autocomplete>
      <v-card v-else class="mb-4">
        <v-card-text>
          <h1>Laen nimesid...</h1>
        </v-card-text>
        <v-progress-linear indeterminate color="primary"></v-progress-linear>
      </v-card>
      <v-btn-group>
        <v-btn
          @click="openDialog('order')"
          color="green-darken-1"
          class="mr-4"
          :disabled="doneFetching.value"
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
      </v-btn-group>
      <v-dialog v-model="orderDialogOpen" max-width="500px">
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
              @click="closeDialog('order')"
            >
              Välju
            </v-btn>
            <v-btn
              color="green-darken-1"
              @click="saveOrder"
            >
              Lisa
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
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              Tühista
            </v-btn>
            <v-btn
              color="indigo-darken-4"
              class="mx-4"
              @click="openEditDialog(order)"
            >
              Muuda tellimust
            </v-btn>
            <v-dialog v-model="editDialogOpen" max-width="500px">
              <v-card>
                <v-card-title>Muuda, mis tahad</v-card-title>
                <v-card-text>
                  <v-autocomplete
                    v-model="editOrder.name"
                    :items="names"
                    :error-messages="v$.oldName.$errors.map(e => e.$message)"
                    label="Nimi"
                    required
                    @input="v$.oldName.$touch"
                    @blur="v$.oldName.$touch"
                  ></v-autocomplete>

                  <v-autocomplete
                    v-model="editOrder.drink"
                    :items="drinks"
                    :error-messages="v$.oldDrink.$errors.map(e => e.$message)"
                    label="Jook"
                    required
                    @input="v$.oldDrink.$touch"
                    @blur="v$.oldDrink.$touch"
                  ></v-autocomplete>

                  <v-text-field
                    v-model="editOrder.amount"
                    :error-messages="v$.oldAmount.$errors.map(e => e.$message)"
                    label="Kogus"
                    required
                    @change="v$.oldAmount.$touch"
                    @blur="v$.oldAmount.$touch"
                  ></v-text-field>

                  <v-btn-group shaped color="indigo-darken-4" class="d-flex mb-4">
                    <v-btn @click="editOrder.amount--;" :disabled="editOrder.amount === 1">-</v-btn>
                    <v-btn :disabled=true @change="v$.amount.$touch">{{ editOrder.amount }}</v-btn>
                    <v-btn @click="editOrder.amount++">+</v-btn>
                  </v-btn-group>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    class="ml-4"
                    color="deep-orange-darken-4"
                    @click="closeDialog('edit')"
                  >
                    Välju
                  </v-btn>
                  <v-btn
                    color="green-darken-1"
                    @click="saveOrderChanges(order, editOrder)"
                  >
                    Salvesta muudatused
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
            {{ order.name }}: {{ order.amount }}x {{ order.drink }}
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </v-col>
</template>

<style scoped>

</style>
