import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import * as storeActions from '../../state/tracing.actions';
import * as roaActions from '../visio.actions';
import { Utils } from '@app/tracing/util/non-ui-utils';
import { ROASettings, ROALabelSettings, LabelElementInfo, TextElementInfo, PropElementInfo } from '@app/tracing/data.model';
import { take } from 'rxjs/operators';
import * as TracingSelectors from '../../state/tracing.selectors';
import { createDefaultROASettings, State } from '@app/tracing/state/tracing.reducers';
import * as _ from 'lodash';
import { getPublicStationProperties, getLotProperties, getSampleProperties, PropInfo } from '@app/tracing/shared/property-info';
import { DataService } from '@app/tracing/services/data.service';

function propCompare(propA: PropInfo, propB: PropInfo): number {
    const textA = propA.label !== undefined ? propA.label : propA.prop;
    const textB = propB.label !== undefined ? propB.label : propB.prop;
    return textA.toUpperCase().localeCompare(textB.toUpperCase());
}

function sortProps(props: PropInfo[]): PropInfo[] {
    return props.sort(propCompare);
}

export interface ReportConfigurationData {

}

interface LabelInfo {
    title: string;
    labelElements: LabelElementInfo[][];
    availableProps: PropInfo[];
}

@Component({
    selector: 'fcl-report-configuration',
    templateUrl: './report-configuration.component.html',
    styleUrls: ['./report-configuration.component.scss']
})
export class ReportConfigurationComponent {

    availableProps: {
        companyProps: PropInfo[],
        lotProps: PropInfo[],
        sampleProps: PropInfo[]
    };

    labelInfos: { [key in (keyof ROALabelSettings)]: LabelInfo };

    labelOrder: (keyof ROALabelSettings)[] = ['stationLabel', 'lotLabel', 'lotSampleLabel', 'stationSampleLabel'];

    constructor(
        private store: Store<State>,
        private dataService: DataService,
        public dialogRef: MatDialogRef<ReportConfigurationComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ReportConfigurationData
    ) {
        this.initAvailableProps();
        this.initDefaultLabels();
    }

    private initAvailableProps() {
        this.store
            .pipe(
                select(TracingSelectors.getBasicGraphData),
                take(1)
            )
            .subscribe(
                state => {
                    const data = this.dataService.getData(state);
                    this.availableProps = {
                        companyProps: sortProps(getPublicStationProperties(data.stations)),
                        lotProps: sortProps(getLotProperties(data.deliveries)),
                        sampleProps: sortProps(getSampleProperties(state.fclElements.samples))
                    };
                },
                error => {
                    throw new Error(`error available prop data: ${error}`);
                }
            );
    }

    private setLabelInfos(roaSettings: ROASettings): void {
        this.labelInfos = {
            stationLabel: {
                title: 'Company Box Label',
                availableProps: this.availableProps.companyProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.stationLabel)
            },
            lotLabel: {
                title: 'Lot Box Label',
                availableProps: this.availableProps.lotProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.lotLabel)
            },
            lotSampleLabel: {
                title: 'Lot Sample Box Label',
                availableProps: this.availableProps.sampleProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.lotSampleLabel)
            },
            stationSampleLabel: {
                title: 'Station Sample Box Label',
                availableProps: this.availableProps.sampleProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.stationSampleLabel)
            }
        };
    }

    private getROASettings(): ROASettings {
        return {
            labelSettings: {
                stationLabel: this.createLabelElementInfos(this.labelInfos.stationLabel.labelElements),
                lotLabel: this.createLabelElementInfos(this.labelInfos.lotLabel.labelElements),
                lotSampleLabel: this.createLabelElementInfos(this.labelInfos.lotSampleLabel.labelElements),
                stationSampleLabel: this.createLabelElementInfos(this.labelInfos.lotSampleLabel.labelElements)
            }
        };
    }

    private createLabelElementInfos(labelElements: LabelElementInfo[][]): LabelElementInfo[][] {
        const result: LabelElementInfo[][] = [];
        for (const labelRow of labelElements) {
            const row: LabelElementInfo[] = [];
            for (const labelElement of labelRow) {
                if ((labelElement as PropElementInfo).prop === undefined) {
                    const textElement = labelElement as TextElementInfo;
                    row.push({ text: textElement.text });
                } else {
                    const propElement = labelElement as PropElementInfo;
                    row.push({
                        prop: propElement.prop,
                        altText: propElement.altText
                    });
                }
            }
            result.push(row);
        }
        return result;
    }

    private initDefaultLabels() {
        this.store
            .pipe(
                select(TracingSelectors.getROASettings),
                take(1)
            )
            .subscribe(
                roaSettings => this.setLabelInfos(roaSettings),
                error => {
                    throw new Error(`error loading label data: ${error}`);
                }
            );
    }

    showLabelWarning(label: keyof ROALabelSettings): boolean {
        const labelInfo = this.labelInfos[label];
        const props = Utils.createSimpleStringSet(labelInfo.availableProps.map(p => p.prop));
        return (
            labelInfo.availableProps.length > 0 &&
            labelInfo.labelElements.some(
                labelElementRow => labelElementRow.some(
                    e => (e as PropElementInfo).prop !== undefined && !props[(e as PropElementInfo).prop]
                )
            )
        );
    }

    onGenerateReport() {
        this.store.dispatch(new storeActions.SetROAReportSettingsSOA({ roaSettings: this.getROASettings() }));
        this.store.dispatch(new roaActions.GenerateROAReportMSA());
        this.dialogRef.close();
    }

    onRestoreDefaults() {
        this.setLabelInfos(createDefaultROASettings());
    }
}
