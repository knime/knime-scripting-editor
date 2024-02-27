import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import sleep from "webapps-common/util/sleep";

import { DialogService, JsonDataService } from "@knime/ui-extension-service";
import type { ScriptingServiceType } from "@/scripting-service";

vi.mock("monaco-editor");

vi.mock("@knime/ui-extension-service", () => ({
  JsonDataService: vi.fn(),
  DialogService: vi.fn(),
}));

const lock = <T = void>() => {
  let resolve: (resolvedValue: T) => void = () => {};
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe("scripting-service", () => {
  let _jsonDataService: any,
    _dialogService: any,
    _resolveEventPoller: () => void;

  const getScriptingService = async (stopEventPoller = true) => {
    const scriptingService = (
      await import("../scripting-service")
    ).getScriptingService() as ScriptingServiceType & {
      stopEventPoller: () => void;
    };

    if (stopEventPoller) {
      scriptingService.stopEventPoller();
      _resolveEventPoller();
    }
    return scriptingService;
  };

  beforeEach(() => {
    // Make sure the module is reloaded to reset the singleton instance
    vi.resetModules();

    // Mock the services
    const { promise: blockEventPoller, resolve: resolveEventPoller } = lock();
    _jsonDataService = {
      registerDataGetter: vi.fn(() => {}),
      initialData: vi.fn(() => ({ script: "foo" })),
      data: vi.fn((options: { method: string }) =>
        options.method === "getEvent" ? blockEventPoller : Promise.resolve(),
      ),
      applyData: vi.fn(() => {}),
    };
    _dialogService = {
      setApplyListener: vi.fn(),
    };
    JsonDataService.getInstance = vi.fn().mockResolvedValue(_jsonDataService);
    DialogService.getInstance = vi.fn().mockResolvedValue(_dialogService);
    _resolveEventPoller = resolveEventPoller;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("waits for knime service initialization", async () => {
    const sendToServiceResolved = vi.fn();
    const sendToServiceRejected = vi.fn();

    // Replace the mock such that we can block the initialization
    const { promise, resolve } = lock<JsonDataService>();
    JsonDataService.getInstance = vi.fn().mockReturnValue(promise);
    const sendToServicePromise = (await getScriptingService())
      .sendToService("dummy")
      .then(() => {
        sendToServiceResolved();
      })
      .catch(() => {
        sendToServiceRejected();
      });
    await sleep(20);
    expect(sendToServiceResolved).not.toHaveBeenCalled();
    expect(sendToServiceRejected).not.toHaveBeenCalled();

    // Now the initialization should be resolved
    resolve(_jsonDataService);

    await sendToServicePromise;
    expect(sendToServiceResolved).toHaveBeenCalled();
    expect(sendToServiceRejected).not.toHaveBeenCalled();
  });

  it("sends requests to the JsonDataService", async () => {
    await (await getScriptingService()).sendToService("dummy", ["foo", "bar"]);
    expect(_jsonDataService.data).toHaveBeenCalledWith({
      method: "dummy",
      options: ["foo", "bar"],
    });
  });

  describe("settings", () => {
    it("gets initial data from the JsonDataService", async () => {
      const initalSettings = await (
        await getScriptingService()
      ).getInitialSettings();
      expect(initalSettings).toEqual({ script: "foo" });
      expect(_jsonDataService.initialData).toHaveBeenCalledOnce();
      expect(_jsonDataService.initialData).toHaveBeenCalledWith();
    });
  });

  describe("events handler", () => {
    it("polls events from the service", async () => {
      // Return one event
      _jsonDataService.data.mockImplementationOnce(
        ({ method }: { method: string }) => {
          expect(method).toBe("getEvent");
        },
      );

      // Scripting service initialization starts the event poller
      const scriptingService = await getScriptingService(false);

      // Wait for the event poller to fetch the event
      await sleep(10);
      expect(_jsonDataService.data).toHaveBeenCalledWith({
        method: "getEvent",
      });

      scriptingService.stopEventPoller();
      _resolveEventPoller();
    });

    it("calls the correct event handler", async () => {
      const scriptingService = await getScriptingService(false);

      // Event handler for foo (the first event resolves the promise)
      const { promise: eventFooPromise, resolve: resolveFooEvent } = lock();
      const eventHandlerFoo = vi.fn(resolveFooEvent);
      scriptingService.registerEventHandler("foo", eventHandlerFoo);

      // Event handler for bar (the first event resolves the promise)
      const { promise: eventBarPromise, resolve: resolveBarEvent } = lock();
      const eventHandlerBar = vi.fn(resolveBarEvent);
      scriptingService.registerEventHandler("bar", eventHandlerBar);

      // Let the next data call return events for foo and bar
      _jsonDataService.data.mockImplementationOnce(() => {
        return Promise.resolve({ type: "bar", data: "data for bar" });
      });
      _jsonDataService.data.mockImplementationOnce(() => {
        return Promise.resolve({ type: "foo", data: "data for foo" });
      });

      _resolveEventPoller();
      await eventFooPromise;
      expect(eventHandlerFoo).toHaveBeenCalledWith("data for foo");

      await eventBarPromise;
      expect(eventHandlerBar).toHaveBeenCalledWith("data for bar");

      scriptingService.stopEventPoller();
      _resolveEventPoller();
    });
  });

  describe("input / output objects", () => {
    it("requests getFlowVariableInputs", async () => {
      await (await getScriptingService()).getFlowVariableInputs();
      expect(_jsonDataService.data).toHaveBeenCalledWith({
        method: "getFlowVariableInputs",
      });
    });

    it("requests getInputObjects", async () => {
      await (await getScriptingService()).getInputObjects();
      expect(_jsonDataService.data).toHaveBeenCalledWith({
        method: "getInputObjects",
      });
    });

    it("requests getOutputObjects", async () => {
      await (await getScriptingService()).getOutputObjects();
      expect(_jsonDataService.data).toHaveBeenCalledWith({
        method: "getOutputObjects",
      });
    });
  });

  describe("registerSettingsGetterForApply", () => {
    /**
     * Not possible to import directly since the @knime/ui-extension-service Services have to be mocked first
     */
    const registerSettingsGetterForApply = async (settingsGetter: any) =>
      (await import("../scripting-service")).registerSettingsGetterForApply(
        settingsGetter,
      );

    it("adds listener in DialogService to apply data in JsonDataService", async () => {
      const settings = { script: "myScript" };
      const settingsGetter = () => settings;
      await registerSettingsGetterForApply(settingsGetter);
      expect(_dialogService.setApplyListener).toHaveBeenCalled();
      const applyListener = _dialogService.setApplyListener.mock.calls[0][0];
      expect(await applyListener()).toStrictEqual({ isApplied: true });
      expect(_jsonDataService.applyData).toHaveBeenCalledWith(settings);
    });
  });
});
