import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import * as storeActions from '../../state/tracing.actions';
import * as roaActions from '../visio.actions';
import { Utils } from '@app/tracing/util/non-ui-utils';
import { BasicGraphState } from '@app/tracing/data.model';
import { take } from 'rxjs/operators';
import * as TracingSelectors from '../../state/tracing.selectors';
import { State } from '@app/tracing/state/tracing.reducers';
import * as _ from 'lodash';
import { getPublicStationProperties, getLotProperties, getSampleProperties, PropInfo } from '@app/tracing/shared/property-info';
import { DataService } from '@app/tracing/services/data.service';
import { combineLatest } from 'rxjs';
import { createDefaultROASettings, getUnitPropFromAmountProp } from '../shared';
import { AmountUnitPair, LabelElementInfo, PropElementInfo, ROALabelSettings, ROASettings, TextElementInfo } from '../model';
import { some } from 'cypress/types/bluebird';

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
    amountUnitPairs: AmountUnitPair[];
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
        this.init();
    }

    private init(): void {
        combineLatest([
            this.store.select(TracingSelectors.getBasicGraphData),
            this.store.select(TracingSelectors.getROASettings)
        ]).pipe(take(1))
        .subscribe(([dataServiceInputState, roaSettings]) => {
            this.initAvailableProps(dataServiceInputState);
            if (roaSettings === null) {
                this.setDefaultLabelInfos();
            } else {
                this.setLabelInfos(roaSettings);
            }
        },
            error => {
                throw new Error(`error load roa configuration state: ${error}`);
            }
        );
    }

    private initAvailableProps(dataServiceInputState: BasicGraphState): void {
        const data = this.dataService.getData(dataServiceInputState);
        this.availableProps = {
            companyProps: sortProps(getPublicStationProperties(data.stations)),
            lotProps: sortProps(getLotProperties(data.deliveries)),
            sampleProps: sortProps(getSampleProperties(dataServiceInputState.fclElements.samples))
        };
    }

    private setAmountUnitPairs(): void {
        if (this.labelInfos.lotLabel.labelElements.length >= 3) {
            const propElements = this.labelInfos.lotLabel.labelElements[2].filter(
                element => (element as PropElementInfo).prop !== undefined
            ) as PropElementInfo[];
            if (propElements.length >= 2) {
                this.labelInfos.lotLabel.amountUnitPairs = [ {
                    amount: propElements[0],
                    unit: propElements[1]
                }];
            }
        }
    }

    private setLabelInfos(roaSettings: ROASettings): void {
        this.labelInfos = {
            stationLabel: {
                title: 'Company Box Label',
                availableProps: this.availableProps.companyProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.stationLabel),
                amountUnitPairs: []
            },
            lotLabel: {
                title: 'Lot Box Label',
                availableProps: this.availableProps.lotProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.lotLabel),
                amountUnitPairs: []
            },
            lotSampleLabel: {
                title: 'Lot Sample Box Label',
                availableProps: this.availableProps.sampleProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.lotSampleLabel),
                amountUnitPairs: []
            },
            stationSampleLabel: {
                title: 'Station Sample Box Label',
                availableProps: this.availableProps.sampleProps,
                labelElements: _.cloneDeep(roaSettings.labelSettings.stationSampleLabel),
                amountUnitPairs: []
            }
        };
        this.setAmountUnitPairs();
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
                        altText: propElement.altText,
                        isNullable: propElement.isNullable
                    });
                }
            }
            result.push(row);
        }
        return result;
    }

    showLabelWarning(label: keyof ROALabelSettings): boolean {
        const labelInfo = this.labelInfos[label];
        const props = Utils.createSimpleStringSet(labelInfo.availableProps.map(p => p.prop));

        for (const labelElementRow of labelInfo.labelElements) {
            const propElements = labelElementRow.filter(e => (e as PropElementInfo).prop !== undefined) as PropElementInfo[];
            const nonNullPropElements = propElements.filter(e => e.prop !== null);
            if (nonNullPropElements.some(e => !props[e.prop])) {
                return true;
            }
        }
        return false;
    }

    private setDefaultLabelInfos(): void {
        const roaSettings = createDefaultROASettings();
        this.setLabelInfos(roaSettings);
        this.initAmountUnits();
    }

    private initAmountUnits(): void {
        for (const labelKey of Object.keys(this.labelInfos)) {
            const labelInfo: LabelInfo = this.labelInfos[labelKey];
            labelInfo.amountUnitPairs.forEach(amountUnitPair => {
                const unit = getUnitPropFromAmountProp(amountUnitPair.amount.prop, labelInfo.availableProps);
                amountUnitPair.unit.prop = unit;
            });
        }
    }

    onGenerateReport() {
        this.store.dispatch(new storeActions.SetROAReportSettingsSOA({ roaSettings: this.getROASettings() }));
        this.store.dispatch(new roaActions.GenerateROAReportMSA());
        this.dialogRef.close();
    }

    onRestoreDefaults() {
        this.setDefaultLabelInfos();
    }
}
