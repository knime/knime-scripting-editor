<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from "vue";
import InputOutputItem, {
  INPUT_OUTPUT_DRAG_EVENT_ID,
  type InputOutputModel,
} from "./InputOutputItem.vue";
import { getScriptingService } from "@/scripting-service";
import { useInputOutputSelectionStore } from "@/store/io-selection";
import { useMainCodeEditorStore } from "@/editor";

const emit =
  defineEmits<
    (
      e: "drop-event-handler-created",
      dropEventHandler: (payload: DragEvent) => void,
    ) => void
  >();

const inputOutputItems: Ref<InputOutputModel[]> = ref([]);
const inputOutputSelectionStore = useInputOutputSelectionStore();

const selectedItemIndex = ref<number>(0);
const selectableItems = ref();

const fetchInputOutputObjects = async (
  method: "getInputObjects" | "getOutputObjects",
) => {
  const items = await getScriptingService()[method]();
  if (items) {
    inputOutputItems.value.push(...items);
  }
};

const fetchFlowVariables = async () => {
  const item = await getScriptingService().getFlowVariableInputs();
  if (item) {
    inputOutputItems.value.push(item);
  }
};

// Directive that removes element plus all children from tab flow. We will apply to all InputOutputItems.
const vRemoveFromTabFlow = {
  mounted: (thisElement: Element) => {
    thisElement.setAttribute("tabindex", "-1");

    const focusableElements = thisElement.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
    );
    focusableElements.forEach((childElement: Element) => {
      childElement.setAttribute("tabindex", "-1");
    });
  },
};

const mainEditorState = useMainCodeEditorStore();

const dropEventHandler = (event: DragEvent) => {
  // If source is not input/output element, do nothing
  if (event.dataTransfer?.getData("eventId") !== INPUT_OUTPUT_DRAG_EVENT_ID) {
    return;
  }

  // check if an import is required for the selected item
  const requiredImport =
    inputOutputSelectionStore.selectedItem?.requiredImport ?? null;

  if (
    requiredImport &&
    !mainEditorState.value?.text.value.includes(requiredImport)
  ) {
    // wait until monaco has processed drop event
    const unwatch = watch(
      () => mainEditorState.value?.text.value,
      (newScript) => {
        unwatch();
        mainEditorState.value!.text.value = `${requiredImport}\n${newScript}`;
      },
    );
  }

  // clear selection
  delete inputOutputSelectionStore.selectedItem;
};

onMounted(async () => {
  await fetchInputOutputObjects("getInputObjects");
  await fetchFlowVariables();
  await fetchInputOutputObjects("getOutputObjects");
  emit("drop-event-handler-created", dropEventHandler);
});

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "ArrowDown") {
    selectedItemIndex.value =
      (selectedItemIndex.value + 1) % inputOutputItems.value.length;
  } else if (e.key === "ArrowUp") {
    selectedItemIndex.value =
      (selectedItemIndex.value - 1 + inputOutputItems.value.length) %
      inputOutputItems.value.length;
  } else if (["Enter", " "].includes(e.key)) {
    selectableItems.value[selectedItemIndex.value].toggleExpansion();
  } else if (e.key === "ArrowRight") {
    selectableItems.value[selectedItemIndex.value].setExpanded(true);
    e.preventDefault(); // Stop accidental scrolling
  } else if (e.key === "ArrowLeft") {
    selectableItems.value[selectedItemIndex.value].setExpanded(false);
    e.preventDefault(); // Stop accidental scrolling
  } else if (e.key === "Home") {
    selectedItemIndex.value = 0;
  } else if (e.key === "End") {
    selectedItemIndex.value = inputOutputItems.value.length - 1;
  }
};
</script>

<template>
  <div class="in-out-container" tabindex="0" @keydown="handleKeyDown">
    <InputOutputItem
      v-for="(inputOutputItem, i) in inputOutputItems"
      :key="inputOutputItem.name"
      ref="selectableItems"
      v-remove-from-tab-flow
      :input-output-item="inputOutputItem"
      :class="{ 'key-selected': i === selectedItemIndex }"
      data-key-focus-paintable
      @click="selectedItemIndex = i"
    />
  </div>
</template>

<style scoped lang="postcss">
.in-out-container {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.in-out-container:focus-within :deep(.key-focus-painted.key-selected::after) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-shadow: inset 0 0 3px 3px var(--knime-cornflower);
  pointer-events: none;
  z-index: 1;
}
</style>
