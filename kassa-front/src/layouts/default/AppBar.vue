<template>
  <v-app-bar color="primary" flat>
    <v-img class="mr-4 ml-4 pa-2" :max-height="64" :max-width="120" src="@/assets/sov_logo.png"/>
    <v-btn
      size="x-large"
      class="mx-2"
    >
      <router-link to="/" v-slot="{href, route, navigate}"
                   style="text-decoration: none; color: inherit;">
        <h2>Kassa</h2>
      </router-link>
    </v-btn>

    <v-btn
      size="x-large"
      class="mx-2"
    >
      <router-link to="/arved" v-slot="{href, route, navigate}"
                   style="text-decoration: none; color: inherit;">
        <h2>Arved</h2>
      </router-link>
    </v-btn>
  </v-app-bar>
</template>

<script setup>

</script>
