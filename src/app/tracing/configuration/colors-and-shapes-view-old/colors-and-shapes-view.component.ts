import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { ColorsAndShapesRuleInputData, ColorsAndShapesInputData, HighlightingRuleDeleteRequestData } from '../configuration.model';

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

    get colorsAndShapesRuleInputData(): ColorsAndShapesRuleInputData {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesRuleInputData_;
    }

    get showHighlightingRuleDialog(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    }

    get showAddHighlightingRuleButton(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex === null;
    }

    get listButtonDisabled(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    }

    private processedInput_: ColorsAndShapesInputData | null = null;
    private colorsAndShapesRuleInputData_: ColorsAndShapesRuleInputData | null = null;
    private colorsAndShapesHighlightings_: StationHighlightingData[] | null = null;

    constructor() { }

    onAddColorsAndShapesRule(): void {
        this.emitEditIndex(this.colorsAndShapesHighlightings_.length);
    }

    onApplyColorsAndShapesRule(rule: StationHighlightingData): void {
        const newColorsAndShapesHighlightings = this.buildNewColorsAndShapesHighlightings(rule);

        this.emitColorsAndShapesRules(newColorsAndShapesHighlightings);
    }

    onCancelColorsAndShapesRule(): void {
        this.emitEditIndex(null);
    }

    onOkColorsAndShapesRule(rule: StationHighlightingData): void {
        const newColorsAndShapesHighlightings = this.buildNewColorsAndShapesHighlightings(rule);
        this.emitEditIndex(null);

        this.emitColorsAndShapesRules(newColorsAndShapesHighlightings);
    }

    onDeleteHighlightingRule(ruleToDelete: HighlightingRuleDeleteRequestData) {
        this.colorsAndShapesRulesDelete.emit(ruleToDelete);
    }

    onToggleShowInLegend(rules: StationHighlightingData[]) {
        this.emitColorsAndShapesRules(rules);
    }

    onChangeEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private buildNewColorsAndShapesHighlightings(rule: StationHighlightingData): StationHighlightingData[] {
        const newColorsAndShapesHighlightings = [
            ...this.colorsAndShapesHighlightings_
        ];
        newColorsAndShapesHighlightings[this.processedInput_.editIndex] = rule;

        return newColorsAndShapesHighlightings;
    }

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
        this.updateColorsAndShapesRulesInputData();
        this.updateColorsAndShapesHighlightings();

        this.processedInput_ = this.inputData;
    }

    private updateColorsAndShapesRulesInputData(): void {
        if (!this.colorsAndShapesRuleInputData_ ||
            this.inputData.complexFilterSettings !== this.colorsAndShapesRuleInputData_.complexFilterSettings ||
            this.inputData.dataTable !== this.colorsAndShapesRuleInputData_.dataTable) {

            this.colorsAndShapesRuleInputData_ = {
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
