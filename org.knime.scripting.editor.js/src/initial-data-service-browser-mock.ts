import type { GenericInitialData } from "./scripting-service";
import { DEFAULT_INITIAL_DATA } from "./scripting-service-browser-mock";
import { type InitialDataServiceType } from "@/initial-data-service";

const log = (message: any, ...args: any[]) => {
  if (typeof consola === "undefined") {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  } else {
    consola.log(message, ...args);
  }
};

export const createInitialDataServiceMock = (
  data?: GenericInitialData,
): InitialDataServiceType => ({
  getInitialData: () => {
    log("Called initial data service mock getInitialData");
    return Promise.resolve(data ?? DEFAULT_INITIAL_DATA);
  },
  isInitialDataLoaded: () => {
    log("Called initial data service mock isInitialDataLoaded");
    return true;
  },
});
