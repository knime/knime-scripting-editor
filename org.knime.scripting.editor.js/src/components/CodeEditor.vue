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
import {
  editor,
  languages,
  Uri,
} from "monaco-editor/esm/vs/editor/editor.api.js";
import { getScriptingService } from "@/scripting-service";
import { createConfiguredEditor, createModelReference } from "vscode/monaco";
import { startKnimeLanguageClient, initLanguageServices } from "../knime-lsp";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";

const emit = defineEmits(["monaco-created"]);

const props = defineProps({
  language: {
    type: String,
    default: "plaintext",
  },
  fileName: {
    type: String,
    default: "main.txt",
  },
});

// Remember the model and editor so that we can dispose them when the component is unmounted
let editorModel: editor.ITextModel, editorObj: editor.IStandaloneCodeEditor;

const editorRef = ref(null);

onMounted(async () => {
  if (editorRef.value === null) {
    throw new Error(
      "Editor reference is null. This is an implementation error",
    );
  }

  await initLanguageServices();

  const initialScript = (await getScriptingService().getInitialSettings())
    .script;

  // NB: The path is not real but just in memory
  const modelRef = await createModelReference(
    Uri.parse(`/script/${props.fileName}`),
    initialScript,
  );
  modelRef.object.setLanguageId(props.language);

  // TODO null check here?
  editorModel = modelRef.object.textEditorModel!;

  // editor.defineTheme("myCustomTheme", {
  //   base: "vs", // can also be vs-dark or hc-black
  //   inherit: true, // can also be false to completely replace the builtin rules
  //   rules: [
  //     {
  //       token: "comment",
  //       foreground: "ffa500",
  //       fontStyle: "italic underline",
  //     },
  //     { token: "comment.js", foreground: "008800", fontStyle: "bold" },
  //     { token: "comment.css", foreground: "0000ff" }, // will inherit fontStyle from `comment` above
  //   ],
  //   colors: {
  //     "editor.foreground": "#000000",
  //   },
  // });
  // editor.setTheme("myCustomTheme");

  // TODO null check here?
  // const workingModel = monaco.editor.createModel(
  //   initialScript,
  //   "python",
  //   monaco.Uri.parse(`/tmp/${props.fileName}`),
  // );
  // console.log("Working model", workingModel);
  // console.log("New model", editorModel);

  editorObj = createConfiguredEditor(editorRef.value as HTMLElement, {
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
  // TODO dispose the model reference
  if (typeof editorModel !== "undefined") {
    editorModel.dispose();
  }
  if (typeof editor !== "undefined") {
    editorObj.dispose();
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
