<script setup lang="ts">
import { useAttrs } from "vue";
import { SplitPanel } from "@knime/components";

type ConditionalSplitterProps = {
  enable: boolean;
};
defineProps<ConditionalSplitterProps>();

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
</script>

<template>
  <SplitPanel v-if="enable" v-bind="attrs">
    <template #default>
      <slot />
    </template>
    <template #secondary>
      <slot name="secondary" />
    </template>
  </SplitPanel>
  <template v-else>
    <slot />
  </template>
</template>
