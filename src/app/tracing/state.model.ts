import { FclData } from './data.model';
import { VisioReport } from './visio/layout-engine/datatypes';
import { ConfigurationTabIndex, FilterSettings, HighlightingConfigurationSettings } from './configuration/configuration.model';
import { ROASettings } from './visio/model';

export interface TracingState {
    fclData: FclData;
    visioReport: VisioReport | null;
    roaSettings: ROASettings | null;
    showGraphSettings: boolean;
    showConfigurationSideBar: boolean;
    configurationTabIndices: ConfigurationTabIndex;
    filterSettings: FilterSettings;
    highlightingConfigurationSettings: HighlightingConfigurationSettings;
    tracingActive: boolean;
}
