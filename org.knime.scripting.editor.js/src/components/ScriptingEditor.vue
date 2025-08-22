<script setup lang="ts">
import { computed, ref, useSlots, watch } from "vue";
import { computedAsync, useElementBounding } from "@vueuse/core";

import type { MenuItem } from "@knime/components";
import "@knime/kds-styles/kds-variables.css";

import type { InputOutputModel } from "@/components/InputOutputItem.vue";
import { type PaneSizes } from "@/components/utils/paneSizes";
import { useResizeLogic } from "@/components/utils/resizeLogic";
import { getInitialDataService } from "@/initial-data-service";
import { type GenericNodeSettings } from "@/settings-service";

import CodeEditorControlBar from "./CodeEditorControlBar.vue";
import HeaderBar from "./HeaderBar.vue";
import InputOutputPane from "./InputOutputPane.vue";
import MainEditorPane from "./MainEditorPane.vue";
import ScriptingEditorBottomPane, {
  type BottomPaneTabControlsSlotName,
  type BottomPaneTabSlotName,
  type SlottedTab,
} from "./ScriptingEditorBottomPane.vue";
import type { SettingsMenuItem } from "./SettingsPage.vue";
import SettingsPage from "./SettingsPage.vue";
import ConditionalSplitPanel from "./ConditionalSplitPanel.vue";

const commonMenuItems: MenuItem[] = [
  // TODO: add actual common menu items
];

// Props
interface Props {
  title?: string | null;
  language: string;
  fileName?: string | null;
  rightPaneLayout?: "fixed" | "relative";
  menuItems?: MenuItem[];
  showControlBar?: boolean;
  /**
   * In pixels.
   */
  initialPaneSizes?: PaneSizes;
  rightPaneMinimumWidthInPixel?: number;
  toSettings?: (settings: GenericNodeSettings) => GenericNodeSettings;
  additionalBottomPaneTabContent?: SlottedTab[];
  /*
   * When using the single editor pane, this prop can be used to determine
   * whether the editor is used for a model or a view.
   * This will influence how the dirty state is handled.
   * default: "model"
   */
  modelOrView?: "model" | "view";
}

const props = withDefaults(defineProps<Props>(), {
  title: null,
  fileName: null,
  rightPaneLayout: "fixed",
  menuItems: () => [],
  showControlBar: true,
  initialPaneSizes: () => ({ left: 300, right: 500, bottom: 300 }),
  rightPaneMinimumWidthInPixel: () => 0,
  additionalBottomPaneTabContent: () => [] as SlottedTab[],
  toSettings: (settings: GenericNodeSettings) => settings,
  modelOrView: "model",
});

/* eslint-disable @typescript-eslint/no-explicit-any */
// The return type of the slots is any as per the Vue 3 documentation.
const slots = defineSlots<{
  "left-pane": () => any;
  editor: () => any;
  "settings-title": () => any;
  "settings-content": () => any;
  "right-pane": () => any;
  "code-editor-controls": (props: { showButtonText: boolean }) => any;
  "bottom-pane-status-label": () => any;
  [key: BottomPaneTabSlotName]: (props: { grabFocus: () => void }) => any;
  [key: BottomPaneTabControlsSlotName]: () => any;
}>();
/* eslint-enable @typescript-eslint/no-explicit-any */

const emit = defineEmits(["menu-item-clicked"]);

const editorSplitPane = ref();
const editorSplitPaneRef = useElementBounding(editorSplitPane);

// For SplitPanel compatibility - we'll implement proper collapsing in step 1b
const rightPaneExpanded = ref(true);
const leftPaneExpanded = ref(true);
const bottomPaneExpanded = ref(true);

// All the logic for resizing panes,
const {
  currentPaneSizes,
  shouldCollapseAllPanes,
  showButtonText,
  showHeaderBar,
  doResizePane,
} = useResizeLogic({
  initialPaneSizes: props.initialPaneSizes,
  editorSplitPaneRef,
});

watch(
  shouldCollapseAllPanes,
  (newVal) => {
    if (newVal) {
      rightPaneExpanded.value = false;
      leftPaneExpanded.value = false;
      bottomPaneExpanded.value = false;
    }
  },
  { immediate: true },
);

// Dropping input/output items
const dropEventHandler = ref<(payload: DragEvent) => void>();
const onDropEventHandlerCreated = (handler: (payload: DragEvent) => void) => {
  dropEventHandler.value = handler;
};

// Menu items and settings pane
const showSettingsPage = ref(false);
const onMenuItemClicked = (args: { event: Event; item: SettingsMenuItem }) => {
  showSettingsPage.value = Boolean(args.item.showSettingsPage);

  // TODO: handle click actions for common items here instead of calling the emit
  emit("menu-item-clicked", args);
};

// Convenient to have this computed property for reactive components
const showControlBarDynamic = computed(() => {
  return props.showControlBar && !shouldCollapseAllPanes.value;
});

// We need either filename+language, or provided editor slot
if (props.fileName === null && !useSlots().editor) {
  throw new Error("either fileName or editor slot must be provided");
}

const defaultInputOutputItems = computedAsync<InputOutputModel[]>(async () => {
  if (slots["left-pane"]) {
    return [];
  } else {
    const initialData = await getInitialDataService().getInitialData();
    const initialItems = [
      ...initialData.inputObjects,
      initialData.flowVariables,
    ];

    if (initialData.outputObjects) {
      initialItems.push(...initialData.outputObjects);
    }

    return initialItems;
  }
}, []);
</script>

<template>
  <div class="layout">
    <HeaderBar
      v-if="showHeaderBar"
      :title="title!"
      :menu-items="[...commonMenuItems, ...menuItems]"
      @menu-item-click="onMenuItemClicked"
    />

    <SettingsPage
      v-if="showSettingsPage"
      @close-settings-page="showSettingsPage = false"
    >
      <template #settings-title>
        <slot name="settings-title" />
      </template>
      <template #settings-content>
        <slot name="settings-content" />
      </template>
    </SettingsPage>

    <ConditionalSplitPanel
      :enable="!shouldCollapseAllPanes"
      direction="left"
      use-pixel
      :secondary-snap-size="180"
      :secondary-size="initialPaneSizes.left"
      class="vertical-splitpanel allow-splitter-overflow-right-pane"
      @update:secondary-size="doResizePane($event as number, 'left')"
      v-model:expanded="leftPaneExpanded"
    >
      <template #secondary>
        <slot name="left-pane">
          <InputOutputPane
            :input-output-items="defaultInputOutputItems"
            @drop-event-handler-created="onDropEventHandlerCreated"
          />
        </slot>
      </template>

      <ConditionalSplitPanel
        :enable="!shouldCollapseAllPanes"
        v-model:expanded="bottomPaneExpanded"
        direction="down"
        use-pixel
        :secondary-snap-size="300"
        :secondary-size="initialPaneSizes.bottom"
        class="horizontal-splitpanel allow-splitter-overflow-top-pane"
        @update:secondary-size="doResizePane($event as number, 'bottom')"
      >
        <ConditionalSplitPanel
          :enable="!shouldCollapseAllPanes"
          v-model:expanded="rightPaneExpanded"
          direction="right"
          :secondary-snap-size="220"
          :secondary-size="initialPaneSizes.right"
          use-pixel
          splitter-id="verticalSplitpane"
          data-testid="verticalSplitpane"
          class="vertical-splitpanel allow-splitter-overflow-left-pane"
          @update:secondary-size="doResizePane($event as number, 'right')"
        >
          <div
            ref="editorSplitPane"
            data-testid="editorPane"
            class="editor-pane"
          >
            <div class="editor-and-control-bar">
              <div
                class="multi-editor-container"
                :class="{ 'has-control-bar': showControlBarDynamic }"
              >
                <template v-if="$slots.editor">
                  <div class="editor-slot-container">
                    <slot name="editor" />
                  </div>
                </template>
                <template v-else>
                  <MainEditorPane
                    :file-name="props.fileName!"
                    :language="props.language"
                    :show-control-bar="showControlBarDynamic"
                    :drop-event-handler="dropEventHandler"
                    :to-settings="props.toSettings"
                    :model-or-view="props.modelOrView"
                  />
                </template>
                <div class="run-button-panel">
                  <CodeEditorControlBar
                    v-if="showControlBarDynamic"
                    :current-pane-sizes="currentPaneSizes"
                    :show-button-text
                  >
                    <template #controls>
                      <slot name="code-editor-controls" :show-button-text />
                    </template>
                  </CodeEditorControlBar>
                </div>
              </div>
            </div>
          </div>
          <template #secondary>
            <div data-testid="rightPane" class="right-pane">
              <slot name="right-pane" />
            </div>
          </template>
        </ConditionalSplitPanel>
        <template #secondary>
          <ScriptingEditorBottomPane
            :slotted-tabs="additionalBottomPaneTabContent"
          >
            <template
              v-for="tab in additionalBottomPaneTabContent"
              #[tab.slotName]="{ grabFocus }"
            >
              <slot :name="tab.slotName" :grab-focus="grabFocus" />
            </template>
            <template
              v-for="tab in additionalBottomPaneTabContent"
              #[tab.associatedControlsSlotName!]
            >
              <slot
                v-if="tab.associatedControlsSlotName"
                :name="tab.associatedControlsSlotName"
              />
            </template>
            <template #status-label>
              <slot name="bottom-pane-status-label" />
            </template>
          </ScriptingEditorBottomPane>
        </template>
      </ConditionalSplitPanel>
    </ConditionalSplitPanel>
  </div>
</template>

<style lang="postcss" scoped>
/* @import url("@/components/splitterstyles.pcss"); */

.layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh);
  width: 100%;
  flex-grow: 0;
  overflow: hidden;
  position: relative;
}

.editor-and-control-bar {
  height: 100%;
  display: flex;
  flex-direction: column;

  & .multi-editor-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex-grow: 1;
    min-height: 0;

    & .editor-slot-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      flex-grow: 1;
    }

    & .run-button-panel {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      height: fit-content;
      margin: 0;
      background-color: var(--knime-gray-light-semi);
      background-clip: padding-box;
    }
  }
}

.editor-pane {
  height: 100%;
  width: 100%;
}

.scrollable-y {
  overflow-y: auto;
}

.allow-splitter-overflow-right-pane {
  overflow: visible;
  min-height: 0;
  min-width: 0;

  &:deep(> .splitter-pane.right-pane) {
    overflow: visible;
    min-width: 0;
    min-height: 0;
  }
}

.allow-splitter-overflow-left-pane {
  overflow: visible;
  min-width: 0;
  min-height: 0;

  &:deep(> .splitter-pane.left-pane) {
    overflow: visible;
    min-width: 0;
    min-height: 0;
  }
}

.allow-splitter-overflow-top-pane {
  overflow: visible;
  min-height: 0;
  min-width: 0;

  &:deep(> .splitter-pane.top-pane) {
    overflow: visible;
    min-height: 0;
    min-width: 0;
  }
}

.vertical-splitpanel,
.horizontal-splitpanel {
  height: 100%;
  width: 100%;
}

.right-pane {
  background-color: var(--knime-gray-ultra-light);
  height: 100%;
}
</style>
