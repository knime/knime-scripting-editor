<script setup lang="ts">
import Button from "webapps-common/ui/components/Button.vue";
import AiButton from "webapps-common/ui/assets/img/icons/ai-brain.svg";
</script>

<template>
  <div class="container">
    <Button compact on-dark class="ai-button">
      <AiButton />
    </Button>
    <slot name="controls" class="button-controls" />
  </div>
</template>

<style lang="postcss" scoped>
.container {
  display: flex;
  justify-content: space-between;
  align-content: center;
  min-height: var(--controls-height);
  max-height: var(--controls-height);
  padding: 9px 20px;
  background-color: var(--knime-gray-light-semi);
  border-top: 1px solid var(--knime-silver-sand);
}

.button-controls {
  display: flex;
  justify-content: right;
}

.button {
  & :slotted(svg) {
    stroke: var(--knime-porcelain);
  }
}

.ai-button {
  border: none;
  border-radius: 0;
  margin: -9px -20px;
  height: 49px;
  width: 49px;

  &.compact {
    background-color: var(--knime-masala);
  }

  & svg {
    stroke: var(--knime-porcelain);
    transform: scale(1.3);
    margin: 0;
  }

  &.on-dark {
    &:active,
    &:hover,
    &:focus {
      background-color: var(--knime-masala);

      & svg {
        stroke: var(--knime-porcelain);
        transform: scale(1.5);
      }
    }
  }
}
</style>