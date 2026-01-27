<template>
  <v-container>
    <div v-if="!isFetchingBills">
      <h2 class="mb-6">Müügistatistika</h2>

      <v-row>
        <!-- Drinks Pie Chart on the left -->
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

        <!-- Right column with stacked cards -->
        <v-col cols="12" md="6" >
          <!-- Top Spenders Bar Chart -->
          <v-card class="mb-4">
            <v-card-title>Suurimad kulutajad</v-card-title>
            <v-card-text>
              <Bar
                :data="spendersChartData"
                :options="barChartOptions"
              />
            </v-card-text>
          </v-card>

          <!-- Summary Stats -->
          <v-row>
            <v-col>
              <v-card>
                <v-card-text>
                  <h2>Kokku müüdud jooke: {{ totalDrinksSold }}</h2>
                </v-card-text>
              </v-card>
            </v-col>
            </v-row>
          <v-row>
            <v-col>
              <v-card>
                <v-card-text>
                  <h2>Klientide arv: {{ totalCustomers }}</h2>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
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
import { computed, onMounted } from 'vue';
import { useMainStore } from '@/api/MainStore';
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
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Pie } from 'vue-chartjs';


ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  ChartDataLabels
);

interface BillDetail {
  name: string;
  bill: string;
  drinks: { [key: string]: number };
}

const mainStore = useMainStore();
const bills = computed<BillDetail[]>(() => mainStore.bills as BillDetail[]);
const isFetchingBills = computed(() => mainStore.isFetchingBills);

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
    .sort((a, b) => Number.parseFloat(b.bill) - Number.parseFloat(a.bill))
    .filter(c => c.name.split(' ').length >= 2)
    .slice(0, 5);

  return {
    labels: sortedBills.map(b => b.name),
    datasets: [
      {
        label: 'Arve summa (€)',
        backgroundColor: '#4CAF50',
        data: sortedBills.map(b => Number.parseFloat(b.bill))
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
    .slice(0, 10); // Show the top 10 drinks

  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#4f6df6',
    '#C9CBCF',
    '#e122d2',
    '#0ce84f'
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
    },
    datalabels: {
      anchor: 'center' as const,
      formatter: (value: number) => `${value.toFixed(2)}€`,
      color: '#fff',
      font: {
        weight: 'bold' as const,
        size: 14
      }
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

onMounted(() => {
  mainStore.fetchBills(1000);
});
</script>
