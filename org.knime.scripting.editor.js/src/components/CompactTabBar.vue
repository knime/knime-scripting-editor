<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import { TabBar } from "@knime/components";

import useShouldFocusBePainted from "@/components/utils/shouldFocusBePainted";

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "value",
  },
  possibleValues: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);
const data = useVModel(props, "modelValue", emit);

const paintFocus = useShouldFocusBePainted();
</script>

<template>
  <TabBar
    v-model="data"
    class="scripting-editor-tab-bar"
    :class="{ 'focus-painted': paintFocus }"
    :possible-values="props.possibleValues"
    :name="name"
  />
</template>

<style scoped lang="postcss">
.shadow-wrapper {
  margin: 0;

  &::before,
  &::after {
    content: none;
  }

  & :deep(.carousel) {
    padding: 0;
    overflow-y: hidden;

    &::before,
    &::after {
      left: 0;
      right: 0;
      bottom: 9px;
    }
  }
}

.scripting-editor-tab-bar {
  margin-right: var(--space-8);

  & :deep(.tab-bar) {
    padding-top: var(--space-8);
    padding-bottom: 0;

    & span {
      font-size: 13px;
      font-family: Roboto, sans-serif;
      line-height: 61px;
      height: 48px;
      font-weight: 400;
    }
  }
}

.scripting-editor-tab-bar.focus-painted:focus-within
  :deep(label:has(input[type="radio"]:checked)::after) {
  content: "";
  position: absolute;
  display: block;
  inset: -5px 0 -12px;
  border: 2px solid var(--knime-cornflower);
  z-index: 1;
}

/* Have to slightly shrink selection styling to paint focus nicely */
.scripting-editor-tab-bar.focus-painted:focus-within
  :deep(input[type="radio"]:checked + span::after) {
  left: 4px;
  right: 4px;
}
</style>
