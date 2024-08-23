import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getScriptingService } from "@/scripting-service";
import {
  clearPromptResponseStore,
  setActiveEditorStoreForAi,
  usePromptResponseStore,
} from "@/store/ai-bar";
import AiBar from "../AiBar.vue";
import AiSuggestion from "../AiSuggestion.vue";
import { getInitialDataService } from "@/initial-data-service";
import { ref } from "vue";
import { DEFAULT_INITIAL_DATA } from "@/initial-data-service-browser-mock";
import { DEFAULT_INITIAL_SETTINGS } from "@/settings-service-browser-mock";
import { getSettingsService } from "@/settings-service";
import InfinityLoadingBar from "@/components/InfinityLoadingBar.vue";
import type { PaneSizes } from "@/components/utils/paneSizes";

vi.mock("@/scripting-service");
vi.mock("@/editor");
vi.mock("@/initial-data-service", () => ({
  getInitialDataService: vi.fn(() => ({
    getInitialData: vi.fn(() => Promise.resolve(DEFAULT_INITIAL_DATA)),
  })),
}));
vi.mock("@/settings-service", () => ({
  getSettingsService: vi.fn(() => ({
    registerSettingsGetterForApply: vi.fn(() => Promise.resolve()),
    getSettings: vi.fn(() => Promise.resolve(DEFAULT_INITIAL_SETTINGS)),
  })),
}));

const doMount = (
  args: {
    props?: Partial<InstanceType<typeof AiBar>["$props"]>;
    slots?: any;
  } = {
    props: {
      currentPaneSizes: { left: 0, right: 0, bottom: 0 } satisfies PaneSizes,
      showAiBarContainer: true,
    },
    slots: {},
  },
) => {
  return mount(AiBar, {
    // @ts-ignore I'm not sure why this line gives a type error, because it's fine
    props: args.props,
    slots: args.slots,
  });
};

describe("AiBar", () => {
  beforeEach(() => {
    vi.resetModules();
    clearPromptResponseStore();
    setActiveEditorStoreForAi({
      text: ref(""),
      editorModel: "myEditorModel",
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders chat controls if no prompt is active", async () => {
    const bar = doMount();
    await flushPromises();
    expect(bar.find(".textarea").exists()).toBeTruthy();
    expect(bar.findComponent({ ref: "sendButton" }).exists()).toBeTruthy();
  });

  it("test aiBar success", async () => {
    const bar = doMount();
    await flushPromises();
    (bar.vm as any).showDisclaimer = false;
    await bar.vm.$nextTick();
    const message = "Do something!";
    // write to textarea
    const textarea = bar.find("textarea");
    textarea.setValue(message);

    const scriptingService = getScriptingService();
    // vi mocked gives type support for mocked vi.fn()
    vi.mocked(scriptingService.sendToService).mockClear();
    vi.mocked(scriptingService.sendToService).mockReturnValueOnce(
      Promise.resolve({
        code: JSON.stringify({ code: "import happy.hacking" }),
        status: "SUCCESS",
      }),
    );
    // click Send Button
    const sendButton = bar.findComponent({ ref: "sendButton" });
    sendButton.vm.$emit("click");

    // expect scripting service to be called with
    expect(scriptingService.sendToService).toHaveBeenCalledOnce();
    expect(scriptingService.sendToService).toBeCalledWith("suggestCode", [
      message,
      "",
    ]);
  });

  it("test aiBar with empty input disables button", async () => {
    const bar = doMount();
    await flushPromises();

    // click Send Button
    const sendButton = bar.findComponent({ ref: "sendButton" });

    // @ts-ignore
    expect(sendButton.isDisabled).toBeTruthy();
  });

  it("test aiBar abort request", async () => {
    const bar = doMount();
    await flushPromises();
    const scriptingService = getScriptingService();

    vi.mocked(scriptingService.sendToService).mockClear();
    vi.mocked(scriptingService.sendToService).mockReturnValueOnce(
      Promise.resolve({
        code: JSON.stringify({ code: "import happy.hacking" }),
        status: "ERROR",
        error: "oh shit",
      }),
    );
    const message = "Do something!";
    const textarea = bar.find("textarea");
    textarea.setValue(message);
    const sendButton = bar.findComponent({ ref: "sendButton" });
    await sendButton.vm.$emit("click");
    const abortButton = bar.findComponent({ ref: "abortButton" });
    await abortButton.vm.$emit("click");

    expect(scriptingService.sendToService).toHaveBeenCalledTimes(2);
    expect(scriptingService.sendToService).toBeCalledWith(
      "abortSuggestCodeRequest",
    );
  });

  it("show diff editor when code suggestion is available", async () => {
    const bar = doMount();
    expect(bar.findComponent(AiSuggestion).exists()).toBeFalsy();
    await (bar.vm as any).handleCodeSuggestion({
      code: JSON.stringify({ code: "some code" }),
      status: "SUCCESS",
    });
    expect(bar.findComponent(AiSuggestion).exists()).toBeTruthy();
  });

  it("show diff editor when previous prompt is available", () => {
    usePromptResponseStore().promptResponse = {
      message: { role: "reply", content: "blah" },
      suggestedCode: "code",
    };

    const bar = doMount();
    expect(bar.findComponent(AiSuggestion).exists()).toBeTruthy();
  });

  it("show disclaimer on first startup", async () => {
    const bar = doMount();
    await flushPromises();
    (bar.vm as any).showDisclaimer = true;
    await bar.vm.$nextTick();
    const disclaimer = bar.find(".disclaimer-container");
    expect(disclaimer.exists()).toBeTruthy();
  });

  it("show login button if not logged in yet", async () => {
    vi.mocked(getScriptingService().isLoggedIntoHub).mockResolvedValue(false);

    const bar = doMount();
    await flushPromises();

    const downloadNotification = bar.findAll(".notification-bar").at(0);
    const loginNotification = bar.findAll(".notification-bar").at(1);

    expect(downloadNotification?.exists()).toBeTruthy();
    expect(loginNotification?.exists()).toBeTruthy();
    expect(downloadNotification?.isVisible()).toBeFalsy();
    expect(loginNotification?.isVisible()).toBeTruthy();

    const loginButton = loginNotification?.find(".notification-button");

    expect(loginButton?.exists()).toBeTruthy();
    expect(loginButton?.text()).toBe(
      `Login to ${DEFAULT_INITIAL_DATA.kAiConfig.hubId}`,
    );
  });

  it("show install button if not available", async () => {
    vi.mocked(getInitialDataService).mockReturnValue({
      getInitialData: vi.fn(() =>
        Promise.resolve({
          ...DEFAULT_INITIAL_DATA,
          kAiConfig: {
            ...DEFAULT_INITIAL_DATA.kAiConfig,
            codeAssistantInstalled: false,
          },
        }),
      ),
    });

    const bar = doMount(AiBar);
    await flushPromises();

    const downloadNotification = bar.findAll(".notification-bar").at(0);
    const loginNotification = bar.findAll(".notification-bar").at(1);

    expect(downloadNotification?.exists()).toBeTruthy();
    expect(loginNotification?.exists()).toBeTruthy();
    expect(downloadNotification?.isVisible()).toBeTruthy();
    expect(loginNotification?.isVisible()).toBeFalsy();

    const downloadButton = downloadNotification?.find(".notification-button");

    expect(downloadButton?.exists()).toBeTruthy();
    expect(downloadButton?.text()).toBe("Download from KNIME Hub");
  });

  it("show flow variable message if readonly", async () => {
    vi.mocked(getSettingsService).mockReturnValue({
      getSettings: vi.fn(() =>
        Promise.resolve({
          ...DEFAULT_INITIAL_SETTINGS,
          scriptUsedFlowVariable: "myVar",
          settingsAreOverriddenByFlowVariable: true,
          script: "myScript",
        }),
      ),
      registerSettingsGetterForApply: vi.fn(() => Promise.resolve()),
    });

    const bar = doMount(AiBar);
    await flushPromises();
    const downloadNotification = bar.findAll(".notification-bar").at(0);
    const loginNotification = bar.findAll(".notification-bar").at(1);
    expect(downloadNotification?.isVisible()).toBeFalsy();
    expect(loginNotification?.isVisible()).toBeFalsy();

    const readonlyNotification = bar.findAll(".notification-bar").at(2);
    expect(readonlyNotification?.exists()).toBeTruthy();
    expect(readonlyNotification?.isVisible()).toBeTruthy();
    expect(readonlyNotification?.text()).toBe(
      "Script is overwritten by a flow variable.",
    );
  });

  it("neither install nor login buttons are visible if ai assistant is ready to be used", async () => {
    const bar = doMount();
    await flushPromises();
    const downloadNotification = bar.findAll(".notification-bar").at(0);
    const loginNotification = bar.findAll(".notification-bar").at(1);
    expect(downloadNotification?.exists()).toBeTruthy();
    expect(loginNotification?.exists()).toBeTruthy();
    expect(downloadNotification?.isVisible()).toBeFalsy();
    expect(loginNotification?.isVisible()).toBeFalsy();
  });

  it("shows abort button and loading bar in waiting state", async () => {
    const bar = doMount();
    await flushPromises();
    const message = "Do something!";
    // write to textarea
    const textarea = bar.find("textarea");
    textarea.setValue(message);

    const scriptingService = getScriptingService();
    // vi mocked gives type support for mocked vi.fn()
    vi.mocked(scriptingService.sendToService).mockClear();
    vi.mocked(scriptingService.sendToService).mockReturnValueOnce(
      Promise.resolve({
        code: JSON.stringify({ code: "import happy.hacking" }),
        status: "SUCCESS",
      }),
    );

    expect(bar.findComponent(InfinityLoadingBar).exists()).toBeFalsy();
    expect(bar.find(".abort-button").exists()).toBeFalsy();

    const sendButton = bar.findComponent({ ref: "sendButton" });
    await sendButton.vm.$emit("click");

    expect(bar.findComponent(InfinityLoadingBar).exists()).toBeTruthy();
    expect(bar.find(".abort-button").exists()).toBeTruthy();
  });

  it("aborts active request if ai bar is dismissed", async () => {
    const bar = doMount();
    await flushPromises();
    (bar.vm as any).status = "waiting";
    bar.unmount();
    expect(getScriptingService().sendToService).toHaveBeenCalledWith(
      "abortSuggestCodeRequest",
    );
  });

  it("does not abort request if ai bar is dismissed and there is no active request", async () => {
    const bar = doMount();
    await flushPromises();
    bar.unmount();
    expect(getScriptingService().sendToService).not.toHaveBeenCalledWith(
      "abortSuggestCodeRequest",
    );
  });

  it("displays slotted content", () => {
    const bar = doMount({
      slots: {
        "ai-button": "<div id='test-id'>Test</div>",
      },
    });
    expect(bar.find("#test-id").exists()).toBeTruthy();
  });
});
