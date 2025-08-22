<script setup lang="ts">
import { ref, onMounted } from "vue";
import { LoadingIcon } from "@knime/components";
import {
  ScriptingEditor,
  OutputConsole,
  type ConsoleHandler,
  type GenericNodeSettings,
  consoleHandler,
  setConsoleHandler,
  initConsoleEventHandler,
} from "../lib/main";

const menuItems = [
  {
    text: "Demo Settings",
    icon: "⚙️",
    href: "#settings",
  },
  {
    text: "Documentation",
    icon: "📖",
    href: "https://docs.knime.com/",
  },
];

const currentSettingsMenuItem = ref<any>(null);
const initialDataLoaded = ref(false);

const onMenuItemClicked = ({ item }: { item: any }) => {
  currentSettingsMenuItem.value = item;
};

const toSettings = (commonSettings: GenericNodeSettings) => ({
  ...commonSettings,
  // Add any additional demo-specific settings here
});

// Simulate some initialization time
onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  initialDataLoaded.value = true;
});

// Mock functions for demo purposes
const runScript = () => {
  console.log("Demo: Running script...");
  consoleHandler.writeln({ text: "Demo: Script executed successfully!" });
};

const runSelectedLines = () => {
  console.log("Demo: Running selected lines...");
  consoleHandler.writeln({ text: "Demo: Selected lines executed!" });
};
</script>

<template>
  <main>
    <template v-if="initialDataLoaded">
      <ScriptingEditor
        title="Demo Scripting Editor"
        language="python"
        file-name="demo.py"
        :menu-items="menuItems"
        :to-settings="toSettings"
        :initial-pane-sizes="{
          left: 25,
          right: 25,
          bottom: 30,
        }"
        :additional-bottom-pane-tab-content="[
          {
            slotName: 'bottomPaneTabSlot:console',
            label: 'Console',
            associatedControlsSlotName: 'bottomPaneTabControlsSlot:console',
          },
        ]"
        @menu-item-clicked="onMenuItemClicked"
      >
        <template #settings-title>
          {{ currentSettingsMenuItem?.title }}
        </template>
        <template #settings-content>
          <div style="padding: 20px;">
            <h3>Demo Settings</h3>
            <p>This is a demo settings page. In a real application, you would put your settings controls here.</p>
            <ul>
              <li>Setting 1: Enabled</li>
              <li>Setting 2: Disabled</li>
              <li>Setting 3: Auto</li>
            </ul>
          </div>
        </template>
        
        <template #code-editor-controls="{ showButtonText }">
          <div style="display: flex; gap: 8px;">
            <button 
              @click="runScript"
              style="
                padding: 8px 16px;
                background: #007ACC;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              "
            >
              {{ showButtonText ? 'Run Script' : '▶' }}
            </button>
            <button 
              @click="runSelectedLines"
              style="
                padding: 8px 16px;
                background: #28A745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              "
            >
              {{ showButtonText ? 'Run Selection' : '⏵' }}
            </button>
          </div>
        </template>

        <template #right-pane>
          <div style="padding: 20px; height: 100%; overflow-y: auto;">
            <h3>Demo Right Pane</h3>
            <p>This is the right pane where you can display:</p>
            <ul>
              <li>Variable explorer</li>
              <li>Function catalog</li>
              <li>Help documentation</li>
              <li>Preview panels</li>
            </ul>
            
            <h4>Sample Variables</h4>
            <div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              <div>input_table: DataFrame (100 rows, 3 columns)</div>
              <div>output_table: DataFrame (100 rows, 4 columns)</div>
              <div>demo_column: Series (100 values)</div>
            </div>

            <h4>Sample Functions</h4>
            <div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              <div>knio.input_tables[0]</div>
              <div>knio.output_tables[0]</div>
              <div>pd.DataFrame()</div>
              <div>np.array()</div>
            </div>
          </div>
        </template>

        <template #bottom-pane-status-label>
          <span style="color: #28A745;">Demo: Ready</span>
        </template>

        <template #bottomPaneTabSlot:console>
          <OutputConsole
            class="console"
            @console-created="
              (console: ConsoleHandler) => {
                setConsoleHandler(console);
                initConsoleEventHandler();
              }
            "
          />
        </template>

        <template #bottomPaneTabControlsSlot:console>
          <button 
            @click="consoleHandler.clear"
            style="
              padding: 4px 8px;
              background: #DC3545;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            "
          >
            Clear
          </button>
        </template>
      </ScriptingEditor>
    </template>
    <template v-else>
      <div class="loading">
        <LoadingIcon />
        <p>Loading Demo...</p>
      </div>
    </template>
  </main>
</template>

<style>
@import url("@knime/styles/css");

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.console {
  height: 100%;
}
</style>
