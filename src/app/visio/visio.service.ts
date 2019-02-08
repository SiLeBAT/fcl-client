import { FclElements } from '../util/datatypes';
import { VisioLayoutComponent, VisioLayoutData } from './visio-dialog/visio-dialog.component';
import { MatDialog } from '@angular/material';
import { VisioReport, VisioEngineConfiguration, StationGroupType } from './layout-engine/datatypes';
import { VisioReporter } from './layout-engine/visio-reporter';
import { StationByCountryGrouper } from './layout-engine/station-by-country-grouper';

function getFontMetricCanvas(): any {

}

function requestVisioEngineConfiguration(dialogService: MatDialog): Promise<VisioEngineConfiguration> {
    const layoutData: VisioLayoutData = { data: null };
    return dialogService.open(VisioLayoutComponent, layoutData).afterClosed().toPromise();
}

function getStationGrouperFromType(groupType: StationGroupType) {
    switch (groupType) {
        default:
            return new StationByCountryGrouper();
    }
}

function createReport(data: FclElements, engineConf: VisioEngineConfiguration): VisioReport {
    const stationGrouper = getStationGrouperFromType(engineConf.groupType);
    const report: VisioReport = VisioReporter.createReport(data, getFontMetricCanvas, engineConf.reportType, stationGrouper);

    return report;
}

export function generateVisioReport(data: FclElements, dialogService: MatDialog): Promise<VisioReport> {
    return new Promise((resolve, reject) => {
        requestVisioEngineConfiguration(dialogService).then((engineConf) => {
            if (engineConf !== undefined && engineConf !== null) {
                resolve(createReport(data, engineConf));
            } else {
                // user cancel
                reject();
            }
        }).catch(err => {
            if (err !== undefined) {
                throw err;
            }
        });
    });
}
