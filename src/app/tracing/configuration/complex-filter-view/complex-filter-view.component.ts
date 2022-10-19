import { OperationType, TableColumn } from './../../data.model';
import { Component, Input, ViewEncapsulation, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, AfterViewChecked } from '@angular/core';
import { ComplexFilterCondition, JunktorType } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
    selector: 'fcl-complex-filter-view',
    templateUrl: './complex-filter-view.component.html',
    styleUrls: ['./complex-filter-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ComplexFilterViewComponent implements AfterViewChecked {

    private static readonly MAX_VIEW_PORT_LENGTH = 5;
    private static readonly ROW_HEIGHT = 38.39;
    private static readonly MAX_VIEW_PORT_HEIGHT =
        (ComplexFilterViewComponent.MAX_VIEW_PORT_LENGTH + 0.5) *
        ComplexFilterViewComponent.ROW_HEIGHT;

    private static readonly SCROLL_INDICATOR_TRIGGER_OFFSET = 10;

    @Input() disabled = false;
    @Input() favouriteProperties: TableColumn[] = [];
    @Input() otherProperties: TableColumn[] = [];

    @Input() propToValuesMap: Record<string, string[]> = {};
    @Input() availableOperatorTypes: OperationType[] = [];

    @Input() set conditions(value: ComplexFilterCondition[]) {
        this.conditions_ = (
            value && value.length > 0 ?
                value.slice() :
                ComplexFilterUtils.createDefaultComplexFilterConditions()
        );
        this.updateStyleParams();
    }

    get conditions(): ComplexFilterCondition[] {
        return this.conditions_;
    }

    @Output() conditionsChange = new EventEmitter<ComplexFilterCondition[]>();

    @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

    isDownScrollIndicatorVisible = false;
    isUpScrollIndicatorVisible = false;
    useListMode = false;

    rowHeight = ComplexFilterViewComponent.ROW_HEIGHT; //     38.39; // 35;
    viewportHeight = ComplexFilterViewComponent.ROW_HEIGHT;

    private scrollDown = false;
    private updateScrollIndicatorsAfterViewChecked = false;

    private conditions_ = ComplexFilterUtils.createDefaultComplexFilterConditions();

    ngAfterViewChecked(): void {
        if (this.scrollDown) {
            if (this.useListMode) {
                this.viewport.scrollToIndex(this.conditions_.length - 1);
            }
            this.scrollDown = false;
        } else if (this.updateScrollIndicatorsAfterViewChecked) {
            this.updateScrollIndicatorsAfterViewChecked = false;
            this.updateScrollIndicators();
        }

    }

    onScroll(): void {
        this.updateScrollIndicators();
    }

    onAddFilterCondition(index: number) {
        if (index === this.conditions.length - 1) {
            this.scrollDown = true;
        }
        const conditions = this.conditions_.map(c => ({ ...c }));
        const propertyName = conditions[index].propertyName;
        const operationType = conditions[index].operationType;

        const junktorType = (
            index > 0 ?
                conditions[index - 1].junktorType :
                ComplexFilterUtils.DEFAULT_JUNKTOR_TYPE
        );

        conditions[index].junktorType = junktorType;
        conditions[index + 1] = {
            propertyName: propertyName,
            operationType: operationType,
            value: '',
            junktorType: ComplexFilterUtils.DEFAULT_JUNKTOR_TYPE
        };

        this.conditions_ = conditions;
        this.conditionsChange.emit(conditions);
    }

    onRemoveFilterCondition(index: number) {
        const conditions = [].concat(
            this.conditions_.slice(0, index),
            this.conditions_.slice(index + 1)
        );
        this.conditions_ = (
            conditions.length === 0 ?
                ComplexFilterUtils.createDefaultComplexFilterConditions() :
                conditions
        );
        this.conditionsChange.emit(conditions);
    }

    onPropertyChange(propertyName: string, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            propertyName: propertyName
        });
    }

    onOperatorChange(operatorType: OperationType, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            operationType: operatorType
        });
    }

    onValueChange(value: string, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            value: value
        });
    }

    onJunktorChange(junktorType: JunktorType, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            junktorType: junktorType
        });
    }

    trackByIndex(index: number): number {
        return index;
    }

    private changeConditionAndEmit(index: number, newCondition: ComplexFilterCondition): void {
        const conditions = this.conditions_.map(c => ({ ...c }));
        conditions[index] = newCondition;
        this.conditions_ = conditions;
        this.conditionsChange.emit(conditions);
    }

    private updateStyleParams(): void {
        const listHeight = ComplexFilterViewComponent.ROW_HEIGHT * this.conditions.length;
        this.viewportHeight = Math.min(
            ComplexFilterViewComponent.MAX_VIEW_PORT_HEIGHT,
            listHeight
        );
        this.useListMode = this.viewportHeight < listHeight;
        if (!this.useListMode) {
            this.isDownScrollIndicatorVisible = false;
            this.isUpScrollIndicatorVisible = false;
        } else {
            this.updateScrollIndicatorsAfterViewChecked = true;
        }
    }

    private updateScrollIndicators(): void {
        this.isDownScrollIndicatorVisible = this.viewport && !(
            this.viewport.measureScrollOffset('bottom') < ComplexFilterViewComponent.SCROLL_INDICATOR_TRIGGER_OFFSET
        );
        this.isUpScrollIndicatorVisible = this.viewport && !(
            this.viewport.measureScrollOffset('top') < ComplexFilterViewComponent.SCROLL_INDICATOR_TRIGGER_OFFSET
        );
    }
}
