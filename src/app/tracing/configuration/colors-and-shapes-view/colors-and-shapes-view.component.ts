import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { ColorsAndShapesInputData, HighlightingRuleDeleteRequestData } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-view',
    templateUrl: './colors-and-shapes-view.component.html',
    styleUrls: ['./colors-and-shapes-view.component.scss']
})
export class ColorsAndShapesViewComponent {

    @Input() colorsAndShapesHighlightings: StationHighlightingData[] = [];
    @Input() inputData: ColorsAndShapesInputData;

    @Output() colorsAndShapesRulesChange = new EventEmitter<StationHighlightingData[]>();
    @Output() colorsAndShapesRulesDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() editIndexChange = new EventEmitter<number | null>();

    get colorsAndShapesListInputData(): ColorsAndShapesInputData {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesInputData_;
    }

    get colorsAndShapesListHighlightings(): StationHighlightingData[] {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesHighlightings_;
    }

    // get showHighlightingRuleDialog(): boolean {
    //     this.processLastInputIfNecessary();
    //     return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    // }

    // get showAddHighlightingRuleButton(): boolean {
    //     this.processLastInputIfNecessary();
    //     return this.processedInput_ !== null && this.processedInput_.editIndex === null;
    // }

    // get listButtonDisabled(): boolean {
    //     this.processLastInputIfNecessary();
    //     return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    // }

    private processedInput_: ColorsAndShapesInputData | null = null;
    private colorsAndShapesInputData_: ColorsAndShapesInputData | null = null;
    private colorsAndShapesHighlightings_: StationHighlightingData[] | null = null;

    constructor() { }

    onAddColorsAndShapesRule(): void {
        this.emitEditIndex(this.colorsAndShapesHighlightings_.length);
    }

    // onApplyColorsAndShapesRule(rule: StationHighlightingData): void {
    //     const newColorsAndShapesHighlightings = this.buildNewColorsAndShapesHighlightings(rule);

    //     this.emitColorsAndShapesRules(newColorsAndShapesHighlightings);
    // }

    // onCancelColorsAndShapesRule(): void {
    //     this.emitEditIndex(null);
    // }

    // onOkColorsAndShapesRule(rule: StationHighlightingData): void {
    //     const newColorsAndShapesHighlightings = this.buildNewColorsAndShapesHighlightings(rule);
    //     this.emitEditIndex(null);

    //     this.emitColorsAndShapesRules(newColorsAndShapesHighlightings);
    // }

    onDeleteHighlightingRule(ruleToDelete: HighlightingRuleDeleteRequestData) {
        this.colorsAndShapesRulesDelete.emit(ruleToDelete);
    }

    onToggleShowInLegend(rules: StationHighlightingData[]) {
        this.emitColorsAndShapesRules(rules);
    }

    onChangeEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    onChangeColorsAndShapesRules(newColorsAndShapesHighlightings: StationHighlightingData[]) {
        // this.colorsAndShapesHighlightings_ = newColorsAndShapesHighlightings;
        // const newHighlightingRules = this.colorsAndShapesHighlightings_.concat(this.restHighlightings_);
        this.colorsAndShapesRulesChange.emit(newColorsAndShapesHighlightings);
        // this.highlightingRulesChange.emit(newHighlightingRules);
    }

    // private buildNewColorsAndShapesHighlightings(rule: StationHighlightingData): StationHighlightingData[] {
    //     const newColorsAndShapesHighlightings = [
    //         ...this.colorsAndShapesHighlightings_
    //     ];
    //     newColorsAndShapesHighlightings[this.processedInput_.editIndex] = rule;

    //     return newColorsAndShapesHighlightings;
    // }

    private emitEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private emitColorsAndShapesRules(newColorsAndShapesHighlightings: StationHighlightingData[]): void {
        this.colorsAndShapesRulesChange.emit(newColorsAndShapesHighlightings);
    }

    private processLastInputIfNecessary(): void {
        if ((this.inputData !== this.processedInput_ && this.inputData)) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateColorsAndShapesInputData();
        this.updateColorsAndShapesHighlightings();

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
            this.colorsAndShapesHighlightings !== this.colorsAndShapesHighlightings_) {
            this.colorsAndShapesHighlightings_ = this.colorsAndShapesHighlightings;
        }
    }

}
