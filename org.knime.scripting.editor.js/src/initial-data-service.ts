import {
  getScriptingService,
  type GenericInitialData,
} from "@/scripting-service";
import { ref } from "vue";

const settingsLoaded = ref(false);
const loadDataPromise = getScriptingService()
  .getInitialData()
  .then((data: GenericInitialData): GenericInitialData => {
    settingsLoaded.value = true;
    return data;
  });

const initialDataService = {
  getInitialData: () => loadDataPromise,
  isInitialDataLoaded: () => settingsLoaded.value,
};
export type InitialDataServiceType = typeof initialDataService;

export const getInitialDataService = (): InitialDataServiceType =>
  initialDataService;
