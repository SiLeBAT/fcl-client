import { StationData, DeliveryData, SampleData, StationId, Position } from '../data.model';
import { VisioReport, VisioEngineConfiguration, StationGroupType } from './layout-engine/datatypes';
import { VisioReporter } from './layout-engine/visio-reporter';
import { StationByCountryGrouper } from './layout-engine/station-by-country-grouper';
import { ROASettings } from './model';
import { TempCanvas } from './layout-engine/temp-canvas';

interface FclElements {
    stations: StationData[];
    deliveries: DeliveryData[];
    samples: SampleData[];
}

function getStationGrouperFromType(groupType: StationGroupType) {
    switch (groupType) {
        default:
            return new StationByCountryGrouper();
    }
}

function createReport(
    data: FclElements,
    stationIdToPosMap: Record<StationId, Position>,
    engineConf: VisioEngineConfiguration
): VisioReport {
    const stationGrouper = getStationGrouperFromType(engineConf.groupType);
    const canvas = new TempCanvas();
    const report: VisioReport = VisioReporter.createReport(
        data, stationIdToPosMap, canvas.getCanvasElement(), engineConf.roaSettings, stationGrouper
    );
    canvas.destroy();
    return report;
}

export function generateVisioReport(
    data: FclElements,
    stationIdToPosMap: Record<StationId, Position>,
    roaSettings: ROASettings
): VisioReport {

    const engineConf: VisioEngineConfiguration = {
        groupType: StationGroupType.Country,
        roaSettings: roaSettings
    };

    return createReport(data, stationIdToPosMap, engineConf);
}
