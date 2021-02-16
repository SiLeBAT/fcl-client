import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { ColorsAndShapesConditionInputData, ColorsAndShapesInputData, HighlightingRuleDeleteRequestData } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-view',
    templateUrl: './colors-and-shapes-view.component.html',
    styleUrls: ['./colors-and-shapes-view.component.scss']
})
export class ColorsAndShapesViewComponent {

    @Input() colorsAndShapesHighlightings: StationHighlightingData[] = [];
    @Input() inputData: ColorsAndShapesInputData;

    @Output() colorsAndShapesConditionsChange = new EventEmitter<StationHighlightingData[]>();
    @Output() colorsAndShapesConditionsDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() editIndexChange = new EventEmitter<number | null>();

    get colorsAndShapesConditionInputData(): ColorsAndShapesConditionInputData {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesConditionInputData_;
    }

    get showHighlightingDialog(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    }

    get showAddHighlightingButton(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex === null;
    }

    get listButtonDisabled(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    }

    private processedInput_: ColorsAndShapesInputData | null = null;
    private colorsAndShapesConditionInputData_: ColorsAndShapesConditionInputData | null = null;
    private colorsAndShapesHighlightings_: StationHighlightingData[] | null = null;

    constructor() { }

    onAddColorsAndShapesCondition(): void {
        this.emitEditIndex(this.colorsAndShapesHighlightings_.length);
    }

    onApplyColorsAndShapesCondition(condition: StationHighlightingData): void {
        const newColorsAndShapesHighlightings = this.buildNewColorsAndShapesHighlightings(condition);

        this.emitColorsAndShapesConditions(newColorsAndShapesHighlightings);
    }

    onCancelHighlightingRule(): void {
        this.emitEditIndex(null);
    }

    onOkHighlightingRule(condition: StationHighlightingData): void {
        const newColorsAndShapesHighlightings = this.buildNewColorsAndShapesHighlightings(condition);
        this.emitEditIndex(null);

        this.emitColorsAndShapesConditions(newColorsAndShapesHighlightings);
    }

    onDeleteHighlightingCondition(conditionToDelete: HighlightingRuleDeleteRequestData) {
        this.colorsAndShapesConditionsDelete.emit(conditionToDelete);
    }

    onToggleShowInLegend(rules: StationHighlightingData[]) {
        this.emitColorsAndShapesConditions(rules);
    }

    private buildNewColorsAndShapesHighlightings(condition: StationHighlightingData): StationHighlightingData[] {
        const newColorsAndShapesHighlightings = [
            ...this.colorsAndShapesHighlightings_
        ];
        newColorsAndShapesHighlightings[this.processedInput_.editIndex] = condition;

        return newColorsAndShapesHighlightings;
    }

    private emitEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private emitColorsAndShapesConditions(newColorsAndShapesHighlightings: StationHighlightingData[]): void {
        this.colorsAndShapesConditionsChange.emit(newColorsAndShapesHighlightings);
    }

    private processLastInputIfNecessary(): void {
        if ((this.inputData !== this.processedInput_ && this.inputData)) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateColorsAndShapesConditionInputData();
        this.updateColorsAndShapesHighlightings();

        this.processedInput_ = this.inputData;
    }

    private updateColorsAndShapesConditionInputData(): void {
        if (!this.colorsAndShapesConditionInputData_ ||
            this.inputData.complexFilterSettings !== this.colorsAndShapesConditionInputData_.complexFilterSettings ||
            this.inputData.dataTable !== this.colorsAndShapesConditionInputData_.dataTable) {

            this.colorsAndShapesConditionInputData_ = {
                complexFilterSettings: this.inputData.complexFilterSettings,
                dataTable: this.inputData.dataTable
            };
        }
    }

    private updateColorsAndShapesHighlightings(): void {
        if (!this.colorsAndShapesHighlightings_ ||
            this.colorsAndShapesHighlightings !== this.colorsAndShapesHighlightings_) {
            this.colorsAndShapesHighlightings_ = this.colorsAndShapesHighlightings;
        }
    }

}
