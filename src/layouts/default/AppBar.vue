<template>
  <v-toolbar color="primary" :flat="true">
    <v-img class="mr-4 ml-4 pa-2" :max-height="64" :max-width="120" src="@/assets/sov_logo.png"/>
    <v-btn size="x-large" :active="false" variant="text" height="64" to="/" text="Avaleht"/>
    <v-btn size="x-large" :active="false" variant="text" height="64" to="/arved" text="Arved"/>
    <v-spacer></v-spacer>
    <Settings/>
  </v-toolbar>
</template>

<script setup>
import Settings from "@/molecules/Settings.vue";
</script>
