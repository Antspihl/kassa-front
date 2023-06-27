<script setup>

import axios from "axios";
import {useToast} from "vue-toastification";
import {onMounted, ref} from "vue";

const billsUrl = "http://localhost:5000/bills"

const isFetchingBills = ref(true)
const isSubmitting = ref(false)
const bills = ref([]) // [["name1", bill1], ["name2", bill2]]
const toast = useToast()

const getBills = async (reFetchTimeout) => {
  try {
    console.log("Fetching bills");
    const response = await axios.get(billsUrl);
    showSuccessToast("Arved laetud");
    console.log(response.data);
    bills.value = response.data;
    isFetchingBills.value = false;
  } catch (error) {
    console.error('Error receiving names:', error);
    showErrorToast("Arvete laadimine ebaõnnestus");
    setTimeout(() => {
      getBills(reFetchTimeout * 1.5)
    }, reFetchTimeout)
  }
};

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
  isSubmitting.value = false
}

onMounted(() => {
  getBills(1000)
})
</script>

<template>
  <v-col>
    <v-list v-if="!isFetchingBills">
      <v-list-item v-for="bill in bills" :key="bill[0]">
        <v-list-item-title>{{ bill[0] }}</v-list-item-title>
        <v-list-item-subtitle>Arve: {{ bill[1] }}€</v-list-item-subtitle>
        <v-divider></v-divider>
      </v-list-item>
    </v-list>

    <v-card v-else>
      <v-card-text>
        <h1>Laen arveid...</h1>
      </v-card-text>
      <v-progress-linear indeterminate color="primary"></v-progress-linear>
    </v-card>
  </v-col>
</template>

<style scoped>

</style>
