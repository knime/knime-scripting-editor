import type { InputOutputModel } from "@/components/InputOutputItem.vue";
import { getSettingsHelper } from "@/settings-helper";

export type PortViewConfig = {
  label: string;
  portViewIdx: number;
};

export type PortConfig = {
  /**
   * null if no node is connected to an input port
   */
  nodeId: string | null;
  portIdx: number;
  portViewConfigs: PortViewConfig[];
  portName: string;
};

export type PortConfigs = {
  inputPorts: PortConfig[];
};

export type ConnectionStatus =
  /** The input is not connected */
  | "MISSING_CONNECTION"
  /** The input is connected, but the predecessor is not configured */
  | "UNCONFIGURED_CONNECTION"
  /** The input is connected and configured, but the predecessor is not executed */
  | "UNEXECUTED_CONNECTION"
  /** The input is connected, configured, and executed */
  | "OK";

export type InputConnectionInfo = {
  status: ConnectionStatus;
  isOptional: boolean;
};

export type KAIConfig = {
  hubId: string;
  isKaiEnabled: boolean;
};

export type GenericInitialData = {
  inputPortConfigs: PortConfigs;
  inputObjects: InputOutputModel[];
  flowVariables: InputOutputModel;
  inputConnectionInfo: InputConnectionInfo[];
  outputObjects?: InputOutputModel[];
  kAiConfig: KAIConfig;
};

const loadDataPromise = getSettingsHelper()
  .getInitialDataAndSettings()
  .then((data): GenericInitialData => data.initialData);

const initialDataService = {
  getInitialData: () => loadDataPromise,
};
export type InitialDataServiceType = typeof initialDataService;

export const getInitialDataService = (): InitialDataServiceType =>
  initialDataService;
