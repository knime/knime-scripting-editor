import { getScriptingService } from "@/scripting-service";
import { log } from "console";
import { reactive, ref } from "vue";

export interface Message {
  role: "reply" | "request";
  content: string;
}

export type PromptResponse = {
  suggestedCode: string;
  message: Message;
};

export type PromptResponseStore = {
  promptResponse?: PromptResponse;
};

const promptResponseStore: PromptResponseStore = reactive<PromptResponseStore>(
  {},
);

export const usePromptResponseStore = (): PromptResponseStore => {
  return promptResponseStore;
};

export const clearPromptResponseStore = (): void => {
  if (typeof promptResponseStore.promptResponse !== "undefined") {
    delete promptResponseStore.promptResponse;
  }
};

// Whether the disclaimer needs to be shown to the user.
// This is part of the store so it is only shown the first time the user
// opens the AI bar while the script editor is open.
export const showDisclaimer = ref<boolean>(true);

export type AiCodeAssistantStatus = {
  enabled: boolean;
  installed: boolean;
  loggedIn: boolean;
  hubId: string | null;
};

export const aiCodeAssistantStatus = reactive<AiCodeAssistantStatus>({
  enabled: false,
  installed: false,
  loggedIn: false,
  hubId: null,
});

// Update the loggedIn status whenver the user logs in to the KNIME Hub
getScriptingService().registerEventHandler(
  "hubLogin",
  (loginStatus: boolean) => {
    if (loginStatus) {
      aiCodeAssistantStatus.loggedIn = true;
    }
  },
);

/**
 * Send a request to the scripting service to prompt the user for input.
 */
export const loginToHub = () => {
  getScriptingService().sendToService("loginToHub");
};

// Immediatly update the status of the AI code assistant
(async () => {
  const newStatus = await getScriptingService().sendToService(
    "getAiCodeAssistantStatus",
  );
  Object.assign(aiCodeAssistantStatus, newStatus);
})();
