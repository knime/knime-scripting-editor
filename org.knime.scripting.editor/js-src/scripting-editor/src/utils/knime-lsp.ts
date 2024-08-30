import {
    MonacoLanguageClient,
    CloseAction,
    ErrorAction,
    MonacoServices,
} from 'monaco-languageclient';

import type {
    DocumentSelector,
    Message,
    MessageReader,
    MessageWriter,
    Disposable,
    DataCallback,
} from 'monaco-languageclient';

import { AbstractMessageReader, AbstractMessageWriter } from 'vscode-jsonrpc';
import type { ScriptingService, NodeSettings } from './scripting-service';

class KnimeMessageReader
    extends AbstractMessageReader
    implements MessageReader {
    protected messageCache: string[] = [];
    protected callback: DataCallback | null;

    constructor(scriptingService: ScriptingService<NodeSettings>) {
        super();
        scriptingService.registerLanguageServerEventHandler((message) => {
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
                'Tried to register more than one language server callback. ' +
                'This is an implementation error.',
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
    implements MessageWriter {
    constructor(private scriptingService: ScriptingService<NodeSettings>) {
        super();
    }

    async write(msg: Message): Promise<void> {
        await this.scriptingService.sendLanguageServerMessage(
            JSON.stringify(msg),
        );
    }

    // eslint-disable-next-line class-methods-use-this
    end(): void {
        // Required by the interface but nothing to do
    }
}

export const startKnimeLanguageClient = async (
    scriptingService: ScriptingService<NodeSettings>,
    name: string,
    documentSelector?: DocumentSelector | string[],
): Promise<MonacoLanguageClient> => {
    // TODO(AP-19338) Allow configuration of the language server
    // Maybe "initializationOptions" of LanguageClientOptions is the way to go

    MonacoServices.install();
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
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: () => Promise.resolve({
                reader: new KnimeMessageReader(scriptingService),
                writer: new KnimeMessageWriter(scriptingService),
            }),
        },
    });
    await languageClient.start();
    return languageClient;
};