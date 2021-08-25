import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
    DeliveryHighlightingRule, DeliveryHighlightingStats, HighlightingRule, StationHighlightingRule,
    StationHighlightingStats, TableColumn
} from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';
import { EditRuleCreator } from '../edit-rule-creator';
import { LabelEditRule } from '../model';
import { convertHRuleToLabelEditRule, convertStatEditRuleToStatHRule } from '../rule-conversion';

@Component({
    selector: 'fcl-label-rules-list-view',
    templateUrl: './label-rules-list-view.component.html',
    styleUrls: ['./label-rules-list-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelRulesListViewComponent<T extends StationHighlightingRule | DeliveryHighlightingRule> implements OnChanges {

    @Input() rules: T[] = [];
    @Input() editRule: LabelEditRule | null = null;
    @Input() labelContext: string = '';
    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: Record<string, string[]> = {};
    @Input() highlightingStats: StationHighlightingStats | DeliveryHighlightingStats | null = null;

    @Output() ruleDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() rulesChange = new EventEmitter<T[]>();
    @Output() startEdit = new EventEmitter<LabelEditRule>();
    @Output() cancelEdit = new EventEmitter<void>();
    @Output() addSelectionToRuleConditions = new EventEmitter<LabelEditRule>();
    @Output() removeSelectionFromRuleConditions = new EventEmitter<LabelEditRule>();

    private isEditRuleNew = false;

    get showAddRuleButton(): boolean {
        return this.editRule === null || this.isEditRuleNew;
    }

    get showEditNewRuleDialog(): boolean {
        return this.editRule !== null && this.isEditRuleNew;
    }

    get isEditRuleModeActive(): boolean {
        return this.editRule !== null;
    }

    get isStartEditAvailable(): boolean {
        return this.editRule === null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.editRule !== undefined || changes.rules !== undefined) {
            this.isEditRuleNew = this.editRule !== null && !this.rules.some(r => r.id === this.editRule.id);
        }
    }

    getCount(rule: T): number | string {
        if (!rule.disabled && this.highlightingStats !== null) {
            const statCount = this.highlightingStats.counts[rule.id];
            return statCount === undefined ? '' : statCount;
        }
        return '';
    }

    getCountTooltip(rule: T): string {
        if (!rule.disabled && this.highlightingStats !== null) {
            const elementCount = this.highlightingStats.counts[rule.id];
            if (elementCount !== undefined) {
                return `This highlighting rule applies to ${elementCount} ${this.labelContext}.`;
            } else {
                return '';
            }
        }
        return '';
    }

    onRuleAdd(): void {
        this.setEditRule(EditRuleCreator.createLabelEditRule());
    }

    onStartEdit(ruleIndex: number) {
        const hRule = this.rules[ruleIndex];
        const editRule = convertHRuleToLabelEditRule(hRule);
        this.setEditRule(editRule);
    }

    onRuleDelete(event: MouseEvent, index: number) {
        this.ruleDelete.emit({
            ruleId: this.rules[index].id,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleRuleIsDisabled(index: number) {
        this.changeRule(index, { disabled: !this.rules[index].disabled });
    }

    onRuleApply(editRule: LabelEditRule): void {
        this.saveEditRule(editRule);
        this.setEditRule(editRule);
    }

    onRuleOk(editRule: LabelEditRule): void {
        this.saveEditRule(editRule);
        this.cancelEdit.emit();
    }

    onCancelEdit(): void {
        this.cancelEdit.emit();
    }

    onAddSelectionToRuleConditions(editRule: LabelEditRule): void {
        this.addSelectionToRuleConditions.emit(editRule);
    }

    onRemoveSelectionFromRuleConditions(editRule: LabelEditRule): void {
        this.removeSelectionFromRuleConditions.emit(editRule);
    }

    private emitNewRules(newRules: T[]): void {
        this.rulesChange.emit(newRules);
    }

    onDrop(event: CdkDragDrop<string[]>) {
        if (event.previousIndex !== event.currentIndex) {
            const newRules = [...this.rules];
            moveItemInArray(newRules, event.previousIndex, event.currentIndex);
            this.emitNewRules(newRules);
        }
    }

    protected changeRule(ruleIndex: number, ruleChange: Partial<T | HighlightingRule>): void {
        const changedRule = {
            ...this.rules[ruleIndex],
            ...ruleChange
        };
        this.saveRule(changedRule);
    }

    private saveEditRule(editRule: LabelEditRule): void {
        const hRule = convertStatEditRuleToStatHRule(editRule);
        this.saveRule(hRule as T);
    }

    private saveRule(rule: T): void {
        const newRules = [...this.rules];
        const ruleIndex = this.rules.findIndex(r => r.id === rule.id);
        if (ruleIndex >= 0) {
            newRules[ruleIndex] = rule;
        } else {
            newRules.push(rule);
        }
        this.rulesChange.emit(newRules);
    }

    private setEditRule(editRule: LabelEditRule): void {
        this.startEdit.emit(editRule);
    }
}
