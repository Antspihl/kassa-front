<template>
  <div v-if="modelValue" class="lock-card-wrapper">
    <v-card class="lock-card">
      <v-card-text>
        <div class="mt-4" style="font-size: 28px; letter-spacing: 6px; text-align: center;">
          {{ displayEntered }}
        </div>
        <div class="red--text text-center mt-2" v-if="errorMessage">{{ errorMessage }}</div>

        <v-row class="mt-4" justify="center">
          <v-col cols="12">
            <v-row justify="center" class="numpad-row">
              <v-col cols="4" v-for="n in [1,2,3]" :key="`r1-${n}`">
                <v-btn large block @click="appendDigit(String(n))">{{ n }}</v-btn>
              </v-col>
            </v-row>
            <v-row justify="center" class="numpad-row">
              <v-col cols="4" v-for="n in [4,5,6]" :key="`r2-${n}`">
                <v-btn large block @click="appendDigit(String(n))">{{ n }}</v-btn>
              </v-col>
            </v-row>
            <v-row justify="center" class="numpad-row">
              <v-col cols="4" v-for="n in [7,8,9]" :key="`r3-${n}`">
                <v-btn large block @click="appendDigit(String(n))">{{ n }}</v-btn>
              </v-col>
            </v-row>
            <v-row justify="center" class="numpad-row">
              <v-col cols="4">
                <v-btn large block color="error" @click="backspace">←</v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn large block @click="appendDigit('0')">0</v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn large block color="primary" @click="submitCode">OK</v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'unlocked'): void;
}>();

const expectedCode = ref('');
const entered = ref('');
const errorMessage = ref('');

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    expectedCode.value = getCurrentTimeCode();
    entered.value = '';
    errorMessage.value = '';
  },
  {immediate: true}
);

function getCurrentTimeCode(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${mm}${hh}`;
}

function appendDigit(digit: string) {
  if (entered.value.length >= 4) return;
  entered.value += digit;
  errorMessage.value = '';
}

function backspace() {
  entered.value = entered.value.slice(0, -1);
  errorMessage.value = '';
}

const displayEntered = computed(() => {
  const filled = entered.value.padEnd(4, '•');
  return filled.split('').join(' ');
});

function submitCode() {
  if (entered.value.length !== 4) {
    errorMessage.value = 'Sisesta 4 numbrit';
    return;
  }
  if (entered.value === expectedCode.value) {
    errorMessage.value = '';
    emit('update:modelValue', false);
    emit('unlocked');
  } else {
    errorMessage.value = 'Vale kood';
    entered.value = '';
  }
}
</script>

<style scoped>
.numpad-row {
  margin-bottom: 8px;
}

.lock-card-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: none;
}

.lock-card {
  pointer-events: auto;
  width: 420px;
}
</style>
