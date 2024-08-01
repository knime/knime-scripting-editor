import CompactTabBar from "@/components/CompactTabBar.vue";
import OutputConsole, {
  type ConsoleHandler,
  type ConsoleText,
} from "@/components/OutputConsole.vue";
import ScriptingEditor from "@/components/ScriptingEditor.vue";
import { type SettingsMenuItem } from "@/components/SettingsPage.vue";
import useShouldFocusBePainted from "@/components/utils/shouldFocusBePainted";
import {
  MIN_WIDTH_FOR_DISPLAYING_PANES,
  MIN_WIDTH_FOR_DISPLAYING_LEFT_PANE,
} from "@/components/utils/paneSizes";
import {
  type InputOutputModel,
  COLUMN_INSERTION_EVENT,
} from "@/components/InputOutputItem.vue";
import type {
  UseCodeEditorParams,
  UseCodeEditorReturn,
  UseDiffEditorParams,
  UseDiffEditorReturn,
} from "@/editor";
import editor from "@/editor";

import { consoleHandler } from "@/consoleHandler";
import {
  getScriptingService,
  type GenericInitialData,
  type GenericNodeSettings,
  type ScriptingServiceType,
  type KAIConfig,
  type PortConfigs,
} from "@/scripting-service";
import { setActiveEditorStoreForAi } from "@/store/ai-bar";
import {
  insertionEventHelper,
  type InsertionEvent,
} from "@/components/utils/insertionEventHelper";
import OutputTablePreview from "@/components/OutputTablePreview.vue";
import {
  getInitialDataService,
  type InitialDataServiceType,
} from "@/initial-data-service";

export {
  CompactTabBar,
  consoleHandler,
  editor,
  getScriptingService,
  OutputConsole,
  OutputTablePreview,
  ScriptingEditor,
  useShouldFocusBePainted,
  setActiveEditorStoreForAi,
  MIN_WIDTH_FOR_DISPLAYING_PANES,
  MIN_WIDTH_FOR_DISPLAYING_LEFT_PANE,
  COLUMN_INSERTION_EVENT,
  insertionEventHelper,
  getInitialDataService,
};
export type {
  ConsoleHandler,
  ConsoleText,
  GenericInitialData,
  GenericNodeSettings,
  InitialDataServiceType,
  InputOutputModel,
  ScriptingServiceType,
  SettingsMenuItem,
  UseCodeEditorParams,
  UseCodeEditorReturn,
  UseDiffEditorParams,
  UseDiffEditorReturn,
  InsertionEvent,
  KAIConfig,
  PortConfigs,
};
