import {
    Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
    ChangeDetectionStrategy} from '@angular/core';
import {
    DataTable, TableRow, TableColumn, OperationType
} from '@app/tracing/data.model';
import {
    createPredefinedRowFilter,
    PredefinedRowFilter,
    ComplexRowFilter,
    OneTermForNColumnsRowFilter,
    getUpdatedOneTermForNColumnsRowFilter,
    getUpdatedComplexRowFilter
} from '../filter-provider';
import { extractPropToValuesMap, filterTableRows } from '../shared';
import {
    InputData as FilterTableViewInputData, TableFilterChange
} from '../filter-table-view/filter-table-view.component';
import * as _ from 'lodash';
import { FilterTableSettings, ShowType, ComplexFilterCondition, PropToValuesMap, ActivityState } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import { Observable, Subject } from 'rxjs';

export interface InputData {
    dataTable: DataTable;
    filterTableSettings: FilterTableSettings;
    selectedRowIds: string[];
}

interface RowFilterMap {
    predefinedFilter: PredefinedRowFilter;
    complexFilter: ComplexRowFilter;
    standardFilter: OneTermForNColumnsRowFilter;
}
@Component({
    selector: 'fcl-filter-elements-view',
    templateUrl: './filter-elements-view.component.html',
    styleUrls: ['./filter-elements-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterElementsViewComponent implements OnChanges {

    @Input() inputData: InputData;
    @Input() standardFilterLabel: string;
    @Input() useTreeMode = false;
    @Input() activityState$: Observable<ActivityState> | null = null;
    @Input() cycleStart$: Observable<void> | null = null;

    @Output() filterSettingsChange = new EventEmitter<FilterTableSettings>();
    @Output() clearAllFilters = new EventEmitter();
    @Output() selectTableColumns = new EventEmitter();
    @Output() rowSelectionChange = new EventEmitter<string[]>();
    @Output() mouseOverTableRow = new EventEmitter<TableRow>();
    @Output() mouseLeaveTableRow = new EventEmitter<TableRow>();
    @Output() tableRowDblClick = new EventEmitter<TableRow>();

    availableOperatorTypes: OperationType[] = [
        OperationType.EQUAL,
        OperationType.CONTAINS,
        OperationType.GREATER,
        OperationType.NOT_EQUAL,
        OperationType.LESS,
        OperationType.REGEX_EQUAL,
        OperationType.REGEX_NOT_EQUAL,
        OperationType.REGEX_EQUAL_IGNORE_CASE,
        OperationType.REGEX_NOT_EQUAL_IGNORE_CASE
    ];

    get standardFilterSettings(): string {
        return this.inputData.filterTableSettings.standardFilter;
    }

    get predefinedFilterSettings(): ShowType {
        return this.inputData.filterTableSettings.predefinedFilter;
    }

    get complexFilterSettings(): ComplexFilterCondition[] {
        return this.inputData.filterTableSettings.complexFilter.conditions;
    }

    get filterTableViewInputData(): FilterTableViewInputData {
        return this.filterTableViewInputData_;
    }

    get favouriteColumns(): TableColumn[] {
        return this.inputData.dataTable.favouriteColumns;
    }

    get otherColumns(): TableColumn[] {
        return this.inputData.dataTable.otherColumns;
    }

    get propToValuesMap(): PropToValuesMap {
        return this.propToValuesMap_;
    }

    get dataIsAvailable(): boolean {
        return !!this.inputData;
    }

    get filterTableResizeFlag(): Record<string, never> {
        return this.filterTableResizeFlag_;
    }

    private processedInput__: InputData;
    private prefilteredRows_: TableRow[];
    private filterTableViewInputData_: FilterTableViewInputData;
    private propToValuesMap_: PropToValuesMap;
    private dataColumns_: TableColumn[];
    private filterMap_: RowFilterMap;

    moreFilterOpenState = false;
    complexFilterOpenState = false;

    private filterTableResizeFlag_: Record<string, never> = {};

    private checkTableSizeSubject_ = new Subject<number>();
    checkTableSize$ = this.checkTableSizeSubject_.asObservable();
    private updateTableSizeSubject_ = new Subject<void>();
    updateTableSize$ = this.updateTableSizeSubject_.asObservable();

    //#region lifecycle hooks

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.inputData !== undefined && changes.inputData.currentValue !== null) {
            this.processInputData();
        }
    }

    //#endregion life cycle hooks

    //#region template triggers

    onClearAllFilters(): void {
        this.clearAllFilters.emit();
    }

    onStandardFilterChange(filterTerm: string): void {
        this.filterSettingsChange.emit({
            ...this.inputData.filterTableSettings,
            standardFilter: filterTerm
        });
    }

    onPredefinedFilterChange(showType: ShowType): void {
        this.filterSettingsChange.emit({
            ...this.inputData.filterTableSettings,
            predefinedFilter: showType
        });
    }

    onComplexFilterChange(conditions: ComplexFilterCondition[]): void {
        this.filterSettingsChange.emit({
            ...this.inputData.filterTableSettings,
            complexFilter: { conditions: conditions }
        });
    }

    onTableFilterChange(change: TableFilterChange): void {
        this.filterSettingsChange.emit({
            ...this.inputData.filterTableSettings,
            ...change
        });
    }

    onColumnOrderChange(columnOrder: string[]): void {
        this.filterSettingsChange.emit({
            ...this.inputData.filterTableSettings,
            columnOrder: columnOrder
        });
    }

    onSelectTableColumns(): void {
        this.selectTableColumns.emit();
    }

    onRowSelectionChange(rowIds: string[]): void {
        this.rowSelectionChange.emit(rowIds);
    }

    onMouseOverTableRow(row: TableRow | null): void {
        this.mouseOverTableRow.emit(row);
    }

    onRowDblClick(row: TableRow): void {
        this.tableRowDblClick.emit(row);
    }

    onSetMoreFilterOpenState(open: boolean): void {
        this.moreFilterOpenState = open;
    }

    onAfterExpansionPanelCollapseOrExpand(): void {
        this.updateTableSizeSubject_.next();
    }

    //#endregion template triggers

    private processInputData(): void {
        if (
            this.moreFilterOpenState === true &&
            this.complexFilterOpenState === true &&
            this.processedInput__ !== null &&
            this.inputData !== null &&
            (
                this.processedInput__.filterTableSettings.complexFilter.conditions.length !==
                this.inputData.filterTableSettings.complexFilter.conditions.length
            )
        ) {
            this.checkTableSizeSubject_.next(200);
        }
        this.updateDataColumns();
        this.updateFilterAndRows();
        this.updateTableInputData();
        this.updatePropValueMap();

        this.processedInput__ = this.inputData;
    }

    private getIgnoredProps(): string[] {
        return this.dataColumns_.filter(c => c.unavailable).map(c => c.id);
    }

    private updateFilterAndRows(): void {
        const newSettings = this.inputData.filterTableSettings;
        const oldSettings = this.processedInput__ ? this.processedInput__.filterTableSettings : undefined;

        const oldFilterMap = this.filterMap_;
        const newFilterMap: RowFilterMap = {
            predefinedFilter: (
                !oldSettings || oldSettings.predefinedFilter !== newSettings.predefinedFilter ?
                    createPredefinedRowFilter(newSettings.predefinedFilter) :
                    oldFilterMap.predefinedFilter
            ),
            complexFilter: (
                (
                    !oldSettings ||
                    oldSettings.complexFilter !== newSettings.complexFilter ||
                    this.processedInput__.dataTable.columns !== this.inputData.dataTable.columns
                ) ?
                    getUpdatedComplexRowFilter(
                        newSettings.complexFilter,
                        this.getIgnoredProps(),
                        oldFilterMap ? oldFilterMap.complexFilter : undefined
                    ) :
                    oldFilterMap.complexFilter
            ),
            standardFilter: (
                !oldSettings ||
                oldSettings.standardFilter !== newSettings.standardFilter ||
                oldSettings.columnOrder !== newSettings.columnOrder ?
                    getUpdatedOneTermForNColumnsRowFilter(
                        newSettings.standardFilter,
                        newSettings.columnOrder,
                        oldFilterMap ? oldFilterMap.standardFilter : undefined
                    ) :
                    this.filterMap_.standardFilter
            )
        };

        if (
            !this.processedInput__ ||
            this.inputData.dataTable.rows !== this.processedInput__.dataTable.rows ||
            oldFilterMap.predefinedFilter !== newFilterMap.predefinedFilter ||
            oldFilterMap.standardFilter !== newFilterMap.standardFilter ||
            oldFilterMap.complexFilter !== newFilterMap.complexFilter
        ) {
            this.prefilteredRows_ = filterTableRows(
                this.inputData.dataTable.rows,
                [newFilterMap.predefinedFilter, newFilterMap.standardFilter, newFilterMap.complexFilter]
            );
            this.filterMap_ = newFilterMap;
        }
    }

    private updateDataColumns(): void {
        if (!this.dataColumns_ || this.inputData.dataTable.columns !== this.processedInput__.dataTable.columns) {
            this.dataColumns_ = ComplexFilterUtils.extractDataColumns(this.inputData.dataTable);
        }
    }

    private updateTableInputData(): void {
        if (
            !this.filterTableViewInputData_ ||
            this.filterTableViewInputData_.dataTable !== this.inputData.dataTable ||
            this.filterTableViewInputData_.filteredRows !== this.prefilteredRows_ ||
            this.filterTableViewInputData_.visibilityFilter !== this.inputData.filterTableSettings.visibilityFilter ||
            this.filterTableViewInputData_.columnFilters !== this.inputData.filterTableSettings.columnFilters ||
            this.filterTableViewInputData_.columnOrder !== this.inputData.filterTableSettings.columnOrder
        ) {
            this.filterTableViewInputData_ = {
                dataTable: this.inputData.dataTable,
                filteredRows: this.prefilteredRows_,
                columnOrder: this.inputData.filterTableSettings.columnOrder,
                selectedRowIds: this.inputData.selectedRowIds,
                visibilityFilter: this.inputData.filterTableSettings.visibilityFilter,
                columnFilters: this.inputData.filterTableSettings.columnFilters
            };
        }
    }

    private updatePropValueMap(): void {
        if (!this.processedInput__ || this.processedInput__.dataTable.rows !== this.inputData.dataTable.rows) {
            this.propToValuesMap_ = extractPropToValuesMap(this.inputData.dataTable.rows, this.dataColumns_);
        }
    }
}
