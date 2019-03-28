import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ReportType, VisioEngineConfiguration, StationGroupType } from '../layout-engine/datatypes';

interface LabeledReportType {
    label: string;
    type: ReportType;
}
export interface VisioLayoutData {
    data: string;
}

@Component({
    selector: 'fcl-visio-dialog-properties',
    templateUrl: './visio-dialog.component.html',
    styleUrls: ['./visio-dialog.component.scss']
})
export class VisioLayoutComponent {

    selectedReportType: LabeledReportType;
    reportTypes: LabeledReportType[] = [{
        type: ReportType.Confidential,
        label: 'Confidential'
    }, {
        type: ReportType.Public,
        label: 'Public'
    }];

    constructor(public dialogRef: MatDialogRef<VisioLayoutComponent>, @Inject(MAT_DIALOG_DATA) public data: string) {
        this.selectedReportType = this.reportTypes[1];
    }

    createReport() {
        const engineConf: VisioEngineConfiguration = {
            reportType: this.selectedReportType.type,
            groupType: StationGroupType.Country
        };

        this.dialogRef.close(engineConf);
    }
}
