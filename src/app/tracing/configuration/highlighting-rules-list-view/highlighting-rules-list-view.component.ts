import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';
import { EditRule, RuleId, RuleListItem } from '../model';

@Component({
    selector: 'fcl-highlighting-rules-list-view',
    templateUrl: './highlighting-rules-list-view.component.html',
    styleUrls: ['./highlighting-rules-list-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HighlightingRulesListViewComponent <T extends EditRule> implements OnChanges, AfterViewChecked {

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

    @ViewChild('editRuleElement', { read: ElementRef, static: false }) editRuleElementRef: ElementRef;
    @ViewChild('newRuleElement', { read: ElementRef, static: false }) newRuleElementRef: ElementRef;

    private isEditRuleNew = false;

    private scrollEditRuleIntoViewAfterViewChecked = false;

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
        if (changes.editRule !== undefined && this.editRule !== null) {
            const prevEditRule = (changes.editRule.previousValue as EditRule | null);
            if (prevEditRule === null || prevEditRule.id !== this.editRule.id) {
                // editrule was opened
                this.scrollEditRuleIntoViewAfterViewChecked = true;
            }
        }
    }

    ngAfterViewChecked(): void {
        if (this.scrollEditRuleIntoViewAfterViewChecked) {
            this.scrollEditRuleIntoView();
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

    private scrollEditRuleIntoView(): void {
        const element = this.newRuleElementRef ?? this.editRuleElementRef;
        if (element) {
            const htmlElement = element.nativeElement as HTMLElement;
            const boundingElement = htmlElement.closest('.mat-tab-body-content');
            const boundingRect = boundingElement.getBoundingClientRect();
            const elementRect = htmlElement.getBoundingClientRect();
            const topDist = elementRect.top - boundingRect.top;
            const bottomDist = boundingRect.bottom - elementRect.bottom;
            const scrollBy = (
                topDist < 0 ? topDist :
                    bottomDist < 0 ? Math.min(topDist, -bottomDist) :
                        0
            );

            if (scrollBy !== 0) {
                boundingElement.scrollBy(0, scrollBy);
            }
            this.scrollEditRuleIntoViewAfterViewChecked = false;
        }
    }
}
