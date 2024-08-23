<script setup lang="ts">
import { onClickOutside, useTextareaAutosize } from "@vueuse/core";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  type PropType,
} from "vue";
import AbortIcon from "@knime/styles/img/icons/cancel-execution.svg";
import LinkIcon from "@knime/styles/img/icons/link.svg";
import SendIcon from "@knime/styles/img/icons/paper-flier.svg";
import { Button, FunctionButton } from "@knime/components";
import InfinityLoadingBar from "@/components/InfinityLoadingBar.vue";
import { getScriptingService } from "@/scripting-service";
import {
  getInitialDataService,
  type GenericInitialData,
} from "@/initial-data-service";
import { getSettingsService } from "@/settings-service";
import {
  activeEditorStore,
  clearPromptResponseStore,
  showDisclaimer,
  usePromptResponseStore,
  type Message,
  type PromptResponseStore,
} from "@/store/ai-bar";
import AiSuggestion from "./AiSuggestion.vue";
import { consoleHandler } from "@/consoleHandler";
import type { PaneSizes } from "@/components/utils/paneSizes";

type Status =
  | "idle"
  | "error"
  | "waiting"
  | "uninstalled"
  | "unauthorized"
  | "readonly";

const { textarea, input } = useTextareaAutosize();

const props = defineProps({
  currentPaneSizes: {
    type: Object as PropType<PaneSizes>,
    required: true,
  },
});

const promptResponseStore: PromptResponseStore = usePromptResponseStore();
const status = ref<Status>("idle" as Status);
let message: Message | null =
  promptResponseStore.promptResponse?.message ?? null;
let history: Array<Message | null> = [];
const scriptingService = getScriptingService();

const abortRequest = () => {
  scriptingService?.sendToService("abortSuggestCodeRequest");
  // this should be handled in the response of the eventhandler
  status.value = "waiting";
};

type CodeSuggestion = {
  code: string;
  status: "SUCCESS" | "ERROR" | "CANCELLED";
  error: string | undefined;
};

const handleCodeSuggestion = (codeSuggestion: CodeSuggestion) => {
  if (codeSuggestion.status === "ERROR") {
    consoleHandler.writeln({
      text: `ERROR: ${codeSuggestion.error}`,
    });
    status.value = "error";
  } else if (codeSuggestion.status === "CANCELLED") {
    status.value = "idle";
  } else {
    const suggestedCode = JSON.parse(codeSuggestion.code).code;
    message = { role: "request", content: input.value };
    promptResponseStore.promptResponse = {
      suggestedCode,
      message,
    };
    status.value = "idle";
    input.value = "";
  }
  nextTick(() => {
    textarea.value?.focus();
  });
};

scriptingService.registerEventHandler("codeSuggestion", handleCodeSuggestion);

const request = async () => {
  status.value = "waiting";

  // code suggestions will be returned via events, see the response handler above
  await scriptingService.sendToService("suggestCode", [
    input.value,
    activeEditorStore.value?.text.value,
  ]);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (status.value !== "waiting") {
      request();
    }
  }
  if (e.key === "ArrowUp" && !input.value) {
    // show last history message if available
    input.value = history.length ? history[history.length - 1]!.content : "";
  }
};
const leftSplitterPosition = computed(() =>
  Math.max(props.currentPaneSizes.left, 0),
);

const showAiBarPopup = defineModel<boolean>("showAiBarContainer", {
  default: false,
});
const aiBarPopupRef = ref<HTMLDivElement | null>(null);
const slottedContentContainerRef = ref<HTMLButtonElement | null>(null);

const toggleAiBar = () => {
  showAiBarPopup.value = !showAiBarPopup.value;
};

const acceptSuggestion = (acceptedCode: string) => {
  history.push(message);
  status.value = "idle";
  activeEditorStore.value!.text.value = acceptedCode;
  clearPromptResponseStore();

  showAiBarPopup.value = false;
};

const setupOnClickOutside = () => {
  const splitters = [...document.querySelectorAll(".splitpanes__splitter")].map(
    (splitter) => splitter as HTMLElement,
  );
  onClickOutside(
    aiBarPopupRef,
    () => {
      showAiBarPopup.value = false;
    },
    { ignore: [slottedContentContainerRef, ...splitters] },
  );
};

onMounted(async () => {
  const settings = await getSettingsService().getSettings();
  const initialData = await getInitialDataService().getInitialData();

  if (!initialData.kAiConfig.codeAssistantInstalled) {
    status.value = "uninstalled";
  } else if (settings.settingsAreOverriddenByFlowVariable) {
    status.value = "readonly";
  } else if (!(await getScriptingService().isLoggedIntoHub())) {
    status.value = "unauthorized";
  }

  await nextTick();

  setupOnClickOutside();
});

onUnmounted(() => {
  if (status.value === "waiting") {
    abortRequest();
  }
});

const handleLoginStatus = (loginStatus: boolean) => {
  if (loginStatus) {
    status.value = "idle";
  }
};

scriptingService.registerEventHandler("hubLogin", handleLoginStatus);

const tryLogin = () => {
  scriptingService.sendToService("loginToHub");
};

// used to add a divider between notification bar / chat controls and above
const hasTopContent = computed(() => {
  return (
    status.value === "uninstalled" ||
    status.value === "unauthorized" ||
    showDisclaimer.value ||
    promptResponseStore.promptResponse
  );
});

// The id of the hub is used to display the name of the hub in the login button
// Updated with the actual hub id once the scripting service is ready
const hubId = ref<string>("KNIME Hub");
getInitialDataService()
  .getInitialData()
  .then((data: GenericInitialData) => {
    const id = data.kAiConfig.hubId;
    if (id !== null) {
      hubId.value = id;
    }
  });
</script>

<template>
  <div class="everything">
    <div
      v-if="showAiBarPopup"
      ref="aiBarPopupRef"
      class="ai-bar-popup"
      data-testid="ai-bar-popup"
      :style="{
        '--left-splitter-position': `${leftSplitterPosition}vw`,
      }"
    >
      <div class="content-except-arrow">
        <div v-show="status === 'uninstalled'" class="notification-bar">
          <span class="notification">
            To start generating code with our AI assistant, install the
            <i>KNIME AI Assistant</i> extension
          </span>
          <Button
            compact
            primary
            :to="'https://hub.knime.com/knime/extensions/org.knime.features.ai.assistant/latest'"
            class="notification-button"
          >
            <LinkIcon />Download from KNIME Hub
          </Button>
        </div>
        <div v-show="status === 'unauthorized'" class="notification-bar">
          <span class="notification">
            To start generating code with our AI assistant, please log into your
            <i>KNIME Hub</i> account
          </span>
          <Button
            compact
            primary
            class="notification-button"
            @click="tryLogin()"
          >
            Login to {{ hubId }}
          </Button>
        </div>
        <div v-show="status === 'readonly'" class="notification-bar">
          <span class="notification">
            Script is overwritten by a flow variable.
          </span>
        </div>
        <div
          v-show="
            status !== 'uninstalled' &&
            status !== 'unauthorized' &&
            status !== 'readonly'
          "
        >
          <Transition name="disclaimer-slide-fade">
            <div v-if="showDisclaimer" class="disclaimer-container">
              <div class="disclaimer-text">
                <p style="font-weight: bold">Disclaimer</p>
                <p>
                  By using this coding assistant, you acknowledge and agree the
                  following: Any information you enter into the prompt, as well
                  as the current code (being edited) and table headers, may be
                  shared with OpenAI and KNIME in order to provide and improve
                  this service.
                </p>

                <p>
                  KNIME is not responsible for any content, input or output, or
                  actions triggered by the generated code, and is not liable for
                  any damages arising from or related to your use of the coding
                  assistant.
                </p>

                <p>This is an experimental service, USE AT YOUR OWN RISK.</p>
              </div>
              <div class="disclaimer-button-container">
                <Button
                  compact
                  primary
                  class="notification-button"
                  @click="showDisclaimer = false"
                  >Accept and close</Button
                >
              </div>
            </div>
          </Transition>
          <Transition name="slide-fade">
            <AiSuggestion
              v-if="promptResponseStore.promptResponse"
              class="ai-suggestion"
              @accept-suggestion="acceptSuggestion"
            />
          </Transition>
          <div
            class="chat-controls"
            :class="{ 'chat-controls-border-top': hasTopContent }"
          >
            <Transition name="slide-fade">
              <div v-if="promptResponseStore.promptResponse" class="prompt-bar">
                {{ promptResponseStore.promptResponse.message.content }}
              </div>
            </Transition>
            <InfinityLoadingBar v-if="status === 'waiting'" />
            <div class="chat-controls-text-input">
              <textarea
                ref="textarea"
                v-model="input"
                :disabled="status === 'waiting' || showDisclaimer"
                class="textarea"
                placeholder="Describe what your expression should do"
                wrap="soft"
                @keydown="handleKeyDown"
              />
              <div class="chat-controls-buttons">
                <FunctionButton
                  v-if="status === 'error' || status === 'idle'"
                  ref="sendButton"
                  primary
                  title="Send"
                  :disabled="!input || showDisclaimer"
                  class="send-button"
                  @click="request"
                >
                  <SendIcon class="icon" />
                </FunctionButton>
                <FunctionButton
                  v-if="status === 'waiting'"
                  ref="abortButton"
                  title="Cancel"
                  class="send-button abort-button"
                  @click="abortRequest"
                >
                  <AbortIcon class="icon" />
                </FunctionButton>
              </div>
            </div>
            <div v-if="status === 'error'" class="error-message">
              An error occurred. Please try again.
            </div>
          </div>
        </div>
      </div>
      <div class="arrow" />
    </div>
    <div ref="slottedContentContainerRef" class="slotted-content">
      <slot name="ai-button" :toggle-ai-bar="toggleAiBar" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(30px);
  opacity: 0;
}

.everything {
  position: relative;
  display: flex;

  & .ai-bar-popup {
    --default-ai-bar-width: 65vw;
    --ai-bar-margin: var(--space-8);
    --ai-bar-corner-radius: 8px;
    --arrow-size: 18px;

    z-index: 10;

    /* Amount by which the left edge of prompt is left of the centre of AI button. */
    --left-hang: 150px;

    /* Correcting term for when the InputOutputPane is too small to allow the preferred left hang. */
    --left-hang-correction-for-left-pane: max(
      0px,
      calc(var(--left-hang) - var(--left-splitter-position))
    );

    /* Additional correcting term so that arrow never falls off the edge of the prompt. 
    We shift the prompt left by this amount and then the arrow right by this amount. */
    --left-hang-correction-for-arrow: var(--arrow-size);

    width: var(--default-ai-bar-width);
    max-width: 1000px;
    position: absolute;
    left: calc(50%); /* put the left edge at the middle of the AI button */
    top: calc(-1 * (var(--arrow-size) + 2px));
    transform: translateY(-100%)
      translateX(
        calc(
          var(--left-hang-correction-for-left-pane) - var(--left-hang) -
            var(--left-hang-correction-for-arrow)
        )
      );

    & .content-except-arrow {
      display: flex;
      flex-direction: column;
      background-color: var(--knime-gray-ultra-light);
      border: 1px solid var(--knime-porcelain);
      border-radius: var(--ai-bar-corner-radius);
      font-size: 13px;
      line-height: 27px;
      z-index: 11; /* to display ai bar above the main code editor's scroll bar */
      box-shadow: var(--shadow-elevation-2);
      transition: width 0.2s ease-in-out;
      overflow: hidden;

      & .subtitle {
        color: var(--knime-black);
        margin-top: var(--space-8);
        font-style: italic;
        display: flex;
        justify-content: flex-start;
        align-items: baseline;
        flex-direction: row;

        & .text {
          margin-right: var(--space-4);
        }

        & .button {
          position: absolute;
          bottom: 4px;
          right: 79px;

          &.primary {
            right: 4px;
          }
        }
      }

      & .ai-suggestion {
        margin: var(--ai-bar-margin);
        min-height: 200px;
        height: 40vh;
      }

      & .chat-controls-border-top {
        border-top: 1px solid var(--knime-porcelain);
      }

      & .chat-controls {
        display: flex;
        flex-direction: column;
        position: relative;

        & .prompt-bar {
          margin-top: var(--ai-bar-margin);
          margin-right: var(--ai-bar-margin);
          margin-left: var(--ai-bar-margin);
          line-height: 15.23px;
          word-wrap: break-word;
        }

        & .error-message {
          color: var(--knime-coral-dark);
          z-index: 12;
          margin: 0 var(--ai-bar-margin) var(--ai-bar-margin)
            var(--ai-bar-margin);
          line-height: 15.23px;
        }

        & .chat-controls-text-input {
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
          z-index: 12;

          & .textarea {
            flex-grow: 1;
            border: 2px solid var(--knime-porcelain);
            resize: none;
            border-radius: 0;
            padding: var(--space-8);
            margin: var(--ai-bar-margin);
            color: var(--knime-masala);
            font-size: 13px;
            font-weight: lighter;
            font-family: Roboto, sans-serif;
            overflow: hidden;
            text-wrap: soft;

            &::placeholder {
              color: var(--knime-dove-gray);
            }

            &:disabled {
              opacity: 0.5;
            }

            &:focus {
              outline: none;
            }
          }

          & .chat-controls-buttons {
            margin: var(--ai-bar-margin);
            margin-left: 0;
          }
        }
      }

      & .notification-bar {
        display: flex;
        justify-content: space-between;
        vertical-align: middle;
        border-top: 1px solid var(--knime-porcelain);
        position: relative;
        height: 49px;
      }
    }

    & .arrow {
      width: var(--arrow-size);
      height: var(--arrow-size);
      content: "";
      position: absolute;
      background-color: var(--knime-gray-ultra-light);
      bottom: 0;
      z-index: 1;
      border-right: 1px solid var(--knime-porcelain);
      border-top: 1px solid var(--knime-porcelain);

      /* we clip the arrow to stop it casting a shadow on the rest of the popup */
      clip-path: rect(calc(0px - 100vw) calc(100% + 100vw) 100% 0);
      box-shadow: var(--shadow-elevation-2);
      transform: translateX(
          calc(
            var(--left-hang) - var(--arrow-size) / 2 -
              var(--left-hang-correction-for-left-pane) +
              var(--left-hang-correction-for-arrow)
          )
        )
        translateY(50%) rotate(135deg);
    }
  }
}

.notification {
  line-height: 15.23px;
  margin: var(--space-16);
}

.notification-button {
  height: 30px;
  margin: var(--space-8);
  margin-right: var(--space-16);
}

.abort-button {
  border: 1px solid var(--knime-silver-sand);
}

.disclaimer-container {
  display: flex;
  flex-direction: column;

  & .disclaimer-text {
    margin: var(--space-8);
    line-height: 20px;
    padding: var(--space-4);
    background-color: var(--knime-white);
    border-radius: var(--ai-bar-corner-radius);
  }

  & .disclaimer-button-container {
    display: flex;
    justify-content: right;

    & > button {
      margin-top: 0;
    }
  }
}

.disclaimer-slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.disclaimer-slide-fade-enter-from,
.disclaimer-slide-fade-leave-to {
  transform: translateY(30px);
  opacity: 0;
}
</style>
