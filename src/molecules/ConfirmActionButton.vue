<template>
  <v-btn
    v-if="!pending"
    v-bind="attrs"
    :icon="icon"
    :color="color"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    @click="arm"
  />
  <v-tooltip
    v-else
    location="bottom"
  >
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="{ ...attrs, ...props }"
        :icon="icon"
        :color="color"
        :size="size"
        :loading="loading"
        :disabled="disabled"
        @click="confirm"
      />
    </template>
    <span>{{ confirmTooltip }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import {ref, useAttrs} from 'vue';

type Props = {
  icon: string;
  color?: string;
  size?: string;
  loading?: boolean;
  disabled?: boolean;
  confirmTooltip?: string;
};

const props = withDefaults(defineProps<Props>(), {
  color: undefined,
  size: 'small',
  loading: false,
  disabled: false,
  confirmTooltip: 'Kindel?',
});

const emit = defineEmits<{
  (e: 'confirm'): void;
}>();

const attrs = useAttrs();
const pending = ref(false);

function arm() {
  if (props.disabled) return;
  pending.value = true;
}

function confirm() {
  if (props.disabled) return;
  pending.value = false;
  emit('confirm');
}
</script>
