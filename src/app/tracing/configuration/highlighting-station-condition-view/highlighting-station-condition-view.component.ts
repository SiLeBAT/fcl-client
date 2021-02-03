import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DataTable, LogicalCondition, NodeShapeType, StationHighlightingData, TableColumn } from '@app/tracing/data.model';
import { ComplexRowFilterSettings, ExtendedOperationType, LogicalFilterCondition, PropValueMap } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import * as _ from 'lodash';

export interface HighlightingConditionInputData {
    dataTable: DataTable;
    complexFilterSettings: ComplexRowFilterSettings;
}

@Component({
    selector: 'fcl-highlighting-station-condition-view',
    templateUrl: './highlighting-station-condition-view.component.html',
    styleUrls: ['./highlighting-station-condition-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HighlightingStationConditionViewComponent {
    private static readonly COLORPICKER_DEFAULT_COLOR = 'rgba(0, 0, 0)';

    @Input() inputData: HighlightingConditionInputData;

    @Output() applyHighlightingRule = new EventEmitter<StationHighlightingData>();
    @Output() cancelHighlightingRule = new EventEmitter();
    @Output() okHighlightingRule = new EventEmitter<StationHighlightingData>();

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

    color: string = HighlightingStationConditionViewComponent.COLORPICKER_DEFAULT_COLOR;

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

    private processedInput_: HighlightingConditionInputData | null = null;
    private complexFilterConditions_: LogicalFilterCondition[] | null = null;
    private dataColumns_: TableColumn[] | null = null;
    private propToValuesMap_: PropValueMap | null = null;
    private stationHighlightingCondition_: StationHighlightingData = this.createDefaultCondition();

    constructor() { }

    onRuleNameChange(ruleName: string): void {
        this.stationHighlightingCondition_ = {
            ...this.stationHighlightingCondition_,
            name: ruleName
        };
    }

    onShapeChange(shapeType: (NodeShapeType | null)): void {
        this.stationHighlightingCondition_ = {
            ...this.stationHighlightingCondition_,
            shape: shapeType
        };
    }

    onComplexFilterChange(conditions: LogicalFilterCondition[]): void {
        const logicalConditions = this.logicalFilterConditionToLogicalCondition(conditions);
        this.stationHighlightingCondition_ = {
            ...this.stationHighlightingCondition_,
            logicalConditions: logicalConditions
        };
    }

    onApplyRule(): void {
        this.applyHighlightingRule.emit(this.stationHighlightingCondition_);
    }

    onCancelRule(): void {
        this.cancelHighlightingRule.emit();
    }

    onOkRule(): void {
        this.okHighlightingRule.emit(this.stationHighlightingCondition_);
    }

    onColorChange(color: string): void {
        this.color = color;
        const highlightingColor = this.convertColorToHighlightingColor(color);
        this.stationHighlightingCondition_ = {
            ...this.stationHighlightingCondition_,
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

    private createDefaultCondition(): StationHighlightingData {
        return {
            name: '',
            showInLegend: true,
            color: [0, 0, 0],
            invisible: false,
            adjustThickness: false,
            labelProperty: null,
            valueCondition: null,
            logicalConditions: [],
            shape: null
        };

    }
}
