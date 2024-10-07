import {
  DialogService,
  JsonDataService,
  type SettingState,
} from "@knime/ui-extension-service";
import type { GenericInitialData } from "./initial-data-service";
import type { GenericNodeSettings } from "./settings-service";

type InitialDataAndSettings = {
  initialData: GenericInitialData;
  settings: GenericNodeSettings;
};

let cachedInitialDataAndSettings: InitialDataAndSettings | null = null;

const jsonDataServicePromise = JsonDataService.getInstance();
const dialogServicePromise = DialogService.getInstance();

const loadDataIntoCache = async (): Promise<void> => {
  cachedInitialDataAndSettings = (await (
    await jsonDataServicePromise
  ).initialData()) as InitialDataAndSettings;
};

const getInitialDataAndSettings = async (): Promise<InitialDataAndSettings> => {
  if (!cachedInitialDataAndSettings) {
    await loadDataIntoCache();
  }
  return cachedInitialDataAndSettings!;
};

const registerApplyListener = async (
  settingsGetter: () => GenericNodeSettings,
): Promise<void> => {
  const dialogService = await dialogServicePromise;
  dialogService.setApplyListener(async () => {
    const settings = settingsGetter();
    try {
      await (await jsonDataServicePromise).applyData(settings);
      return { isApplied: true };
    } catch (e) {
      consola.warn("Failed to apply settings", e);
      return { isApplied: false };
    }
  });
};

const registerSettings = async <T>(
  modelOrView: "view" | "model",
): Promise<(initialSetting: T) => SettingState> => {
  const dialogService = await dialogServicePromise;
  return (initialSetting: T) =>
    dialogService.registerSettings(modelOrView)({
      initialValue: initialSetting,
    });
};

export const getSettingsHelper = () => ({
  getInitialDataAndSettings,
  registerApplyListener,
  registerSettings,
});
