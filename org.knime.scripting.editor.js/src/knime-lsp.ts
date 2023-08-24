import { MonacoLanguageClient, initServices } from "monaco-languageclient";
import {
  CloseAction,
  ErrorAction,
  type DataCallback,
  type Disposable,
  type DocumentSelector,
  type Message,
  type MessageReader,
  type MessageWriter,
} from "vscode-languageclient";
import { AbstractMessageReader, AbstractMessageWriter } from "vscode-jsonrpc";
import { getScriptingService } from "./scripting-service";
import { languages, Uri } from "monaco-editor";
import {
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
  RegisteredMemoryFile,
} from "vscode/service-override/files";
import * as vscode from "vscode";

class KnimeMessageReader
  extends AbstractMessageReader
  implements MessageReader
{
  protected messageCache: string[] = [];
  protected callback: DataCallback | null;

  constructor() {
    super();
    getScriptingService().registerLanguageServerEventHandler((message) => {
      this.readMessage(message);
    });
    this.callback = null;
  }

  listen(callback: DataCallback): Disposable {
    if (this.callback === null) {
      this.callback = callback;
      this.messageCache.forEach((message) => {
        this.readMessage(message);
      });
      this.messageCache = [];

      return {
        dispose: () => {
          if (this.callback === callback) {
            this.callback = null;
          }
        },
      };
    } else {
      throw Error(
        "Tried to register more than one language server callback. " +
          "This is an implementation error.",
      );
    }
  }

  readMessage(message: string) {
    if (this.callback) {
      const data = JSON.parse(message);
      this.callback(data);
    } else {
      this.messageCache.push(message);
    }
  }
}

class KnimeMessageWriter
  extends AbstractMessageWriter
  implements MessageWriter
{
  async write(msg: Message): Promise<void> {
    await getScriptingService().sendToService("sendLanguageServerMessage", [
      JSON.stringify(msg),
    ]);
  }

  end(): void {
    // Required by the interface but nothing to do
  }
}

export const initLanguageServices = async () => {
  // TODO(AP-19338) Allow configuration of the language server
  // Maybe "initializationOptions" of LanguageClientOptions is the way to go

  await initServices({
    enableModelService: true,
    enableThemeService: true,
    enableTextmateService: true,
    configureConfigurationService: {
      defaultWorkspaceUri: "/tmp",
    },
    enableKeybindingsService: true,
    debugLogging: true,
  });

  languages.register({
    id: "python",
    extensions: [".py"],
    aliases: ["PYTHON", "Python", "python"],
    mimetypes: ["text/x-python"],
  });

  const fileSystemProvider = new RegisteredFileSystemProvider(false);
  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file("/tmp/main.py"),
      'print("Hello, World!")',
    ),
  );
  registerFileSystemOverlay(1, fileSystemProvider);
};

export const startKnimeLanguageClient = async (
  name: string,
  documentSelector?: DocumentSelector | string[],
): Promise<MonacoLanguageClient> => {
  // TODO the build gets gigantic

  const languageClient = new MonacoLanguageClient({
    name,
    clientOptions: {
      // use a language id as a document selector
      documentSelector,
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.Restart }),
      },
      workspaceFolder: {
        index: 0,
        name: "workspace",
        uri: Uri.parse("/tmp"),
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: () =>
        Promise.resolve({
          reader: new KnimeMessageReader(),
          writer: new KnimeMessageWriter(),
        }),
    },
  });
  await languageClient.start();
  return languageClient;
};
