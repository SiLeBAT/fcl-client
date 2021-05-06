import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChange, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Color, NodeShapeType, OperationType, StationHighlightingRule, TableColumn } from '@app/tracing/data.model';
import { ComplexFilterCondition, PropToValuesMap } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-colors-and-shapes-edit-view',
    templateUrl: './colors-and-shapes-edit-view.component.html',
    styleUrls: ['./colors-and-shapes-edit-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorsAndShapesEditViewComponent implements OnChanges {

    private static readonly CS_RULE_ID_PREFIX = 'CSR';

    get useShape(): boolean {
        return this.useShape_;
    }

    get useColor(): boolean {
        return this.color_ !== null;
    }

    get color(): Color | null {
        return this.color_;
    }

    get complexFilterConditions(): ComplexFilterCondition[] {
        return this.complexFilterConditions_;
    }

    get actionButtonDisabled(): boolean {
        return ((this.rule_.shape === null && (
                    this.rule_.color === null ||
                    this.useShape
                )) || !this.areConditionsOk);
    }

    private get areConditionsOk(): boolean {
        return this.rule_.logicalConditions.length > 0 &&
            this.rule_.logicalConditions[0].length > 0 &&
            this.areConditionsComplete;
    }

    private get areConditionsComplete(): boolean {
        const condCounts = this.rule_.logicalConditions.map(andConditions => andConditions.length);
        const totalCondCount = condCounts.reduce((accValue, currentValue) => accValue + currentValue, 0);
        return this.complexFilterConditions_.length === totalCondCount;
    }

    get applyTooltip(): String {
        return this.actionButtonDisabled ?
            ColorsAndShapesEditViewComponent.DISABLED_ACTION_TOOLTIP :
            ColorsAndShapesEditViewComponent.ENABLED_APPLY_TOOLTIP;
    }

    get okTooltip(): String {
        return this.actionButtonDisabled ?
            ColorsAndShapesEditViewComponent.DISABLED_ACTION_TOOLTIP :
            ColorsAndShapesEditViewComponent.ENABLED_OK_TOOLTIP;
    }

    get ruleName(): String {
        return this.rule_.name;
    }

    get shape(): NodeShapeType | null {
        return this.rule_.shape;
    }

    constructor() { }

    private static readonly DEFAULT_COLOR = { r: 3, g: 78, b: 162 };
    private static readonly DISABLED_ACTION_TOOLTIP = 'Please select color and/or shape as well as conditions';
    private static readonly ENABLED_APPLY_TOOLTIP = 'Apply Highlighting Rule';
    private static readonly ENABLED_OK_TOOLTIP = 'Apply Highlighting Rule and close dialogue';

    @Input() rule: StationHighlightingRule | null = null;
    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: PropToValuesMap = {};

    @Output() applyRule = new EventEmitter<StationHighlightingRule>();
    @Output() cancelEdit = new EventEmitter();
    @Output() okRule = new EventEmitter<StationHighlightingRule>();

    availableOperatorTypes: OperationType[] = [
        OperationType.EQUAL,
        OperationType.GREATER,
        OperationType.NOT_EQUAL,
        OperationType.LESS,
        OperationType.REGEX_EQUAL,
        OperationType.REGEX_NOT_EQUAL,
        OperationType.REGEX_EQUAL_IGNORE_CASE,
        OperationType.REGEX_NOT_EQUAL_IGNORE_CASE
    ];

    private useShape_ = false;
    private color_: Color | null = null;
    private lastActiveColor: Color = ColorsAndShapesEditViewComponent.DEFAULT_COLOR;
    private lastActiveShape: NodeShapeType | null = null;

    private complexFilterConditions_: ComplexFilterCondition[] = [];
    private rule_: StationHighlightingRule = this.createDefaultRule();

    private convertRGBArrayToColor(color: number[]): Color {
        return { r: color[0], g: color[1], b: color[2] };
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rule !== undefined) {
            const rule = changes.rule.currentValue || this.createDefaultRule();

            this.rule_ = _.cloneDeep(rule);
            this.complexFilterConditions_ = ComplexFilterUtils.logicalConditionsToComplexFilterConditions(rule.logicalConditions);
            this.setColor(
                rule.color === null ?
                null :
                this.convertRGBArrayToColor(rule.color)
            );

            this.setShape(rule.shape);
            this.useShape_ = rule.shape !== null;
            return;
        }
    }

    onRuleNameChange(ruleName: string): void {
        this.rule_.name = ruleName;
    }

    onShapeChange(shapeType: (NodeShapeType | null)): void {
        this.setShape(shapeType);
    }

    onComplexFilterChange(complexFilterConditions: ComplexFilterCondition[]): void {

        this.complexFilterConditions_ = complexFilterConditions;
        const logicalConditions = ComplexFilterUtils.complexFilterConditionsToLogicalConditions(complexFilterConditions);

        this.rule_.logicalConditions = logicalConditions;
    }

    onApplyRule(): void {
        this.applyRule.emit(this.rule_);
    }

    onCancelRule(): void {
        this.cancelEdit.emit();
    }

    onOkRule(): void {
        this.okRule.emit(this.rule_);
    }

    onUseColorChange(useColor: boolean): void {
        this.onColorChange(useColor ? this.lastActiveColor : null);
    }

    onColorChange(color: Color | null): void {
        this.setColor(color);
    }

    onUseShapeChange(useShape: boolean): void {
        this.useShape_ = useShape;
        this.onShapeChange(useShape ? this.lastActiveShape : null);
    }

    private setColor(color: Color | null): void {
        this.rule_.color = color !== null ? this.convertColorToRGBArray(color) : null;
        this.color_ = color;
        if (color !== null) {
            this.lastActiveColor = color;
        }
    }

    private setShape(shapeType: NodeShapeType | null): void {
        this.rule_.shape = shapeType;
        if (shapeType !== null) {
            this.lastActiveShape = shapeType;
        }
    }

    private createDefaultRule(): StationHighlightingRule {
        return {
            id: ColorsAndShapesEditViewComponent.CS_RULE_ID_PREFIX + (new Date()).valueOf(),
            name: '',
            showInLegend: true,
            disabled: false,
            color: this.convertColorToRGBArray(ColorsAndShapesEditViewComponent.DEFAULT_COLOR),
            invisible: false,
            adjustThickness: false,
            labelProperty: null,
            valueCondition: null,
            logicalConditions: [[]],
            shape: null
        };
    }

    private convertColorToRGBArray(color: Color): number[] {
        return [color.r, color.g, color.b];
    }
}
