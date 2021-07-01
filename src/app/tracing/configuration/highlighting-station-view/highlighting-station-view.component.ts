import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { StationHighlightingRule, StationHighlightingStats, TableColumn } from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData, PropToValuesMap } from '../configuration.model';
import * as _ from 'lodash';
import { ColorAndShapeEditRule, RuleId, RuleType, StationEditRule } from '../model';

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightingStationViewComponent implements OnChanges {
    RuleType = RuleType;

    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: PropToValuesMap = {};
    @Input() rules: StationHighlightingRule[] = [];
    @Input() editRules: StationEditRule[] = [];
    @Input() highlightingStats: StationHighlightingStats | null = null;

    @Output() rulesChange = new EventEmitter<StationHighlightingRule[]>();
    @Output() editRulesChange = new EventEmitter<StationEditRule[]>();
    @Output() ruleDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() addSelectionToRuleConditions = new EventEmitter<StationEditRule>();
    @Output() removeSelectionFromRuleConditions = new EventEmitter<StationEditRule>();

    labelsOpenState = false;
    stationSizeOpenState = false;
    colorsAndShapesOpenState = true;

    private colorOrShapeRules_: StationHighlightingRule[] = [];
    private colorOrShapeEditRule_: ColorAndShapeEditRule | null = null;
    private restRules_: StationHighlightingRule[] = [];

    get colorOrShapeRules(): StationHighlightingRule[] {
        return this.colorOrShapeRules_;
    }

    get colorOrShapeEditRule(): ColorAndShapeEditRule | null {
        return this.colorOrShapeEditRule_;
    }

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rules !== undefined) {
            this.partitionRules();
        }
        if (changes.editRules !== undefined) {
            this.partitionEditRules();
        }
    }

    onRuleDelete(deleteRuleRequestData: HighlightingRuleDeleteRequestData): void {
        this.ruleDelete.emit(deleteRuleRequestData);
    }

    onColorOrShapeRulesChange(newColorOrShapeRules: StationHighlightingRule[]) {
        const newRules = [].concat(newColorOrShapeRules, this.restRules_);
        this.rulesChange.emit(newRules);
    }

    onStartRuleEdit(editRule: ColorAndShapeEditRule): void {
        this.editRulesChange.emit([].concat(...this.editRules, editRule));
    }

    onCancelRuleEdit(ruleId: RuleId): void {
        this.editRulesChange.emit(this.editRules.filter(r => r.id !== ruleId));
    }

    onAddSelectionToRuleConditions(editRule: StationEditRule): void {
        this.addSelectionToRuleConditions.emit(editRule);
    }

    onRemoveSelectionFromRuleConditions(editRule: StationEditRule): void {
        this.removeSelectionFromRuleConditions.emit(editRule);
    }

    private partitionRules(): void {
        [this.colorOrShapeRules_, this.restRules_] = _.partition(this.rules, item => {
            return (
                item.color ||
                (item.shape !== undefined && item.shape !== null)
            );
        });
    }

    private partitionEditRules(): void {
        const rule = this.editRules.find(r => r.type === RuleType.COLOR_AND_SHAPE) || null;
        this.colorOrShapeEditRule_ = rule === null ? null : rule as ColorAndShapeEditRule;
    }
}
