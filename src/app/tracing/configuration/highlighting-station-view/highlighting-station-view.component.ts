import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { StationHighlightingData, TableColumn } from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData, PropToValuesMap } from '../configuration.model';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightingStationViewComponent implements OnChanges {

    @Input() colorOrShapeRuleEditIndex: number | null = null;
    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: PropToValuesMap = {};
    @Input() rules: StationHighlightingData[] = [];

    @Output() rulesChange = new EventEmitter<StationHighlightingData[]>();
    @Output() ruleDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() colorOrShapeRuleEditIndexChange = new EventEmitter<number | null>();

    get colorOrShapeRules(): StationHighlightingData[] {
        return this.colorOrShapeRules_;
    }

    labelsOpenState = false;
    stationSizeOpenState = false;
    colorsAndShapesOpenState = false;

    private colorOrShapeRules_: StationHighlightingData[] = [];
    private restRules_: StationHighlightingData[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.rules !== undefined) {
            this.partitionRules();
        }
    }

    onColorOrShapeRuleDelete(deleteRuleRequestData: HighlightingRuleDeleteRequestData) {
        const newRules = deleteRuleRequestData.highlightingData.concat(this.restRules_);

        this.ruleDelete.emit({
            highlightingData: newRules,
            highlightingRule: deleteRuleRequestData.highlightingRule,
            xPos: deleteRuleRequestData.xPos,
            yPos: deleteRuleRequestData.yPos
        });
    }

    onColorOrShapeRulesChange(newColorOrShapeRules: StationHighlightingData[]) {
        this.colorOrShapeRules_ = newColorOrShapeRules;
        const newRules = this.colorOrShapeRules_.concat(this.restRules_);
        this.rulesChange.emit(newRules);
    }

    onColorOrShapeRuleEditIndexChange(editIndex: number | null) {
        this.colorOrShapeRuleEditIndexChange.emit(editIndex);
    }

    private partitionRules(): void {
        [this.colorOrShapeRules_, this.restRules_] = _.partition(this.rules, item => {
            return (
                item.color ||
                (item.shape !== undefined && item.shape !== null)
            );
        });
    }
}
