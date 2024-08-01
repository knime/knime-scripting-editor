import { sleep } from "@knime/utils";
import type { InputOutputModel } from "./components/InputOutputItem.vue";
import type {
  GenericInitialData,
  PortConfigs,
  ScriptingServiceType,
} from "./scripting-service";

const DEFAULT_PORT_CONFIGS: PortConfigs = {
  inputPorts: [
    {
      nodeId: "root",
      portName: "firstPort",
      portIdx: 1,
      portViewConfigs: [
        { portViewIdx: 0, label: "firstView" },
        { portViewIdx: 1, label: "secondView" },
      ],
    },
    {
      nodeId: "notRoot",
      portName: "firstPort",
      portIdx: 1,
      portViewConfigs: [
        { portViewIdx: 0, label: "firstView" },
        { portViewIdx: 1, label: "secondView" },
      ],
    },
  ],
};
const SLEEP_TIME_ANY_CALL = 100;
const SLEEP_TIME_AI_SUGGESTION = 2000;

const log = (message: any, ...args: any[]) => {
  if (typeof consola === "undefined") {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  } else {
    consola.log(message, ...args);
  }
};

const error = (message: any, ...args: any[]) => {
  if (typeof consola === "undefined") {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  } else {
    consola.error(message, ...args);
  }
};

export const DEFAULT_INPUT_OBJECTS: InputOutputModel[] = [
  {
    name: "Input table 1",
    portType: "table",
    subItems: [
      {
        name: "Column 1",
        type: "Number",
      },
      {
        name: "Column 2",
        type: "String",
      },
      {
        name: "Column 3",
        type: "String",
      },
    ],
  },
];

export const DEFAULT_OUTPUT_OBJECTS: InputOutputModel[] = [
  {
    name: "Output table 1",
    portType: "table",
  },
];

export const DEFAULT_FLOW_VARIABLE_INPUTS: InputOutputModel = {
  name: "Flow Variables",
  portType: "flowVariable",
  subItems: [
    {
      name: "flowVar1",
      type: "Number",
    },
    {
      name: "flowVar2",
      type: "String",
    },
    {
      name: "flowVar3",
      type: "String",
    },
  ],
};

export const DEFAULT_INITIAL_DATA: GenericInitialData = {
  inputObjects: DEFAULT_INPUT_OBJECTS,
  outputObjects: DEFAULT_OUTPUT_OBJECTS,
  flowVariables: DEFAULT_FLOW_VARIABLE_INPUTS,
  inputPortConfigs: DEFAULT_PORT_CONFIGS,
  kAiConfig: {
    codeAssistantEnabled: true,
    codeAssistantInstalled: true,
    hubId: "My Mocked KNIME Hub",
    loggedIn: true,
  },
  inputsAvailable: true,
  settings: {
    script: "Hello world (from browser mock)",
  },
};

export type ScriptingServiceMockOptions = {
  sendToServiceMockResponses?: Record<
    string,
    (options?: any[]) => Promise<any>
  >;
  initialSettings?: GenericInitialData;
};

export const createScriptingServiceMock = (
  opt: ScriptingServiceMockOptions,
): ScriptingServiceType & {
  eventHandlers: Map<string, (args: any) => void>;
} => {
  const eventHandlers = new Map<string, (args: any) => void>();
  const sendToServiceMockResponses: Record<
    string,
    (options?: any[]) => Promise<any>
  > = {
    suggestCode: async () => {
      await sleep(SLEEP_TIME_AI_SUGGESTION);
      const fn = eventHandlers.get("codeSuggestion");
      if (typeof fn !== "undefined") {
        fn({
          status: "SUCCESS",
          code: JSON.stringify({ code: "// THIS IS A FAKE AI SUGGESTION" }),
        });
      }
      return {};
    },
    abortSuggestCodeRequest: () => Promise.resolve(),
  };

  return {
    sendToService(methodName: string, options?: any[]) {
      log(`Called scriptingService.sendToService("${methodName}")`, options);

      sleep(SLEEP_TIME_ANY_CALL);

      if (
        opt.sendToServiceMockResponses &&
        methodName in opt.sendToServiceMockResponses
      ) {
        return opt.sendToServiceMockResponses[methodName](options);
      }

      if (methodName in sendToServiceMockResponses) {
        return sendToServiceMockResponses[methodName](options);
      }

      // Fallback - Log an error and return undefined
      error(
        `${methodName} not implemented in sendToServiceMockResponses.
      Returning undefined.`,
      );
      return Promise.resolve();
    },

    // Settings and dialog window
    getInitialData() {
      log("Called scriptingService.getInitialData");
      return Promise.resolve(opt.initialSettings ?? DEFAULT_INITIAL_DATA);
    },
    registerSettingsGetterForApply() {
      log("Called scriptingService.registerSettingsGetterForApply");
      return Promise.resolve();
    },

    isCallKnimeUiApiAvailable() {
      log("Called scriptingService.isCallKnimeUiApiAvailable");
      return Promise.resolve(true);
    },

    // Event handler
    registerEventHandler(type, handler) {
      log("Called scriptingService.registerEventHandler", type);
      eventHandlers.set(type, handler);
    },

    // Language server
    connectToLanguageServer() {
      log("Called scriptingService.connectToLanguageServer");
      return Promise.reject(new Error("No language server in mock"));
    },

    // Console handling
    eventHandlers,
  };
};
