<template>
  <v-col>
    <div v-if="!isFetchingBills">
      <h3>Arvete summa hetkel: {{sumOfBills}}€</h3>
      <h3>Kasu hetkel: {{profit}}€</h3>
      <v-responsive
      >
        <v-text-field
          v-model="search"
          label="Otsi nime järgi"
          :clearable="true"
        />
        <v-data-table
          :headers="headers"
          :items="bills"
          :search="search"
          show-expand
          item-value="name"
        >
          <template v-slot:item.bill="{ value }">
              {{ value }}€
          </template>
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                  <v-list density="compact">
                    <v-list-subheader>Tellitud joogid</v-list-subheader>
                      <v-list-item v-for="(value, key) in item.drinks" :key="key">
                        <v-list-item>
                          <h3>{{value}}x {{ key }}</h3>
                        </v-list-item>
                      </v-list-item>
                  </v-list>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-responsive>
    </div>

    <v-skeleton-loader
      v-else
      type="table"
      :loading="isFetchingBills"
      />
  </v-col>
</template>

<script setup lang="ts">

import axios from "axios";
import {useToast} from "vue-toastification";
import {onMounted, ref} from "vue";
import {API_URL} from "@/api/MainStore";

const sumOfBills = ref(0)
const profit = ref(0)
const billsUrl = API_URL + "/bills"

const search = ref('')

interface BillDetail {
  name: string,
  bill: string,
  drinks: Map<string, number>
}

const bills = ref<BillDetail[]>([])
const headers = [
  { title: 'Nimi', key: 'name' },
  { title: 'Arve', key: 'bill' }
]

const isFetchingBills = ref(true)
const isSubmitting = ref(false)
const toast = useToast()

const getBills = async (reFetchTimeout) => {
  try {
    console.log("Fetching bills");
    const response = await axios.get(billsUrl);
    showSuccessToast("Arved laetud");
    console.log(response.data);
    bills.value = response.data;
    isFetchingBills.value = false;
    sumTheBills();
  } catch (error) {
    console.error('Error receiving names:', error);
    showErrorToast("Arvete laadimine ebaõnnestus");
    setTimeout(() => {
      getBills(reFetchTimeout * 1.5)
    }, reFetchTimeout)
  }
};

function sumTheBills() {
  let sum = 0;
  let sum2;
  bills.value.forEach((bill) => {
    sum += parseInt(bill.bill);
  })
  sumOfBills.value = sum;
  bills.value.forEach((bill) => {
    if (bill.name === "Maja arve" || bill.name === "Baari arve") {
      sum -= parseInt(bill.bill);
    }
  })
  sum2 = sum
  profit.value = sum2;
}

const showSuccessToast = (text) => {
  toast.success(text);
  isSubmitting.value = false
}

const showErrorToast = (text) => {
  toast.error(text);
  isSubmitting.value = false
}

onMounted(() => {
  getBills(1000)
})
</script>
