import { StationData, DeliveryData, SampleData } from '../data.model';
import { VisioReport, VisioEngineConfiguration, StationGroupType, NodeLayoutInfo, ReportType } from './layout-engine/datatypes';
import { VisioReporter } from './layout-engine/visio-reporter';
import { StationByCountryGrouper } from './layout-engine/station-by-country-grouper';

interface FclElements {
    stations: StationData[];
    deliveries: DeliveryData[];
    samples: SampleData[];
}

function getFontMetricCanvas(): any {

}

function getStationGrouperFromType(groupType: StationGroupType) {
    switch (groupType) {
        default:
            return new StationByCountryGrouper();
    }
}

function createReport(data: FclElements, nodeInfoMap: Map<string, NodeLayoutInfo>, engineConf: VisioEngineConfiguration): VisioReport {
    const stationGrouper = getStationGrouperFromType(engineConf.groupType);
    const report: VisioReport = VisioReporter.createReport(data, nodeInfoMap, getFontMetricCanvas, engineConf.reportType, stationGrouper);

    return report;
}

export async function generateVisioReport(
    data: FclElements,
    nodeInfoMap: Map<string, NodeLayoutInfo>
    ): Promise<VisioReport> {

    const engineConf: VisioEngineConfiguration = {
        reportType: ReportType.Confidential,
        groupType: StationGroupType.Country
    };

    return createReport(data, nodeInfoMap, engineConf);
}
