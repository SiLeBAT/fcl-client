import { FclElements } from '../util/datatypes';
import { VisioLayoutComponent, VisioLayoutData } from './visio-dialog/visio-dialog.component';
import { MatDialog } from '@angular/material';
import { VisioReport, VisioEngineConfiguration, StationGroupType, NodeLayoutInfo, ReportType } from './layout-engine/datatypes';
import { VisioReporter } from './layout-engine/visio-reporter';
import { StationByCountryGrouper } from './layout-engine/station-by-country-grouper';

function getFontMetricCanvas(): any {

}

function requestVisioEngineConfiguration(dialogService: MatDialog): Promise<VisioEngineConfiguration> {
    const layoutData: VisioLayoutData = { data: null };
    return dialogService.open(VisioLayoutComponent, layoutData).afterClosed().toPromise<VisioEngineConfiguration>();
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
    nodeInfoMap: Map<string, NodeLayoutInfo>,
    dialogService: MatDialog
    ): Promise<VisioReport> {

    const engineConf: VisioEngineConfiguration = {
        reportType: ReportType.Confidential,
        groupType: StationGroupType.Country
    };

    return createReport(data, nodeInfoMap, engineConf);
}
