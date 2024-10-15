import { useWindowSize } from "@vueuse/core";
import { computed, type Ref } from "vue";

export type PaneSizesPercent = {
  left: number;
  right: number;
  bottom: number;
};

type PaneSizesPixels = {
  leftPanelWidthPx: number;
  rightPanelWidthPx: number;
  windowWidthPx: number;
};

/**
 * default sizes and min/maxes as a % of popup window width.
 *
 * Can convert to nominal sizes to pass to splitpanes library using the
 * PercentageConversionHelper.
 *
 * @see PercentageConversionHelper
 */
export const SIZE_SETTINGS = {
  LEFT_PANEL_MAXW_PX: 400,
  LEFT_PANEL_MINW_PX: 180,
  LEFT_PANEL_DEFAULTW_PERCENT: 15,
  RIGHT_PANEL_DEFAULTW_PERCENT: 32,
  BOTTOM_PANEL_DEFAULTH_PERCENT: 20,
};

const COLLAPSE_SETTINGS = {
  leftPanelShouldCollapse: (
    paneSizes: PaneSizesPixels,
    rightPanelMinWidthPx: number,
  ) =>
    paneSizes.windowWidthPx <
    560 + SIZE_SETTINGS.LEFT_PANEL_MINW_PX + rightPanelMinWidthPx,
  rightPanelShouldCollapse: (
    paneSizes: PaneSizesPixels,
    rightPanelMinWidthPx: number,
  ) =>
    paneSizes.windowWidthPx <
    560 + SIZE_SETTINGS.LEFT_PANEL_MINW_PX + rightPanelMinWidthPx,
  allPanelsShouldCollapse: (
    paneSizes: PaneSizesPixels,
    rightPanelMinWidthPx: number,
  ) =>
    COLLAPSE_SETTINGS.leftPanelShouldCollapse(
      paneSizes,
      rightPanelMinWidthPx,
    ) &&
    COLLAPSE_SETTINGS.rightPanelShouldCollapse(paneSizes, rightPanelMinWidthPx),
};

const clamp = (x: number, min: number, max: number) =>
  Math.min(Math.max(x, min), max);

/**
 * Utilities to convert between the 'nominal' pane sizes we pass to splitpanes and the
 * actual window percentages.
 *
 * The pane layout looks like this, which means that percentages given to the splitpanes
 * library don't straightforwardly correspond to real percentage sizes. With a bit of maths,
 * we can do the conversion.
 *
 * root: {
 *   width: "100%",
 *   children: {
 *     left: {
 *       width: "X1%",
 *       children: {},
 *     },
 *     main: {
 *       width: "100-X1%",
 *       children: {
 *         top: {
 *           height: "100-X2%",
 *           children: {
 *             editor: {
 *               width: "100-X3%",
 *             },
 *             right: {
 *               children: {},
 *               width: "X3%",
 *             },
 *           },
 *         },
 *         bottom: {
 *           height: "X2%",
 *           children: {},
 *         },
 *       },
 *     },
 *   },
 * },
 *
 * Let X1, X2, X3 be the nominal percentages we pass to splitpanes for the 'main', 'bottom', and 'right' panes.
 * Let Y1, Y2, Y3 be their respective window width/height percentages.
 * Then we have:
 * Y1 = X1
 * Y2 = X2
 * Y3 = X3 · (100 - X1) / 100
 * And conversely:
 * X3 = Y3 · 100 / (100 - Y1)
 */
const PercentageConversionHelper = {
  /**
   * Convert the right pane size from nominal to window percentage.
   * @param right the right pane size as a nominal percentage.
   * @param left the left pane size as a nominal percentage.
   * @returns the right pane size as a percentage of the window width.
   */
  convertRightFromNominalToWindowPercentage: (right: number, left: number) =>
    right * ((100 - left) / 100),
  /**
   * Convert the right pane size from window to nominal percentage.
   * @param right the right pane size as a percentage of the window.
   * @param left the left pane size as a percentage of the window.
   * @returns the right pane size as a nominal percentage width.
   */
  convertRightFromWindowToNominalPercentage: (right: number, left: number) =>
    right * (100 / (100 - left)),
  /**
   * Convert the left pane size from nominal to window percentage.
   * @param left
   * @returns
   */
  convertLeftFromNominalToWindowPercentage: (left: number) => left,
  /**
   * Convert the left pane size from window to nominal percentage.
   * @param left
   * @returns
   */
  convertLeftFromWindowToNominalPercentage: (left: number) => left,
  /**
   * Convert nominal pane sizes to window percentages.
   * @param nominalPaneSizes the nominal pane sizes that could be passed to splitpanes.
   * @returns the sizes as a percentage of window size.
   */
  convertNominalPercentagesToWindowPercentages: (
    nominalPaneSizes: PaneSizesPercent,
  ): PaneSizesPercent => ({
    ...nominalPaneSizes,
    right: PercentageConversionHelper.convertRightFromNominalToWindowPercentage(
      nominalPaneSizes.right,
      nominalPaneSizes.left,
    ),
  }),
  /**
   * Convert window percentages to nominal pane sizes.
   * @param windowPaneSizes the sizes as a percentage of window size.
   * @returns the nominal pane sizes that could be passed to splitpanes.
   */
  convertWindowPercentSizesToNominalPercentages: (
    windowPaneSizes: PaneSizesPercent,
  ): PaneSizesPercent => ({
    ...windowPaneSizes,
    right: PercentageConversionHelper.convertRightFromWindowToNominalPercentage(
      windowPaneSizes.right,
      windowPaneSizes.left,
    ),
  }),
  /**
   * Conver real window percentages to size in pixels.
   * @param windowPaneSizes
   * @param windowWidth
   * @returns
   */
  convertWindowPercentSizesToPixels: (
    windowPaneSizes: PaneSizesPercent,
    windowWidth: number,
  ): PaneSizesPixels => ({
    leftPanelWidthPx: (windowPaneSizes.left * windowWidth) / 100,
    rightPanelWidthPx: (windowPaneSizes.right * windowWidth) / 100,
    windowWidthPx: windowWidth,
  }),
};

/**
 * ALL RETURNED PERCENTAGES ARE NOMINAL PERCENTAGES, NOT WINDOW PERCENTAGES.
 *
 * Given the nominal percentages of the pane sizes, this hook calculates the actual
 * sizes of the left and right panes, accounting for collapse and extrema.
 *
 * It also returns whether the left, right, or all panels should collapse, as well
 * as the extreme sizes of the left and right panels.
 *
 * Since the returned values are in nominal percentages, they can be passed directly
 * to the splitpanes library without any further conversions.
 *
 * @param paneSizesNominal nominal percentages of the pane sizes.
 * @param rightPaneWidthLimitsPixels the min and max widths of the right pane in pixels.
 * @returns
 */
export const useResizeLogic = (
  paneSizesNominal: Ref<PaneSizesPercent>,
  rightPaneWidthLimitsPixels: {
    min: number;
    max: number;
  },
) => {
  // set up a window resize observer, since all min/max widths are in % for splitpanes
  const { width: windowWidth } = useWindowSize();

  const paneSizesWindowPercentage = computed(() =>
    PercentageConversionHelper.convertNominalPercentagesToWindowPercentages(
      paneSizesNominal.value,
    ),
  );

  /*
   * Left panel extreme sizes (nominal percentages).
   */
  const leftPanelMaxWidthPercent = computed(() =>
    PercentageConversionHelper.convertLeftFromWindowToNominalPercentage(
      (100 * SIZE_SETTINGS.LEFT_PANEL_MAXW_PX) / windowWidth.value,
    ),
  );
  const leftPanelMinWidthPercent = computed(() =>
    PercentageConversionHelper.convertLeftFromWindowToNominalPercentage(
      (100 * SIZE_SETTINGS.LEFT_PANEL_MINW_PX) / windowWidth.value,
    ),
  );

  /*
   * Right panel extreme sizes (nominal percentages).
   */
  const rightPanelMaxWidthPercent = computed(() =>
    PercentageConversionHelper.convertRightFromWindowToNominalPercentage(
      100 * (rightPaneWidthLimitsPixels.max / windowWidth.value),
      paneSizesWindowPercentage.value.left,
    ),
  );
  const rightPanelMinWidthPercent = computed(() =>
    PercentageConversionHelper.convertRightFromWindowToNominalPercentage(
      100 * (rightPaneWidthLimitsPixels.min / windowWidth.value),
      paneSizesWindowPercentage.value.left,
    ),
  );

  /*
   * Collapse logic (booleans).
   */
  const leftPanelShouldCollapse = computed(() =>
    COLLAPSE_SETTINGS.leftPanelShouldCollapse(
      PercentageConversionHelper.convertWindowPercentSizesToPixels(
        paneSizesWindowPercentage.value,
        windowWidth.value,
      ),
      rightPaneWidthLimitsPixels.min,
    ),
  );
  const rightPanelShouldCollapse = computed(() =>
    COLLAPSE_SETTINGS.rightPanelShouldCollapse(
      PercentageConversionHelper.convertWindowPercentSizesToPixels(
        paneSizesWindowPercentage.value,
        windowWidth.value,
      ),
      rightPaneWidthLimitsPixels.min,
    ),
  );
  const allPanelsShouldCollapse = computed(() =>
    COLLAPSE_SETTINGS.allPanelsShouldCollapse(
      PercentageConversionHelper.convertWindowPercentSizesToPixels(
        paneSizesWindowPercentage.value,
        windowWidth.value,
      ),
      rightPaneWidthLimitsPixels.min,
    ),
  );

  /*
   * Actual nominal % sizes for left and right panels, accounting for collapse and extrema.
   */
  const leftPanelCorrectedWidthPercent = computed(() =>
    leftPanelShouldCollapse.value || allPanelsShouldCollapse.value
      ? 0
      : clamp(
          paneSizesNominal.value.left,
          leftPanelMinWidthPercent.value,
          leftPanelMaxWidthPercent.value,
        ),
  );
  const rightPanelCorrectedWidthPercent = computed(() =>
    rightPanelShouldCollapse.value || allPanelsShouldCollapse.value
      ? 0
      : clamp(
          paneSizesNominal.value.right,
          rightPanelMinWidthPercent.value,
          rightPanelMaxWidthPercent.value,
        ),
  );

  // All of these will be in NOMINAL percentages, not window percentages.
  return {
    leftPanelMaxWidthPercent,
    leftPanelMinWidthPercent,
    rightPanelMaxWidthPercent,
    rightPanelMinWidthPercent,
    leftPanelShouldCollapse,
    rightPanelShouldCollapse,
    allPanelsShouldCollapse,
    leftPanelCorrectedWidthPercent,
    rightPanelCorrectedWidthPercent,
  };
};
