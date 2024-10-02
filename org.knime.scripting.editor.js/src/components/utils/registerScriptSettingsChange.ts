import { getSettingsService } from "@/settings-service";
import { watch } from "vue";

export const registerScriptSettingsChange = async (
  modelOrView: "model" | "view",
  getScript: () => string,
) => {
  const register = await getSettingsService().registerSettings(modelOrView);
  const onScriptChange = register(getScript());
  watch(getScript, () => {
    onScriptChange.setValue(getScript());
  });
};
