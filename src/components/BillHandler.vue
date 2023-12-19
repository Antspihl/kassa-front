<script setup lang="ts">

import axios from "axios";
import {useToast} from "vue-toastification";
import {onMounted, ref} from "vue";
import {VDataTable} from "vuetify/labs/VDataTable";

type ReadonlyHeaders = InstanceType<typeof VDataTable>['headers']
type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : never;
type ReadonlyDataTableHeader = UnwrapReadonlyArray<ReadonlyHeaders>;

const expanded = ref([])
const sumOfBills = ref(0)
const profit = ref(0)
const billsUrl = "http://localhost:5000/bills"

const search = ref('')

interface BillDetail {
  name: string,
  bill: string,
  drinks: Map<string, number>
}

const bills = ref<BillDetail[]>([])

const headers: ReadonlyDataTableHeader[] = [
  {key: 'name', title: 'Isik', value: 'name', sortable: true},
  {key: 'bill', title: 'Arve', value: 'bill', sortable: true},
];


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
  // Subtract Bill with name "Maja arve" from sum
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
      </v-responsive>
      <v-data-table
        v-model:expanded="expanded"
        :headers="headers"
        :items="bills"
        :search="search"
        item-value="name"
        show-expand
      >
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length">
              <v-list
              density="compact"
              >
                <v-list-item-title><h3>Tellitud joogid:</h3></v-list-item-title>
                <v-list-item v-for="(value, key) in item.selectable.drinks" :key="key">
                    <v-list-item-title>{{ key }}: {{ value }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>

    <v-card v-else>
      <v-card-text>
        <h1>Laen arveid...</h1>
      </v-card-text>
      <v-progress-linear :indeterminate="true" color="primary"></v-progress-linear>
    </v-card>
  </v-col>
</template>

<style scoped>

</style>
