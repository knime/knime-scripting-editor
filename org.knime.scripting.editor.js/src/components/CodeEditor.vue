<script setup lang="ts">
/**
 * A Vue component for the Monaco editor. Use the property "initialScript" to set the text that should be loaded into
 * the editor.
 *
 * The component emits the event "monaco-created" with the parameter
 * ```json
 * {
 *   editor: monaco.editor.IStandaloneCodeEditor,
 *   editorModel: monaco.editor.ITextModel
 * }.
 * ```
 *
 * Use
 * ```js
 * editorModel.onDidChangeContent(e => {
 *   // Do something
 * })
 * ```
 * to react script changes.
 */

import { onMounted, onUnmounted, ref } from "vue";
import * as monaco from "monaco-editor";
import { getScriptingService } from "@/scripting-service";
import { createConfiguredEditor, createModelReference } from "vscode/monaco";
import { startKnimeLanguageClient, initLanguageServices } from "../knime-lsp";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";

const emit = defineEmits(["monaco-created"]);

const props = defineProps({
  language: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
    default: "main.txt",
  },
});

// Remember the model and editor so that we can dispose them when the component is unmounted
let editorModel: monaco.editor.ITextModel,
  editor: monaco.editor.IStandaloneCodeEditor;

const editorRef = ref(null);

onMounted(async () => {
  if (editorRef.value === null) {
    throw new Error(
      "Editor reference is null. This is an implementation error",
    );
  }

  debugger;

  await initLanguageServices();

  const initialScript = (await getScriptingService().getInitialSettings())
    .script;

  // TODO with this method the model does not know that it is a Python file
  const modelRef = await createModelReference(
    monaco.Uri.parse(`/tmp/${props.fileName}`)
  );
  modelRef.object.setLanguageId("python");

  // TODO null check here?
  editorModel = modelRef.object.textEditorModel!;

  // TODO null check here?
  const workingModel = monaco.editor.createModel(
    initialScript,
    "python",
    monaco.Uri.parse(`/tmp/${props.fileName}`),
  );
  console.log("Working model", workingModel);
  console.log("New model", editorModel);


  editor = createConfiguredEditor(editorRef.value as HTMLElement, {
    model: editorModel,
    glyphMargin: false,
    lightbulb: {
      enabled: true,
    },
    minimap: { enabled: true },
    automaticLayout: true,
    scrollBeyondLastLine: true,
    fixedOverflowWidgets: true,
  });

  await startKnimeLanguageClient("Python LSP", ["python"]);

  // Notify the parent that the editor is now available
  emit("monaco-created", { editor, editorModel });
});

onUnmounted(() => {
  console.log("Unmounting CodeEditor");
  if (typeof editorModel !== "undefined") {
    editorModel.dispose();
  }
  if (typeof editor !== "undefined") {
    editor.dispose();
  }
});
</script>

<template>
  <div ref="editorRef" class="code-editor" />
</template>

<style lang="postcss" scoped>
.code-editor {
  height: calc(100% - var(--controls-height));
}
</style>
