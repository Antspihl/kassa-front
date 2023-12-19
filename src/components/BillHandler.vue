<script setup lang="ts">

import axios from "axios";
import {useToast} from "vue-toastification";
import {onMounted, ref} from "vue";
import {VDataTable} from "vuetify/labs/VDataTable";
type ReadonlyHeaders = InstanceType<typeof VDataTable>['headers']
type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : never;
type ReadonlyDataTableHeader = UnwrapReadonlyArray<ReadonlyHeaders>;


const billsUrl = "http://localhost:5000/bills"
const billNameUrl = "http://localhost:5000/bill"

const search = ref('')

interface Bill {
  name: string,
  bill: number
}

interface BillDetail {
  name: string,
  bill: string,
  drinks: Map<string, number>
}

const bills = ref<Bill[]>([])

const headers: ReadonlyDataTableHeader[] = [
  { key: 'name', title: 'Isik', value: 'name', sortable: true},
  { key: 'bill', title: 'Arve', value: 'bill', sortable: true}
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
  } catch (error) {
    console.error('Error receiving names:', error);
    showErrorToast("Arvete laadimine ebaõnnestus");
    setTimeout(() => {
      getBills(reFetchTimeout * 1.5)
    }, reFetchTimeout)
  }
};

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
    <v-responsive
    >
      <v-text-field
        v-model="search"
        label="Otsi"
        :clearable="true"
      />
    </v-responsive>
    <VDataTable
      :headers="headers"
      :items="bills"
      :search="search"
      class="custom-users-table"
    >
    </VDataTable>
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
