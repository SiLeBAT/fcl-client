import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { StationHighlightingRule, StationHighlightingStats, TableColumn } from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';
import { EditRuleCreator } from '../edit-rule-creator';
import { ColorAndShapeEditRule } from '../model';
import { convertStatHRuleToCSEditRule, convertStatEditRuleToStatHRule } from '../rule-conversion';

@Component({
    selector: 'fcl-colors-and-shapes-list-view',
    templateUrl: './colors-and-shapes-list-view.component.html',
    styleUrls: ['./colors-and-shapes-list-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorsAndShapesListViewComponent implements OnChanges {

    @Input() rules: StationHighlightingRule[] = [];
    @Input() editRule: ColorAndShapeEditRule | null = null;
    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: Record<string, string[]> = {};
    @Input() highlightingStats: StationHighlightingStats | null = null;

    @Output() ruleDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() rulesChange = new EventEmitter<StationHighlightingRule[]>();
    @Output() startEdit = new EventEmitter<ColorAndShapeEditRule>();
    @Output() cancelEdit = new EventEmitter<void>();
    @Output() addSelectionToRuleConditions = new EventEmitter<ColorAndShapeEditRule>();
    @Output() removeSelectionFromRuleConditions = new EventEmitter<ColorAndShapeEditRule>();

    private isEditRuleNew = false;

    get showAddRuleButton(): boolean {
        return this.editRule === null || this.isEditRuleNew; // this.editRule.isNew;
    }

    get showEditNewRuleDialog(): boolean {
        return this.editRule !== null && this.isEditRuleNew; // this.editRule.isNew;
    }

    get isEditRuleModeActive(): boolean {
        return this.editRule !== null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.editRule !== undefined || changes.rules !== undefined) {
            this.isEditRuleNew = this.editRule !== null && !this.rules.some(r => r.id === this.editRule.id);
        }
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

    onRuleAdd(): void {
        this.setEditRule(EditRuleCreator.createColorAndShapeEditRule());
    }

    onStartEdit(ruleIndex: number) {
        const hRule = this.rules[ruleIndex];
        const editRule = convertStatHRuleToCSEditRule(hRule);
        this.setEditRule(editRule);
    }

    onRuleDelete(event: MouseEvent, index: number) {
        this.ruleDelete.emit({
            ruleId: this.rules[index].id,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleShowInLegend(index: number) {
        this.changeRule(index, { showInLegend: !this.rules[index].showInLegend });
    }

    onToggleRuleIsDisabled(index: number) {
        this.changeRule(index, { disabled: !this.rules[index].disabled });
    }

    onRuleApply(editRule: ColorAndShapeEditRule): void {
        this.saveEditRule(editRule);
        this.setEditRule(editRule);
    }

    onRuleOk(editRule: ColorAndShapeEditRule): void {
        this.saveEditRule(editRule);
        this.cancelEdit.emit();
    }

    onCancelEdit(): void {
        this.cancelEdit.emit();
    }

    onAddSelectionToRuleConditions(editRule: ColorAndShapeEditRule): void {
        this.addSelectionToRuleConditions.emit(editRule);
    }

    onRemoveSelectionFromRuleConditions(editRule: ColorAndShapeEditRule): void {
        this.removeSelectionFromRuleConditions.emit(editRule);
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

    protected changeRule(ruleIndex: number, ruleChange: Partial<StationHighlightingRule>): void {
        const changedRule = {
            ...this.rules[ruleIndex],
            ...ruleChange
        };
        this.saveRule(changedRule);
    }

    private saveEditRule(editRule: ColorAndShapeEditRule): void {
        const hRule = convertStatEditRuleToStatHRule(editRule);
        this.saveRule(hRule);
    }

    private saveRule(rule: StationHighlightingRule): void {
        const newRules = [...this.rules];
        const ruleIndex = this.rules.findIndex(r => r.id === rule.id);
        if (ruleIndex >= 0) {
            newRules[ruleIndex] = rule;
        } else {
            newRules.push(rule);
        }
        this.rulesChange.emit(newRules);
    }

    private setEditRule(editRule: ColorAndShapeEditRule): void {
        this.startEdit.emit(editRule);
    }
}
