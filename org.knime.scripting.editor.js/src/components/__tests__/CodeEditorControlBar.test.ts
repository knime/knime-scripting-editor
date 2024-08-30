import { describe, beforeEach, afterEach, it, vi, expect } from "vitest";
import CodeEditorControlBar from "../CodeEditorControlBar.vue";
import { flushPromises, mount } from "@vue/test-utils";
import { getInitialDataService } from "@/initial-data-service";
import { DEFAULT_INITIAL_DATA } from "@/initial-data-service-browser-mock";
import type { PaneSizes } from "../utils/paneSizes";

vi.mock("@/scripting-service");
vi.mock("@/initial-data-service", () => ({
  getInitialDataService: vi.fn(() => ({
    getInitialData: vi.fn(() => Promise.resolve(DEFAULT_INITIAL_DATA)),
  })),
}));

const doMount = (
  args: {
    props?: Partial<InstanceType<typeof CodeEditorControlBar>["$props"]>;
    slots?: any;
  } = {
    props: {
      currentPaneSizes: { left: 0, right: 0, bottom: 0 } satisfies PaneSizes,
    },
    slots: {},
  },
) => {
  return mount(CodeEditorControlBar, {
    // @ts-ignore
    props: args.props,
    slots: args.slots,
  });
};

describe("CodeEditorControlBar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.resetModules();
  });

  it("hides ai button if ai assistant disabled", async () => {
    vi.mocked(getInitialDataService).mockReturnValue({
      getInitialData: vi.fn(() =>
        Promise.resolve({
          ...DEFAULT_INITIAL_DATA,
          kAiConfig: {
            ...DEFAULT_INITIAL_DATA.kAiConfig,
            codeAssistantEnabled: false,
          },
        }),
      ),
    });

    const wrapper = doMount();
    await flushPromises();

    expect(wrapper.findComponent({ ref: "aiButton" }).exists()).toBeFalsy();
  });

  it("ai button opens ai bar", async () => {
    const wrapper = doMount();
    await flushPromises();

    const button = wrapper.find(".ai-button");

    // aiBar should be turned off at mount
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeFalsy();
    await button.trigger("click");

    // then it should be visible
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeTruthy();
  });

  it("ai button closes ai bar if it is opened", async () => {
    const wrapper = doMount();
    await flushPromises();
    const button = wrapper.find(".ai-button");

    await button.trigger("click");
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeTruthy();
    await button.trigger("click");
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeFalsy();
  });

  it("ai bar is closed on click outside of ai bar", async () => {
    const wrapper = doMount();
    await flushPromises();
    const button = wrapper.find(".ai-button");
    await wrapper.vm.$nextTick();
    await button.trigger("click");
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeTruthy();
    window.dispatchEvent(new Event("click")); // emulate click outside
    await wrapper.vm.$nextTick();
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeFalsy();
  });

  it("ai bar is not closed on click inside of ai bar", async () => {
    const wrapper = doMount();
    await flushPromises();
    const button = wrapper.find(".ai-button");
    await wrapper.vm.$nextTick();
    await button.trigger("click");
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeTruthy();
    await wrapper.find("[data-testid='ai-bar-popup']").trigger("click");
    expect(wrapper.find("[data-testid='ai-bar-popup']").exists()).toBeTruthy();
  });

  it("test aiButton is available if inputs and code assistance are available", async () => {
    const wrapper = doMount();
    await flushPromises();
    const button = wrapper.findComponent({ ref: "aiButton" });

    expect(button.props().disabled).toBeFalsy();
  });

  it("test aiButton is disabled if inputs are not available", async () => {
    vi.mocked(getInitialDataService).mockReturnValue({
      getInitialData: vi.fn(() =>
        Promise.resolve({
          ...DEFAULT_INITIAL_DATA,
          inputsAvailable: false,
        }),
      ),
    });

    const wrapper = doMount();
    await flushPromises();
    const button = wrapper.findComponent({ ref: "aiButton" });

    expect(button.props().disabled).toBeTruthy();
  });

  it("test aiButton is enabled even if code assistant is not installed", async () => {
    vi.mocked(getInitialDataService().getInitialData).mockResolvedValue({
      ...DEFAULT_INITIAL_DATA,
      kAiConfig: {
        ...DEFAULT_INITIAL_DATA.kAiConfig,
        codeAssistantInstalled: false,
      },
    });

    const wrapper = doMount();
    await flushPromises();
    const button = wrapper.findComponent({ ref: "aiButton" });

    expect(button.props().disabled).toBeFalsy();
  });
});
