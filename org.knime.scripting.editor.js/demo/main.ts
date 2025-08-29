import { createApp } from "vue";
import { Consola, LogLevels } from "consola";

import "./mock-services";
import App from "./App.vue";

// Setup Monaco Editor environment for web workers
(window as any).MonacoEnvironment = {
  getWorkerUrl: function () {
    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
      self.MonacoEnvironment = { baseUrl: '${window.location.origin}/' };
      importScripts('${window.location.origin}/node_modules/monaco-editor/min/vs/base/worker/workerMain.js');
    `)}`;
  },
};

const setupConsola = () => {
  const consola = new Consola({
    level: LogLevels.trace,
  });
  const globalObject = typeof global === "object" ? global : window;

  (globalObject as any).consola = consola;
};

setupConsola();

const app = createApp(App);

app.mount("#app");
