import CompactTabBar from "@/components/CompactTabBar.vue";
import OutputConsole, {
  type ConsoleHandler,
  type ConsoleText,
} from "@/components/OutputConsole.vue";
import ScriptingEditor from "@/components/ScriptingEditor.vue";
import { type SettingsMenuItem } from "@/components/SettingsPage.vue";
import CodeEditorControlBar from "@/components/CodeEditorControlBar.vue";

import type {
  UseCodeEditorParams,
  UseCodeEditorReturn,
  UseDiffEditorParams,
  UseDiffEditorReturn,
} from "@/editor";
import editor, { useCodeEditor } from "@/editor";

import { consoleHandler } from "@/consoleHandler";
import {
  getScriptingService,
  type NodeSettings,
  type ScriptingServiceType,
} from "@/scripting-service";

export {
  CompactTabBar,
  consoleHandler,
  editor,
  getScriptingService,
  OutputConsole,
  ScriptingEditor,
  CodeEditorControlBar,
  useCodeEditor,
};
export type {
  ConsoleHandler,
  ConsoleText,
  NodeSettings,
  ScriptingServiceType,
  SettingsMenuItem,
  UseCodeEditorParams,
  UseCodeEditorReturn,
  UseDiffEditorParams,
  UseDiffEditorReturn,
};
