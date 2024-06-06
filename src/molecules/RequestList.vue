<template>
  <v-list>
    <v-list-subheader>Hetkel saadan:</v-list-subheader>
    <v-list-item v-if="Object.keys(mainStore.currentRequest).length > 0">
      <v-list-item-title>
        <StatusIcon :status="mainStore.currentRequest.type" />
        {{ getRequestInfo(mainStore.currentRequest) }}
      </v-list-item-title>
    </v-list-item>
  </v-list>
  <v-list>
    <v-list-subheader>Ootel tellimused:</v-list-subheader>
    <v-list-item
      v-for="(req, index) in mainStore.requestList"
      :key="index"
    >
      <v-list-item-title>
        <StatusIcon :status="req.type" />
        {{ getRequestInfo(req) }}
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import {useMainStore} from "@/api/MainStore";
import {BarRequest} from "@/molecules/types";
import StatusIcon from "@/molecules/StatusIcon.vue";

const mainStore = useMainStore();

function getRequestInfo(req: BarRequest) {
  if (req === null) {
    return;
  }
  if (req.type === 0 || req.type === 2) {
    return `${req.order.name}: ${req.order.amount}x ${req.order.drink}`;
  } else if (req.type == 1) {
    return `${req.oldOrder.name}: ${req.oldOrder.amount}x ${req.oldOrder.drink} => ${req.order.name}: ${req.order.amount}x ${req.order.drink}`;
  }
}
</script>

