import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DataTable, StationHighlightingData } from '@app/tracing/data.model';
import { ComplexRowFilterSettings } from '../configuration.model';
import { HighlightingConditionInputData } from '../highlighting-station-condition-view/highlighting-station-condition-view.component';
export interface HighlightingInputData {
    dataTable: DataTable;
    stationHighlightingData: StationHighlightingData[];
    complexFilterSettings: ComplexRowFilterSettings;
}

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HighlightingStationViewComponent {
    @Input() inputData: HighlightingInputData;
    @Output() highlightingConditionChange = new EventEmitter<StationHighlightingData[]>();

    get colorAndShapeHighlightings(): StationHighlightingData[] {
        this.processLastInputIfNecessary();
        return this.colorAndShapeHighlightings_;

    }

    get highlightingStationConditionViewInputData(): HighlightingConditionInputData {
        this.processLastInputIfNecessary();
        return this.highlightingStationConditionViewInputData_;
    }

    showHighlightingDialog = false;
    addButtonDisabled = false;
    labelsOpenState = false;
    stationSizeOpenState = false;
    coloursAndShapesOpenState = false;

    private processedInput_: HighlightingInputData | null = null;
    private colorAndShapeHighlightings_: StationHighlightingData[] | null = null;
    private highlightingStationConditionViewInputData_: HighlightingConditionInputData | null = null;

    constructor() { }

    onAddHighlightingRule(): void {
        this.switchShowHighlightingDialogueState();
        this.switchAddButtonState();
    }

    onDeleteHighlightingRule() {
    }

    onApplyHighlightingRule(newHighlightingRule: StationHighlightingData): void {
        this.changeHighlightingConditionAndEmit(newHighlightingRule);
    }

    onCancelHighlightingRule(): void {
        this.switchAddButtonState();
        this.switchShowHighlightingDialogueState();
    }

    onOkHighlightingRule(newHighlightingRule: StationHighlightingData): void {
        this.changeHighlightingConditionAndEmit(newHighlightingRule);
        this.switchAddButtonState();
        this.switchShowHighlightingDialogueState();
    }

    private changeHighlightingConditionAndEmit(newHighlightingRule: StationHighlightingData): void {
        const stationHighlightingData: StationHighlightingData[] = [
            ...this.colorAndShapeHighlightings,
            newHighlightingRule
        ];

        this.highlightingConditionChange.emit(stationHighlightingData);
    }

    private switchAddButtonState(): void {
        this.addButtonDisabled = !this.addButtonDisabled;
    }

    private switchShowHighlightingDialogueState(): void {
        this.showHighlightingDialog = !this.showHighlightingDialog;
    }

    private processLastInputIfNecessary(): void {
        if (this.inputData !== this.processedInput_ && this.inputData) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateColorAndShapeHighlightings();
        this.updateHighlightingConditionViewInputData();
        this.processedInput_ = this.inputData;
    }

    private updateHighlightingConditionViewInputData(): void {
        if (!this.highlightingStationConditionViewInputData_ ||
            this.inputData.complexFilterSettings !== this.highlightingStationConditionViewInputData_.complexFilterSettings ||
            this.inputData.dataTable !== this.highlightingStationConditionViewInputData_.dataTable) {

            this.highlightingStationConditionViewInputData_ = {
                complexFilterSettings: this.inputData.complexFilterSettings,
                dataTable: this.inputData.dataTable
            };
        }
    }

    private updateColorAndShapeHighlightings(): void {
        if (!this.colorAndShapeHighlightings_ ||
            this.inputData.stationHighlightingData !== this.processedInput_.stationHighlightingData) {
            this.colorAndShapeHighlightings_ = this.inputData.stationHighlightingData.filter((item: StationHighlightingData) => {
                return (item.color || (item.shape !== undefined && item.shape !== null));
            });
        }
    }
}
