<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useMainCodeEditor } from "@/editor";
import { onKeyStroke } from "@vueuse/core";
import {
  getSettingsService,
  type GenericNodeSettings,
} from "@/settings-service";
import { insertionEventHelper } from "@/components/utils/insertionEventHelper";
import { COLUMN_INSERTION_EVENT } from "@/components/InputOutputItem.vue";
import { useReadonlyStore } from "@/store/readOnly";

interface Props {
  showControlBar: boolean;
  language: string;
  fileName: string;
  toSettings?: (settings: GenericNodeSettings) => GenericNodeSettings;
  dropEventHandler?: (event: DragEvent) => void;
}

const props = withDefaults(defineProps<Props>(), {
  toSettings: (settings: GenericNodeSettings) => settings,
  dropEventHandler: () => {},
});

// Main editor
const editorRef = ref<HTMLDivElement>();
const codeEditorState = useMainCodeEditor({
  container: editorRef,
  fileName: props.fileName,
  language: props.language,
});

insertionEventHelper
  .getInsertionEventHelper(COLUMN_INSERTION_EVENT)
  .registerInsertionListener((event) => {
    codeEditorState.insertColumnReference(
      event.textToInsert,
      event.extraArgs?.requiredImport,
    );
  });

onMounted(() => {
  getSettingsService()
    .getSettings()
    .then((settings: GenericNodeSettings) => {
      codeEditorState.setInitialText(settings.script);

      useReadonlyStore().value =
        settings.settingsAreOverriddenByFlowVariable ?? false;
      codeEditorState.editor.value?.updateOptions({
        readOnly: useReadonlyStore().value,
        readOnlyMessage: {
          value: `Read-Only-Mode: The script is set by the flow variable '${settings.scriptUsedFlowVariable}'.`,
        },
        renderValidationDecorations: "on",
      });
    });
});

onKeyStroke("Escape", () => {
  if (codeEditorState.editor.value?.hasTextFocus()) {
    (document.activeElement as HTMLElement)?.blur();
  }
});

// register undo changes from outside the editor
onKeyStroke("z", (e) => {
  const key = navigator.userAgent.toLowerCase().includes("mac")
    ? e.metaKey
    : e.ctrlKey;

  if (key) {
    codeEditorState.editor.value?.trigger("window", "undo", {});
  }
});

getSettingsService().registerSettingsGetterForApply(() =>
  props.toSettings({ script: codeEditorState.text.value ?? "" }),
);
</script>

<template>
  <div class="editor-container">
    <div
      ref="editorRef"
      class="code-editor"
      @drop="
        useReadonlyStore().value
          ? $event.preventDefault()
          : dropEventHandler($event)
      "
    />
  </div>
</template>

<style>
.code-editor {
  height: 100%;
}

.editor-container {
  height: 100%;
  min-height: 0;
}
</style>
