<template>
  <v-toolbar color="primary" :flat="true">
    <v-img class="mr-4 ml-4 pa-2" :max-height="64" :max-width="120" src="@/assets/sov_logo.png"/>
    <v-btn size="x-large" :active="false" variant="text" height="64" to="/" text="Avaleht"/>
    <v-btn :disabled="Object.keys(mainStore.currentRequest).length !== 0"
           size="x-large" :active="false" variant="text" height="64" to="/arved" text="Arved"/>
    <v-btn :disabled="Object.keys(mainStore.currentRequest).length !== 0"
           size="x-large" :active="false" variant="text" height="64" to="/statistika" text="Statistika"/>
    <v-btn size="x-large" :active="false" variant="text" height="64" to="/logi" text="Logi"/>
    <v-spacer></v-spacer>
    <v-tooltip
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-icon
          v-bind="props"
          :color="mainStore.isConnected ? 'success' : 'error'"
          size="large"
          class="mr-2"
        >
          {{ mainStore.isConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
        </v-icon>
      </template>
      <span>{{ mainStore.isConnected ? 'Ühendatud' : 'Ühendus puudub' }}</span>
    </v-tooltip>
    <v-tooltip
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          icon="mdi-help"
        />
      </template>
      <p>Nuppude legend:</p>
      <p>
        <v-icon>mdi-circle-small</v-icon>
        Shift: fokuseerib nimelahtri
      </p>
      <p>
        <v-icon>mdi-circle-small</v-icon>
        1: viib valikut
        <v-icon>mdi-arrow-up-bold</v-icon>
      </p>
      <p>
        <v-icon>mdi-circle-small</v-icon>
        2: viib valikut
        <v-icon>mdi-arrow-down-bold</v-icon>
      </p>
    </v-tooltip>
    <v-switch
      class=" pt-5 pl-4"
      :model-value="mainStore.sohvik"
      @update:modelValue="mainStore.setSohvik"
    >
      <template v-slot:prepend>
        <v-icon>mdi-coffee</v-icon>
      </template>
    </v-switch>
    <v-switch
      class=" pt-5 pl-4"
      :model-value="isLight"
      @update:modelValue="toggleTheme"
    >
      <template v-slot:prepend>
        <v-icon>mdi-theme-light-dark</v-icon>
      </template>
    </v-switch>

    <Settings/>
  </v-toolbar>
</template>

<script setup>
import Settings from "@/molecules/Settings.vue";
import {useTheme} from "vuetify";
import {ref} from "vue";
import {useMainStore} from "@/api/MainStore";

const mainStore = useMainStore()

const savedTheme = localStorage.getItem("theme");
const isLight = ref(savedTheme === "light");
const theme = useTheme()

if (savedTheme === "light" || savedTheme === "dark") {
  theme.global.name.value = savedTheme;
}

function toggleTheme(value) {
  const nextTheme = value ? "light" : "dark";
  theme.global.name.value = nextTheme;
  isLight.value = value;
  localStorage.setItem("theme", nextTheme);
}
</script>
