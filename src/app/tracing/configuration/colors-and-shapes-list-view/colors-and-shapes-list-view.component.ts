import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { StationHighlightingRule, StationHighlightingStats, TableColumn } from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-list-view',
    templateUrl: './colors-and-shapes-list-view.component.html',
    styleUrls: ['./colors-and-shapes-list-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorsAndShapesListViewComponent {

    @Input() rules: StationHighlightingRule[] = [];
    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: Record<string, string[]> = {};
    @Input() highlightingStats: StationHighlightingStats | null = null;
    @Input() editIndex: number | null = null;

    @Output() ruleDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() toggleShowInLegendProperty = new EventEmitter<StationHighlightingRule[]>();
    @Output() rulesChange = new EventEmitter<StationHighlightingRule[]>();
    @Output() editIndexChange = new EventEmitter<number | null>();

    get showAddRuleButton(): boolean {
        return this.editIndex === null || this.editIndex !== this.rules.length;
    }

    get showEditNewRuleDialog(): boolean {
        return this.editIndex === this.rules.length;
    }

    get isEditRuleModeActive(): boolean {
        return this.editIndex !== null;
    }

    get editRule(): StationHighlightingRule | null {
        return (
            (this.editIndex === null || this.rules.length === this.editIndex) ?
            null :
            this.rules[this.editIndex]
        );
    }

    getCount(rule: StationHighlightingRule): number | string {
        if (!rule.disabled && this.highlightingStats !== null) {
            const statCount = this.highlightingStats.counts[rule.id];
            return statCount === undefined ? '' : statCount;
        }
        return '';
    }

    getConflictCount(rule: StationHighlightingRule): number | string {
        if (!rule.disabled && this.highlightingStats !== null) {
            const conflictCount = this.highlightingStats.conflicts[rule.id];
            return conflictCount === undefined ? '' : conflictCount;
        }
        return '';
    }

    getCountTooltip(rule: StationHighlightingRule): string {
        if (!rule.disabled && this.highlightingStats !== null) {
            const conflictCount = this.highlightingStats.conflicts[rule.id];
            const statCount = this.highlightingStats.counts[rule.id];
            if (statCount !== undefined) {
                if (conflictCount > 0) {
                    return `For ${conflictCount}/${statCount} stations the shape is not visible\ndue to another rule above this one.`;
                } else {
                    return `This highlighting rule applies to ${statCount} stations.`;
                }
            } else {
                return '';
            }
        }
        return '';
    }

    hasConflict(rule: StationHighlightingRule): boolean {
        if (!rule.disabled && this.highlightingStats !== null) {
            return this.highlightingStats.conflicts[rule.id] !== undefined;
        }
        return false;
    }

    onAddRule(): void {
        this.emitEditIndex(this.rules.length);
    }

    onEditRule(index: number) {
        this.emitEditIndex(index);
    }

    onDeleteRule(event: MouseEvent, indexToDelete: number) {
        const rule = this.rules[indexToDelete];
        const newRules = [...this.rules];
        newRules.splice(indexToDelete, 1);

        this.ruleDelete.emit({
            highlightingData: newRules,
            highlightingRule: rule,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleShowInLegend(index: number) {
        const showInLegend: boolean = this.rules[index].showInLegend;
        const newRules = [...this.rules];
        newRules[index] = {
            ...newRules[index],
            showInLegend: !showInLegend
        };
        this.rulesChange.emit(newRules);
    }

    onToggleRuleIsDisabled(index: number) {
        const ruleIsDisabled: boolean = this.rules[index].disabled;
        const newRules = [...this.rules];
        newRules[index] = {
            ...newRules[index],
            disabled: !ruleIsDisabled
        };
        this.rulesChange.emit(newRules);
    }

    onApplyRule(rule: StationHighlightingRule): void {
        const newRules = this.getNewRulesWithRuleAtEditIndex(rule);
        this.emitNewRules(newRules);
    }

    onCancelEdit(): void {
        this.emitEditIndex(null);
    }

    onOkRule(rule: StationHighlightingRule): void {
        const newRules = this.getNewRulesWithRuleAtEditIndex(rule);
        this.emitEditIndex(null);

        this.emitNewRules(newRules);
    }

    private getNewRulesWithRuleAtEditIndex(rule: StationHighlightingRule): StationHighlightingRule[] {
        const newRules = [...this.rules];
        newRules[this.editIndex] = rule;

        return newRules;
    }

    private emitEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private emitNewRules(newRules: StationHighlightingRule[]): void {
        this.rulesChange.emit(newRules);
    }

    onDrop(event: CdkDragDrop<string[]>) {
        if (event.previousIndex !== event.currentIndex) {
            const newRules = [...this.rules];
            moveItemInArray(newRules, event.previousIndex, event.currentIndex);
            this.emitNewRules(newRules);
        }
    }
}
