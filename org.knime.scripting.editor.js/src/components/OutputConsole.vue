<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useResizeObserver, useDebounceFn } from "@vueuse/core";

import type { ITerminalOptions, ITheme, ITerminalInitOnlyOptions } from "xterm";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import * as knimeColors from "webapps-common/ui/colors/knimeColors.mjs";
import TabBar from "webapps-common/ui/components/TabBar.vue";
import TrashIcon from "webapps-common/ui/assets/img/icons/trash.svg";

import Button from "webapps-common/ui/components/Button.vue";

export interface ConsoleText {
  text: string;
}

export type ConsoleHandler = (text: ConsoleText) => void;

const DEBOUNCE_TIME = 300;

const theme: ITheme = {
  background: knimeColors.White,
  foreground: knimeColors.Masala,
  selectionBackground: knimeColors.Porcelain,
  cursor: knimeColors.StoneGray,
  black: knimeColors.Black,
  red: knimeColors.HibiscusDark,
};

const options: ITerminalOptions & ITerminalInitOnlyOptions = {
  letterSpacing: 0, // in pixel, needs to be defined otherwise it's dynamic
  fontSize: 10,
  convertEol: true, // otherwise \n doesn't start at beginning of new line
  fontFamily: '"Roboto Mono", sans-serif',
  disableStdin: true,
  cursorBlink: false,
  theme,
};

const term = new Terminal(options);
const termRef = ref<HTMLInputElement | null>(null);
const fitAddon = new FitAddon();

term.loadAddon(fitAddon);
const updateConsole = useDebounceFn(() => {
  fitAddon.fit();
}, DEBOUNCE_TIME);
useResizeObserver(termRef, () => {
  updateConsole();
});

type ConsoleHandlerEmit = (
  e: "console-created",
  handler: ConsoleHandler,
) => void;

const emit = defineEmits<ConsoleHandlerEmit>();

onMounted(() => {
  term.open(termRef.value as HTMLElement);
  emit("console-created", (text: ConsoleText) => term.write(text.text));
});

onUnmounted(() => {
  term?.dispose();
});

type ConsoleTabValue = "console";
const bottomPaneActiveTab = ref<ConsoleTabValue>("console");
const bottomPaneOptions = [{ value: "console", label: "Console" }];
</script>

<template>
  <div class="container">
    <TabBar
      v-model="bottomPaneActiveTab"
      class="tabbar"
      :possible-values="bottomPaneOptions"
    />
    <Button
      v-show="bottomPaneActiveTab === 'console'"
      class="clear-button"
      compact
      @click="term.reset()"
    >
      <TrashIcon />
    </Button>
  </div>
  <div v-show="bottomPaneActiveTab === 'console'">
    <div ref="termRef" class="terminal" />
  </div>
</template>

<style lang="postcss">
@import url("xterm/css/xterm.css");

.tabbar {
  flex: 1;
}

.container {
  position: relative;
}

.terminal {
  position: relative;
  width: 100%;
  height: calc(100%);
  margin-top: -15px;
  padding-left: 5px;

  & .xterm {
    height: 100%;
  }
}

.clear-button {
  position: absolute;
  top: 10px;
  right: 10px;
  stroke-width: 5px;
  background-color: transparent;

  /* best way to ensure pill shaped buttons with flexible 1/4 corners */
  border-radius: var(--theme-button-border-radius, 9999px);
}
</style>
