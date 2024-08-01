import { ref } from "vue";
import { getSettingsHelper } from "@/settings-helper";

export type GenericNodeSettings = {
  [key: string]: any;
  settingsAreOverriddenByFlowVariable?: boolean;
};

const settingsLoaded = ref(false);

const loadDataPromise = getSettingsHelper()
  .getInitialDataAndSettings()
  .then((data): GenericNodeSettings => {
    settingsLoaded.value = true;
    return data.settings;
  });

const settingsService = {
  getSettings: () => loadDataPromise,
  areSettingsLoaded: () => settingsLoaded,
  registerSettingsGetterForApply: (settingsGetter: () => GenericNodeSettings) =>
    getSettingsHelper().registerApplyListener(settingsGetter),
};
export type SettingsServiceType = typeof settingsService;

export const getSettingsService = (): SettingsServiceType => settingsService;
