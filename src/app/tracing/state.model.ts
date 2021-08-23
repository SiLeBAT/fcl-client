import { FclData } from './data.model';
import { VisioReport } from './visio/layout-engine/datatypes';
import { ConfigurationTabIndex, FilterSettings, HighlightingConfigurationSettings } from './configuration/configuration.model';
import { ROASettings } from './visio/model';

export interface ModelDependentState {
    visioReport: VisioReport | null;
    roaSettings: ROASettings | null;
    filterSettings: FilterSettings;
    highlightingConfigurationSettings: HighlightingConfigurationSettings;
}

export interface TracingState extends ModelDependentState {
    fclData: FclData;
    showGraphSettings: boolean;
    showConfigurationSideBar: boolean;
    configurationTabIndices: ConfigurationTabIndex;
    tracingActive: boolean;
}
