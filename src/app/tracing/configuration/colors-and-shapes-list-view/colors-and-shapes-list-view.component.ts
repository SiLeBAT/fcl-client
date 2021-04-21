import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { StationHighlightingData, TableColumn } from '@app/tracing/data.model';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';

@Component({
    selector: 'fcl-colors-and-shapes-list-view',
    templateUrl: './colors-and-shapes-list-view.component.html',
    styleUrls: ['./colors-and-shapes-list-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorsAndShapesListViewComponent {

    @Input() rules: StationHighlightingData[] = [];
    @Input() availableProperties: TableColumn[] = [];
    @Input() propToValuesMap: Record<string, string[]> = {};
    @Input() editIndex: number | null = null;

    @Output() ruleDelete = new EventEmitter<HighlightingRuleDeleteRequestData>();
    @Output() toggleShowInLegendProperty = new EventEmitter<StationHighlightingData[]>();
    @Output() rulesChange = new EventEmitter<StationHighlightingData[]>();
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

    get editRule(): StationHighlightingData | null {
        return (
            (this.editIndex === null || this.rules.length === this.editIndex) ?
            null :
            this.rules[this.editIndex]
        );
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

    onApplyRule(rule: StationHighlightingData): void {
        const newRules = this.getNewRulesWithRuleAtEditIndex(rule);
        this.emitNewRules(newRules);
    }

    onCancelEdit(): void {
        this.emitEditIndex(null);
    }

    onOkRule(rule: StationHighlightingData): void {
        const newRules = this.getNewRulesWithRuleAtEditIndex(rule);
        this.emitEditIndex(null);

        this.emitNewRules(newRules);
    }

    private getNewRulesWithRuleAtEditIndex(rule: StationHighlightingData): StationHighlightingData[] {
        const newRules = [...this.rules];
        newRules[this.editIndex] = rule;

        return newRules;
    }

    private emitEditIndex(editIndex: number | null) {
        this.editIndexChange.emit(editIndex);
    }

    private emitNewRules(newRules: StationHighlightingData[]): void {
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
