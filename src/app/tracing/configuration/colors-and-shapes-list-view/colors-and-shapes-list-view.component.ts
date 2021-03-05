import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';
import { ColorsAndShapesInputData, ColorsAndShapesEditInputData, HighlightingRuleDeleteRequestData } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-list-view',
    templateUrl: './colors-and-shapes-list-view.component.html',
    styleUrls: ['./colors-and-shapes-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ColorsAndShapesListViewComponent {
    // private static readonly COLORPICKER_DEFAULT_COLOR = [3, 78, 162];

    @Input() colorsAndShapesListHighlightings: StationHighlightingData[] = [];
    @Input() colorsAndShapesListInputData: ColorsAndShapesInputData;

    @Output() deleteHighlightingRule = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() toggleShowInLegendProperty = new EventEmitter<StationHighlightingData[]>();
    @Output() colorsAndShapesRulesChange = new EventEmitter<StationHighlightingData[]>();
    @Output() editIndexChange = new EventEmitter<number | null>();


    get showAddHighlightingRuleButton(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex === null;
    }

    get showHighlightingRuleDialog(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex === this.colorsAndShapesListHighlightings_.length;
    }

    get editIndex(): number {
        this.processLastInputIfNecessary();
        return this.editIndex_;
    }

    get colorsAndShapesEditInputData(): ColorsAndShapesEditInputData {
        this.processLastInputIfNecessary();
        return this.colorsAndShapesListInputData_;
    }

    get listButtonDisabled(): boolean {
        this.processLastInputIfNecessary();
        return this.processedInput_ !== null && this.processedInput_.editIndex !== null;
    }

    get stationHighlightingRule(): StationHighlightingData {
        return this.stationHighlightingRule_;
    }

    private processedInput_: ColorsAndShapesInputData | null = null;
    private colorsAndShapesListInputData_: ColorsAndShapesEditInputData | null = null;
    private colorsAndShapesListHighlightings_: StationHighlightingData[] | null = null;
    private editIndex_: number | null = null;
    private stationHighlightingRule_: StationHighlightingData | null = null;

    onAddColorsAndShapesRule(): void {

        console.log('ColorsAndShapesListViewComponent, onAddColorsAndShapesRule');

        this.emitEditIndex(this.colorsAndShapesListHighlightings_.length);
        this.stationHighlightingRule_ = null;
    }

    onEditHighlightingRule(rule: StationHighlightingData, index: number) {

        this.emitEditIndex(index);
        this.stationHighlightingRule_ = rule;

        console.log('ColorsAndShapesListViewComponent, onEditHighlightingRule, rule: ', rule);

    }

    onDeleteHighlightingRule(event: MouseEvent, rule: StationHighlightingData, indexToDelete: number) {
        const newColorsAndShapesHighlightings = this.colorsAndShapesListHighlightings
            .filter((item, index) => index !== indexToDelete);

        this.deleteHighlightingRule.emit({
            highlightingData: newColorsAndShapesHighlightings,
            highlightingRule: rule,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleShowInLegend(index: number) {
        const showInLegend: boolean = this.colorsAndShapesListHighlightings[index].showInLegend;
        const newColorsAndShapesHighlightings = [
            ...this.colorsAndShapesListHighlightings
        ];
        newColorsAndShapesHighlightings[index].showInLegend = !showInLegend;

        this.toggleShowInLegendProperty.emit(newColorsAndShapesHighlightings);
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

    private buildNewColorsAndShapesHighlightings(rule: StationHighlightingData): StationHighlightingData[] {
        const newColorsAndShapesHighlightings = [
            ...this.colorsAndShapesListHighlightings_
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

    // private createDefaultRule(): StationHighlightingData {
    //     return {
    //         name: '',
    //         showInLegend: true,
    //         color: ColorsAndShapesListViewComponent.COLORPICKER_DEFAULT_COLOR,
    //         invisible: false,
    //         adjustThickness: false,
    //         labelProperty: null,
    //         valueCondition: null,
    //         logicalConditions: [],
    //         shape: null
    //     };

    // }

    private processLastInputIfNecessary(): void {
        if ((this.colorsAndShapesListInputData !== this.processedInput_ && this.colorsAndShapesListInputData)) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateColorsAndShapesListInputData();
        this.updateColorsAndShapesListHighlightings();

        this.processedInput_ = this.colorsAndShapesListInputData;
        this.editIndex_ = this.processedInput_.editIndex;
    }

    private updateColorsAndShapesListInputData(): void {
        if (!this.colorsAndShapesListInputData_ ||
            this.colorsAndShapesListInputData.complexFilterSettings !== this.colorsAndShapesListInputData_.complexFilterSettings ||
            this.colorsAndShapesListInputData.dataTable !== this.colorsAndShapesListInputData_.dataTable) {

            this.colorsAndShapesListInputData_ = {
                complexFilterSettings: this.colorsAndShapesListInputData.complexFilterSettings,
                dataTable: this.colorsAndShapesListInputData.dataTable
            };
        }
    }

    private updateColorsAndShapesListHighlightings(): void {
        if (!this.colorsAndShapesListHighlightings_ ||
            this.colorsAndShapesListHighlightings !== this.colorsAndShapesListHighlightings_) {
            this.colorsAndShapesListHighlightings_ = this.colorsAndShapesListHighlightings;
        }
    }

}
