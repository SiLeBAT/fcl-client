import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { ColorsAndShapesConditionInputData, ColorsAndShapesInputData, HighlightingConditionToDelete } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-view',
    templateUrl: './colors-and-shapes-view.component.html',
    styleUrls: ['./colors-and-shapes-view.component.scss']
})
export class ColorsAndShapesViewComponent {

    @Input() colorsAndShapesHighlightings: StationHighlightingData[] = [];
    @Input() inputData: ColorsAndShapesInputData;

    @Output() colorsAndShapesConditionsChange = new EventEmitter<StationHighlightingData[]>();
    @Output() colorsAndShapesConditionsDelete = new EventEmitter<HighlightingConditionToDelete>();
    @Output() editIndexChange = new EventEmitter<number | null>();

    get colorsAndShapesConditionInputData(): ColorsAndShapesConditionInputData {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesConditionInputData_;
    }

    showHighlightingDialog = false;
    showAddHighlightingButton = true;
    listButtonDisabled = false;

    private processedInput_: ColorsAndShapesInputData | null = null;
    private colorsAndShapesConditionInputData_: ColorsAndShapesConditionInputData | null = null;
    private colorsAndShapesHighlightings_: StationHighlightingData[] | null = null;

    constructor() { }

    onAddColorsAndShapesCondition(): void {
        this.switchShowHighlightingDialogueState();
        this.switchAddButtonState();
        this.switchListButtonState();
    }

    onApplyColorsAndShapesCondition(condition: StationHighlightingData): void {
        let newColorsAndShapesHighlightings: StationHighlightingData[];
        let editIndex = this.processedInput_.editIndex;

        if (this.processedInput_.editIndex === null) {
            newColorsAndShapesHighlightings = [
                ...this.colorsAndShapesHighlightings_,
                condition
            ];
            editIndex = (newColorsAndShapesHighlightings.length - 1);
            this.emitEditIndex(editIndex);
        } else {
            newColorsAndShapesHighlightings = [
                ...this.colorsAndShapesHighlightings_
            ];
            newColorsAndShapesHighlightings[this.processedInput_.editIndex] = condition;
        }

        this.emitColorsAndShapesConditions(newColorsAndShapesHighlightings);
    }

    onCancelHighlightingRule(): void {
        this.switchAddButtonState();
        this.switchShowHighlightingDialogueState();
        this.switchListButtonState();
        this.emitEditIndex(null);
    }

    onOkHighlightingRule(condition: StationHighlightingData): void {
        let newColorsAndShapesHighlightings: StationHighlightingData[];

        if (this.processedInput_.editIndex === null) {
            newColorsAndShapesHighlightings = [
                ...this.colorsAndShapesHighlightings_,
                condition
            ];
        } else {
            newColorsAndShapesHighlightings = [
                ...this.colorsAndShapesHighlightings_
            ];
            newColorsAndShapesHighlightings[this.processedInput_.editIndex] = condition;
            this.emitEditIndex(null);
        }

        this.emitColorsAndShapesConditions(newColorsAndShapesHighlightings);

        this.switchAddButtonState();
        this.switchShowHighlightingDialogueState();
        this.switchListButtonState();
    }

    onDeleteHighlightingCondition(conditionToDelete: HighlightingConditionToDelete) {
        this.colorsAndShapesConditionsDelete.emit(conditionToDelete);
    }

    private emitEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private emitColorsAndShapesConditions(newColorsAndShapesHighlightings: StationHighlightingData[]): void {
        this.colorsAndShapesConditionsChange.emit(newColorsAndShapesHighlightings);
    }

    private switchAddButtonState(): void {
        this.showAddHighlightingButton = !this.showAddHighlightingButton;
    }

    private switchShowHighlightingDialogueState(): void {
        this.showHighlightingDialog = !this.showHighlightingDialog;
    }

    private switchListButtonState() {
        this.listButtonDisabled = !this.listButtonDisabled;
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
