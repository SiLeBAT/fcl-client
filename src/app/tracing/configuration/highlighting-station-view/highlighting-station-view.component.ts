import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DataTable, StationHighlightingData } from '@app/tracing/data.model';
import { ColorsAndShapesInputData, ComplexRowFilterSettings, HighlightingRuleDeleteRequestData } from '../configuration.model';
import * as _ from 'lodash';
export interface HighlightingInputData {
    dataTable: DataTable;
    stationHighlightingData: StationHighlightingData[];
    complexFilterSettings: ComplexRowFilterSettings;
    editIndex: number;
}
@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HighlightingStationViewComponent {
    @Input() inputData: HighlightingInputData;
    @Input() indexNewRule: number;

    @Output() highlightingConditionsChange = new EventEmitter<StationHighlightingData[]>();
    @Output() highlightingConditionsDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() editIndexChange = new EventEmitter<number | null>();

    get colorsAndShapesHighlightings(): StationHighlightingData[] {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesHighlightings_;
    }

    get colorsAndShapesInputData(): ColorsAndShapesInputData {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesInputData_;
    }

    labelsOpenState = false;
    stationSizeOpenState = false;
    colorsAndShapesOpenState = false;

    private processedInput_: HighlightingInputData | null = null;
    private colorsAndShapesHighlightings_: StationHighlightingData[] | null = null;
    private restHighlightings_: StationHighlightingData[] | null = null;
    private colorsAndShapesInputData_: ColorsAndShapesInputData | null = null;

    constructor() { }

    onDeleteColorsAndShapesCondition(conditionToDelete: HighlightingRuleDeleteRequestData) {
        const newHighlightingConditions = conditionToDelete.highlightingData.concat(this.restHighlightings_);

        this.highlightingConditionsDelete.emit({
            highlightingData: newHighlightingConditions,
            highlightingCondition: conditionToDelete.highlightingCondition,
            xPos: conditionToDelete.xPos,
            yPos: conditionToDelete.yPos
        });
    }

    onChangeColorsAndShapesConditions(newColorsAndShapesHighlightings: StationHighlightingData[]) {
        this.colorsAndShapesHighlightings_ = newColorsAndShapesHighlightings;
        const newHighlightingConditions = this.colorsAndShapesHighlightings_.concat(this.restHighlightings_);
        this.highlightingConditionsChange.emit(newHighlightingConditions);
    }

    onChangeEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private processLastInputIfNecessary(): void {
        if (this.inputData !== this.processedInput_ && this.inputData) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateColorsAndShapesHighlightings();
        this.updateColorsAndShapesInputData();
        this.processedInput_ = this.inputData;
    }

    private updateColorsAndShapesInputData(): void {
        if (!this.colorsAndShapesInputData_ ||
            this.inputData.complexFilterSettings !== this.colorsAndShapesInputData_.complexFilterSettings ||
            this.inputData.dataTable !== this.colorsAndShapesInputData_.dataTable ||
            this.inputData.editIndex !== this.colorsAndShapesInputData_.editIndex) {

            this.colorsAndShapesInputData_ = {
                complexFilterSettings: this.inputData.complexFilterSettings,
                dataTable: this.inputData.dataTable,
                editIndex: this.inputData.editIndex
            };
        }
    }

    private updateColorsAndShapesHighlightings(): void {
        if (!this.colorsAndShapesHighlightings_ ||
            this.inputData.stationHighlightingData !== this.processedInput_.stationHighlightingData) {

            [this.colorsAndShapesHighlightings_, this.restHighlightings_] = _.partition(this.inputData.stationHighlightingData, item => {
                return (
                    item.color ||
                    (item.shape !== undefined && item.shape !== null)
                );
            });
        }
    }
}
