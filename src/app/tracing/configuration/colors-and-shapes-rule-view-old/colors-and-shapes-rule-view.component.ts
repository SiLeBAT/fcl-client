import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { LogicalCondition, NodeShapeType, StationHighlightingData, TableColumn } from '@app/tracing/data.model';
import { ColorsAndShapesRuleInputData, ExtendedOperationType, LogicalFilterCondition, PropValueMap } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-colors-and-shapes-rule-view',
    templateUrl: './colors-and-shapes-rule-view.component.html',
    styleUrls: ['./colors-and-shapes-rule-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ColorsAndShapesRuleViewComponent {

    private static readonly COLORPICKER_DEFAULT_COLOR = 'rgba(3, 78, 162)';
    private static readonly DISABLED_ACTION_TOOLTIP = 'Please select color and/or shape as well as conditions';
    private static readonly ENABLED_APPLY_TOOLTIP = 'Apply Highlighting Rule';
    private static readonly ENABLED_OK_TOOLTIP = 'Apply Highlighting Rule and close dialogue';

    @Input() inputData: ColorsAndShapesRuleInputData;

    @Output() applyColorsAndShapesRule = new EventEmitter<StationHighlightingData>();
    @Output() cancelColorsAndShapesRule = new EventEmitter();
    @Output() okColorsAndShapesRule = new EventEmitter<StationHighlightingData>();

    availableShapeTypes: (NodeShapeType | null)[] = [
        null,
        NodeShapeType.CIRCLE,
        NodeShapeType.DIAMOND,
        NodeShapeType.HEXAGON,
        NodeShapeType.OCTAGON,
        NodeShapeType.PENTAGON,
        NodeShapeType.SQUARE,
        NodeShapeType.STAR,
        NodeShapeType.TRIANGLE
    ];

    availableOperatorTypes: ExtendedOperationType[] = [
        ExtendedOperationType.EQUAL,
        ExtendedOperationType.GREATER,
        ExtendedOperationType.NOT_EQUAL,
        ExtendedOperationType.LESS,
        ExtendedOperationType.REGEX_EQUAL,
        ExtendedOperationType.REGEX_NOT_EQUAL,
        ExtendedOperationType.REGEX_EQUAL_IGNORE_CASE,
        ExtendedOperationType.REGEX_NOT_EQUAL_IGNORE_CASE
    ];

    color: string = ColorsAndShapesRuleViewComponent.COLORPICKER_DEFAULT_COLOR;

    get complexFilterSettings(): LogicalFilterCondition[] {
        this.processLastInputIfNecessary();
        return this.complexFilterConditions_;
    }

    get dataColumns(): TableColumn[] {
        this.processLastInputIfNecessary();
        return this.dataColumns_;
    }

    get propToValuesMap(): PropValueMap {
        this.processLastInputIfNecessary();
        return this.propToValuesMap_;
    }

    get actionButtonDisabled(): boolean {
        return ((this.stationHighlightingRule_.shape === null &&
                this.stationHighlightingRule_.color === null) ||
                this.stationHighlightingRule_.logicalConditions.length === 0);
    }

    get applyTooltip(): String {
        return this.actionButtonDisabled ?
            ColorsAndShapesRuleViewComponent.DISABLED_ACTION_TOOLTIP :
            ColorsAndShapesRuleViewComponent.ENABLED_APPLY_TOOLTIP;
    }

    get okTooltip(): String {
        return this.actionButtonDisabled ?
            ColorsAndShapesRuleViewComponent.DISABLED_ACTION_TOOLTIP :
            ColorsAndShapesRuleViewComponent.ENABLED_OK_TOOLTIP;
    }

    private processedInput_: ColorsAndShapesRuleInputData | null = null;
    private complexFilterConditions_: LogicalFilterCondition[] | null = null;
    private dataColumns_: TableColumn[] | null = null;
    private propToValuesMap_: PropValueMap | null = null;
    private stationHighlightingRule_: StationHighlightingData = this.createDefaultRule();

    constructor() { }

    onRuleNameChange(ruleName: string): void {
        this.stationHighlightingRule_ = {
            ...this.stationHighlightingRule_,
            name: ruleName
        };
    }

    onShapeChange(shapeType: (NodeShapeType | null)): void {
        this.stationHighlightingRule_ = {
            ...this.stationHighlightingRule_,
            shape: shapeType
        };
    }

    onComplexFilterChange(conditions: LogicalFilterCondition[]): void {
        const logicalConditions = this.logicalFilterConditionToLogicalCondition(conditions);
        this.stationHighlightingRule_ = {
            ...this.stationHighlightingRule_,
            logicalConditions: logicalConditions
        };
    }

    onApplyRule(): void {
        this.applyColorsAndShapesRule.emit(this.stationHighlightingRule_);
    }

    onCancelRule(): void {
        this.cancelColorsAndShapesRule.emit();
    }

    onOkRule(): void {
        this.okColorsAndShapesRule.emit(this.stationHighlightingRule_);
    }

    onColorChange(color: string): void {
        this.color = color;
        const highlightingColor = this.convertColorToHighlightingColor(color);
        this.stationHighlightingRule_ = {
            ...this.stationHighlightingRule_,
            color: highlightingColor
        };
    }

    private logicalFilterConditionToLogicalCondition(conditions: LogicalFilterCondition[]): LogicalCondition[][] {
        const logicalConditions: LogicalCondition[][] = ComplexFilterUtils.groupConditions(conditions);

        return logicalConditions;
    }

    private convertColorToHighlightingColor(color: string): number[] {
        const highlightingColor: number[] = color
            .match(/\((.+?)\)/)[1]
            .split(',')
            .map(x => parseInt(x, 10))
            .slice(0, 3);

        return highlightingColor;
    }

    private processLastInputIfNecessary(): void {
        if (this.inputData !== this.processedInput_ && this.inputData) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateComplexFilterConditions();
        this.updateDataColumns();
        this.updatePropValueMap();

        this.processedInput_ = this.inputData;
    }

    private updateComplexFilterConditions(): void {
        if (!this.complexFilterConditions_ ||
            this.inputData.complexFilterSettings !== this.processedInput_.complexFilterSettings) {
            this.complexFilterConditions_ = this.inputData.complexFilterSettings.conditions;
        }
    }

    private updateDataColumns(): void {
        if (!this.dataColumns_ || this.inputData.dataTable.columns !== this.processedInput_.dataTable.columns) {
            this.dataColumns_ = ComplexFilterUtils.extractDataColumns(this.inputData.dataTable);
        }
    }

    private updatePropValueMap(): void {
        if (!this.processedInput_ ||
            this.processedInput_.dataTable.rows !== this.inputData.dataTable.rows) {
            this.propToValuesMap_ = ComplexFilterUtils.extractPropValueMap(this.inputData.dataTable, this.dataColumns_);
        }
    }

    private createDefaultRule(): StationHighlightingData {
        return {
            name: '',
            showInLegend: true,
            color: this.convertColorToHighlightingColor(ColorsAndShapesRuleViewComponent.COLORPICKER_DEFAULT_COLOR),
            invisible: false,
            adjustThickness: false,
            labelProperty: null,
            valueCondition: null,
            logicalConditions: [],
            shape: null
        };

    }
}
