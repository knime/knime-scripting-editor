import { computed, reactive, watch } from "vue";
import type { UseElementBoundingReturn } from "@vueuse/core";

import {
  MIN_WIDTH_FOR_SHOWING_BUTTON_TEXT,
  type PaneSizes,
} from "@/components/utils/paneSizes";
import { displayMode } from "@/display-mode";

export const useResizeLogic = ({
  initialPaneSizes,
  editorSplitPaneRef,
}: {
  initialPaneSizes: PaneSizes;
  editorSplitPaneRef: UseElementBoundingReturn;
}) => {
  const largeModePaneSizes = reactive<PaneSizes>({
    left: initialPaneSizes.left,
    right: initialPaneSizes.right,
    bottom: initialPaneSizes.bottom,
  });

  const shouldCollapseAllPanes = computed(() => displayMode.value === "small");

  const currentPaneSizes = computed(() => {
    if (shouldCollapseAllPanes.value) {
      return {
        left: 0,
        right: 0,
        bottom: 0,
      };
    } else {
      return {
        ...largeModePaneSizes,
      };
    }
  });

  const showButtonText = computed(
    () =>
      displayMode.value !== "small" &&
      editorSplitPaneRef.width.value >= MIN_WIDTH_FOR_SHOWING_BUTTON_TEXT,
  );
  const doResizePane = (size: number, pane: keyof PaneSizes) => {
    largeModePaneSizes[pane] = size;
  };

  const showHeaderBar = computed(() => displayMode.value !== "small");

  return {
    shouldCollapseAllPanes,
    showButtonText,
    currentPaneSizes,
    showHeaderBar,
    doResizePane,
  };
};
