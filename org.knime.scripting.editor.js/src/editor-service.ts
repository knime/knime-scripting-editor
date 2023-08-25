import { editor as monaco, type IRange } from "monaco-editor";

export class EditorService {
  editor?: monaco.IStandaloneCodeEditor;
  editorModel?: monaco.ITextModel;

  public initEditorService({
    editor,
    editorModel,
  }: {
    editor: monaco.IStandaloneCodeEditor;
    editorModel: monaco.ITextModel;
  }) {
    this.editor = editor;
    this.editorModel = editorModel;
  }

  /**
   * @returns the entire editor content or null if monaco has not yet been initialized
   */
  public getScript(): string | null {
    if (
      typeof this.editor === "undefined" ||
      typeof this.editorModel === "undefined"
    ) {
      return null;
    }

    return this.editorModel.getValue();
  }

  /**
   * @returns all currently selected lines in the editor from first to last column. Also returns partly selected lines.
   * Returns null if monaco has not yet been initialized.
   */
  public getSelectedLines(): string | null {
    if (
      typeof this.editor === "undefined" ||
      typeof this.editorModel === "undefined"
    ) {
      return null;
    }

    const selection = this.editor.getSelection();
    if (selection === null) {
      return null;
    }

    const [selectionStartLine, selectionEndLine] = [
      selection.startLineNumber,
      selection.endLineNumber,
    ];

    const selectionLineRange: IRange = {
      startLineNumber: selectionStartLine,
      startColumn: 0,
      endLineNumber: selectionEndLine,
      endColumn:
        this.editorModel.getLineLastNonWhitespaceColumn(selectionEndLine),
    };

    return this.editorModel.getValueInRange(selectionLineRange);
  }
}