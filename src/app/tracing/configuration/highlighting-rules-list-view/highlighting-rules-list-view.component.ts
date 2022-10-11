import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';
import { EditRule, RuleId, RuleListItem } from '../model';

@Component({
    selector: 'fcl-highlighting-rules-list-view',
    templateUrl: './highlighting-rules-list-view.component.html',
    styleUrls: ['./highlighting-rules-list-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightingRulesListViewComponent <T extends EditRule> implements OnChanges {

    @Input() showShowInLegendToggleButton = true;
    @Input() listItems: RuleListItem[] = [];
    @Input() editTemplate: TemplateRef<HTMLElement> | null = null;
    @Input() symbolTemplate: TemplateRef<HTMLElement> | null = null;
    @Input() editRule: T | null = null;

    @Output() ruleOrderChange = new EventEmitter<RuleId[]>();
    @Output() toggleRuleIsDisabled = new EventEmitter<RuleId>();
    @Output() toggleShowRuleInLegend = new EventEmitter<RuleId>();
    @Output() deleteRule = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() newRule = new EventEmitter<void>();
    @Output() startEdit = new EventEmitter<RuleId>();

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
        if (changes.editRule !== undefined || changes.listItems !== undefined) {
            this.isEditRuleNew = this.editRule !== null && !this.listItems.some(item => item.id === this.editRule.id);
        }
    }

    onNewRule(): void {
        this.newRule.emit();
    }

    onStartEdit(ruleId: RuleId) {
        this.startEdit.emit(ruleId);
    }

    onDeleteRule(event: MouseEvent, ruleId: RuleId) {
        this.deleteRule.emit({
            ruleId: ruleId,
            xPos: event.clientX,
            yPos: event.clientY
        });
    }

    onToggleShowRuleInLegend(ruleId: RuleId) {
        this.toggleShowRuleInLegend.emit(ruleId);
    }

    onToggleRuleIsDisabled(ruleId: RuleId) {
        this.toggleRuleIsDisabled.emit(ruleId);
    }

    onDrop(event: CdkDragDrop<string[]>) {
        if (event.previousIndex !== event.currentIndex) {
            const newRuleIdOrder = this.listItems.map(item => item.id);
            moveItemInArray(newRuleIdOrder, event.previousIndex, event.currentIndex);
            this.ruleOrderChange.emit(newRuleIdOrder);
        }
    }
}
