import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { LogicalCondition, NodeShapeType, OperationType, StationHighlightingData, TableColumn } from '@app/tracing/data.model';
import { ColorsAndShapesEditInputData, ComplexFilterCondition, ExtendedOperationType, JunktorType, LogicalFilterCondition, PropValueMap } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-colors-and-shapes-edit-view',
    templateUrl: './colors-and-shapes-edit-view.component.html',
    styleUrls: ['./colors-and-shapes-edit-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ColorsAndShapesRuleViewComponent {

    private static readonly COLORPICKER_DEFAULT_COLOR = 'rgba(3, 78, 162)';
    private static readonly DISABLED_ACTION_TOOLTIP = 'Please select color and/or shape as well as conditions';
    private static readonly ENABLED_APPLY_TOOLTIP = 'Apply Highlighting Rule';
    private static readonly ENABLED_OK_TOOLTIP = 'Apply Highlighting Rule and close dialogue';

    @Input() inputData: ColorsAndShapesEditInputData;
    @Input() stationHighlightingRule: StationHighlightingData;

    // @Input() set stationHighlightingRule(value: StationHighlightingData) {
        // if (value !== null) {
        //     this.stationHighlightingRule_ = value;
        // }

        // this.stationHighlightingRule_ = value === null ? this.createDefaultRule() : value;

    // }

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

    set color(value: string) {
        this.color_ = value;
    }

    get color(): string {
        return this.convertHighlightingColorToColor(this.stationHighlightingRule_.color);
    }

    get complexFilterSettings(): ComplexFilterCondition[] {
        this.processLastInputIfNecessary();
        // return this.complexFilterConditions_;
        // return [];
        return this.logicalConditionToLogicalFilterCondition(this.stationHighlightingRule_.logicalConditions);
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

    get ruleName(): String {
        return this.stationHighlightingRule_.name;
    }

    get shape(): NodeShapeType | null {
        return this.stationHighlightingRule_.shape;
    }

    private processedInput_: ColorsAndShapesEditInputData | null = null;
    private complexFilterConditions_: LogicalFilterCondition[] | null = null;
    private dataColumns_: TableColumn[] | null = null;
    private propToValuesMap_: PropValueMap | null = null;
    private stationHighlightingRule_: StationHighlightingData = this.createDefaultRule();
    private color_: string | null = null;

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

        console.log('onComplexFilterChange, conditions: ', conditions);

        let logicalConditions: LogicalCondition[][] = this.logicalFilterConditionToLogicalCondition(conditions);
        const flatLogicalConditions = [].concat(...logicalConditions);
        if (flatLogicalConditions.length < conditions.length) {
            const lastCondition = conditions[conditions.length - 1];
            logicalConditions.push([{
                propertyName: lastCondition.property,
                operationType: lastCondition.operation as unknown as OperationType,
                value: lastCondition.value as string
            }]);
        }
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

    private logicalConditionToLogicalFilterCondition(conditions: LogicalCondition[][]): ComplexFilterCondition[] {

        // console.log('logicalConditionToLogicalFiltercondition, conditions: ', conditions);

        const filterConditions: ComplexFilterCondition[] = [];

        for (const orConditions of conditions) {
            for (const andCondition of orConditions) {
                const filterCondition: ComplexFilterCondition = {
                    property: andCondition.propertyName,
                    operation: andCondition.operationType as unknown as ExtendedOperationType,
                    value: andCondition.value,
                    junktor: JunktorType.AND
                };
                if (andCondition === orConditions[orConditions.length - 1]) {
                    filterCondition.junktor = JunktorType.OR
                };
                filterConditions.push(filterCondition);
            }
        }

        return filterConditions;

    }

    private convertColorToHighlightingColor(color: string): number[] {
        const highlightingColor: number[] = color
            .match(/\((.+?)\)/)[1]
            .split(',')
            .map(x => parseInt(x, 10))
            .slice(0, 3);

        return highlightingColor;
    }

    private convertHighlightingColorToColor(color: number[]): string {
        const [r, g, b] = color;

        return `rgba(${r}, ${g}, ${b})`;

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
        this.updateStationHighlightingRule();

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

    private updateStationHighlightingRule() {
        this.stationHighlightingRule_ = this.stationHighlightingRule === null ? this.createDefaultRule() : this.stationHighlightingRule;
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
