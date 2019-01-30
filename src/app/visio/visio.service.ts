import { FclElements } from '../util/datatypes';
import { VisioLayoutComponent, VisioLayoutData } from './visio-dialog/visio-dialog.component';
import { MatDialog } from '@angular/material';
import { SvgRenderer } from './layout-engine/svg-renderer';
import { VisioReport, ReportType } from './layout-engine/datatypes';
import { VisioReporter } from './layout-engine/visio-reporter';
import { StationByCountryGrouper } from './layout-engine/station-by-country-grouper';

function getFontMetricCanvas(): any {

}

export function showVisioGraph(data: FclElements, dialogService: MatDialog) {
    // const visioGraph: any = null;
    const stationGrouper = new StationByCountryGrouper();
    const report: VisioReport = VisioReporter.createReport(data, getFontMetricCanvas, ReportType.Confidential, stationGrouper);
    const layoutData: VisioLayoutData = { data: SvgRenderer.renderReport(report) };
    dialogService.open(VisioLayoutComponent, layoutData).afterClosed().subscribe(() => {

    });
}

export function generateVisioReport(data: FclElements): VisioReport {
    const stationGrouper = new StationByCountryGrouper();
    const report: VisioReport = VisioReporter.createReport(data, getFontMetricCanvas, ReportType.Confidential, stationGrouper);

    return report;
}
