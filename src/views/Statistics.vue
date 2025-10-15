<template>
  <v-container>
    <div v-if="!isFetchingBills">
      <h2 class="mb-6">Müügistatistika</h2>

      <v-row>
        <!-- Drinks Pie Chart -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Jookide jaotus</v-card-title>
            <v-card-text>
              <Pie
                :data="drinksChartData"
                :options="pieChartOptions"
              />
            </v-card-text>
          </v-card>
        </v-col>


        <!-- Top Spenders Bar Chart -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Suurimad kulutajad</v-card-title>
            <v-card-text>
              <Bar
                :data="spendersChartData"
                :options="barChartOptions"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Summary Stats -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Kokku müüdud jooke</v-card-title>
            <v-card-text>
              <h2>{{ totalDrinksSold }}</h2>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Klientide arv</v-card-title>
            <v-card-text>
              <h2>{{ totalCustomers }}</h2>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-skeleton-loader
      v-else
      type="card, card"
      :loading="isFetchingBills"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { API_URL } from '@/api/MainStore';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'vue-chartjs';


ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

interface BillDetail {
  name: string;
  bill: string;
  drinks: { [key: string]: number };
}

const bills = ref<BillDetail[]>([]);
const isFetchingBills = ref(true);
const toast = useToast();

// Computed properties for statistics
const totalBills = computed(() => {
  return bills.value.reduce((sum, bill) => sum + parseFloat(bill.bill), 0).toFixed(2);
});

const totalCustomers = computed(() => {
  return bills.value.length;
});

const totalDrinksSold = computed(() => {
  return bills.value.reduce((sum, bill) => {
    return sum + Object.values(bill.drinks).reduce((drinkSum, count) => drinkSum + count, 0);
  }, 0);
});

// Top 5 spenders data for bar chart
const spendersChartData = computed(() => {
  const sortedBills = [...bills.value]
    .sort((a, b) => parseFloat(b.bill) - parseFloat(a.bill))
    .slice(0, 5);

  return {
    labels: sortedBills.map(b => b.name),
    datasets: [
      {
        label: 'Arve summa (€)',
        backgroundColor: '#4CAF50',
        data: sortedBills.map(b => parseFloat(b.bill))
      }
    ]
  };
});

// Drinks distribution data for pie chart
const drinksChartData = computed(() => {
  const drinkCounts: { [key: string]: number } = {};

  for (const bill of bills.value) {
    for (const [drink, count] of Object.entries(bill.drinks)) {
      drinkCounts[drink] = (drinkCounts[drink] || 0) + count;
    }
  }

  const sortedDrinks = Object.entries(drinkCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Show top 10 drinks

  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF',
    '#4BC0C0',
    '#FF9F40'
  ];

  return {
    labels: sortedDrinks.map(d => d[0]),
    datasets: [
      {
        label: 'Müüdud kogus',
        backgroundColor: colors,
        data: sortedDrinks.map(d => d[1])
      }
    ]
  };
});

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'right' as const
    }
  }
};

const getBills = async (reFetchTimeout: number) => {
  try {
    console.log('Fetching bills for statistics');
    const response = await axios.get(API_URL + '/bills');
    bills.value = response.data;
    isFetchingBills.value = false;
    toast.success('Statistika laetud');
  } catch (error) {
    console.error('Error fetching bills:', error);
    toast.error('Statistika laadimine ebaõnnestus');
    setTimeout(() => {
      getBills(reFetchTimeout * 1.5);
    }, reFetchTimeout);
  }
};

onMounted(() => {
  getBills(1000);
});
</script>

