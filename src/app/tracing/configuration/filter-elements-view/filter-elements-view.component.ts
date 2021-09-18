import { Component, Input, Output, EventEmitter } from '@angular/core';
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
import { InputData as FilterTableViewInputData, TableFilterChange } from '../filter-table-view/filter-table-view.component';
import * as _ from 'lodash';
import { FilterTableSettings, ShowType, ComplexFilterCondition, PropToValuesMap } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';

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
    styleUrls: ['./filter-elements-view.component.scss']
})
export class FilterElementsViewComponent {

    @Input() inputData: InputData;
    @Input() standardFilterLabel: string;
    @Input() useTreeMode = false;

    @Output() filterSettingsChange = new EventEmitter<FilterTableSettings>();
    @Output() clearAllFilters = new EventEmitter();
    @Output() selectTableColumns = new EventEmitter();
    @Output() rowSelectionChange = new EventEmitter<string[]>();
    @Output() mouseOverTableRow = new EventEmitter<TableRow>();
    @Output() mouseLeaveTableRow = new EventEmitter<TableRow>();

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
        this.processLastInputIfNecessary();
        return this.filterTableViewInputData_;
    }

    get propToValuesMap(): PropToValuesMap {
        this.processLastInputIfNecessary();
        return this.propToValuesMap_;
    }

    get dataIsAvailable(): boolean {
        return !!this.inputData;
    }

    get dataColumns(): TableColumn[] {
        this.processLastInputIfNecessary();
        return this.dataColumns_;
    }

    private processedInput_: InputData;
    private prefilteredRows_: TableRow[];
    private filterTableViewInputData_: FilterTableViewInputData;
    private propToValuesMap_: PropToValuesMap;
    private dataColumns_: TableColumn[];

    private filterMap_: RowFilterMap;

    moreFilterOpenState = false;
    complexFilterOpenState = false;

    constructor() { }

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

    private processLastInputIfNecessary(): void {
        if (this.inputData !== this.processedInput_ && this.inputData) {
            this.processInputData();
        }
    }

    private processInputData(): void {
        this.updateFilterAndRows();
        this.updateDataColumns();
        this.updateTableInputData();
        this.updatePropValueMap();

        this.processedInput_ = this.inputData;
    }

    private updateFilterAndRows(): void {
        const newSettings = this.inputData.filterTableSettings;
        const oldSettings = this.processedInput_ ? this.processedInput_.filterTableSettings : undefined;

        const oldFilterMap = this.filterMap_;
        const newFilterMap: RowFilterMap = {
            predefinedFilter: (
                !oldSettings || oldSettings.predefinedFilter !== newSettings.predefinedFilter ?
                createPredefinedRowFilter(newSettings.predefinedFilter) :
                oldFilterMap.predefinedFilter
            ),
            complexFilter: (
                !oldSettings || oldSettings.complexFilter !== newSettings.complexFilter ?
                getUpdatedComplexRowFilter(newSettings.complexFilter, oldFilterMap ? oldFilterMap.complexFilter : undefined) :
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
            !this.processedInput_ ||
            this.inputData.dataTable.rows !== this.processedInput_.dataTable.rows ||
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
        if (!this.dataColumns_ || this.inputData.dataTable.columns !== this.processedInput_.dataTable.columns) {
            this.dataColumns_ = ComplexFilterUtils.extractDataColumns(this.inputData.dataTable);
        }
    }

    private updateTableInputData(): void {
        if (!this.filterTableViewInputData_) {
            this.filterTableViewInputData_ = {
                dataTable: {
                    columns: this.inputData.dataTable.columns,
                    rows: this.prefilteredRows_
                },
                columnOrder: this.inputData.filterTableSettings.columnOrder,
                selectedRowIds: this.inputData.selectedRowIds,
                visibilityFilter: this.inputData.filterTableSettings.visibilityFilter,
                columnFilters: this.inputData.filterTableSettings.columnFilters
            };
        } else {
            const dataTable = (
                (
                    this.inputData.dataTable.columns !== this.filterTableViewInputData_.dataTable.columns ||
                    this.prefilteredRows_ !== this.filterTableViewInputData_.dataTable.rows
                ) ?
                {
                    columns: this.inputData.dataTable.columns,
                    rows: this.prefilteredRows_
                } :
                this.filterTableViewInputData_.dataTable
            );

            this.filterTableViewInputData_ = (
                (
                    this.filterTableViewInputData_.dataTable !== dataTable ||
                    this.filterTableViewInputData_.visibilityFilter !== this.inputData.filterTableSettings.visibilityFilter ||
                    this.filterTableViewInputData_.columnFilters !== this.inputData.filterTableSettings.columnFilters ||
                    this.filterTableViewInputData_.columnOrder !== this.inputData.filterTableSettings.columnOrder
                ) ?
                ({
                    dataTable: dataTable,
                    columnOrder: this.inputData.filterTableSettings.columnOrder,
                    selectedRowIds: this.inputData.selectedRowIds,
                    visibilityFilter: this.inputData.filterTableSettings.visibilityFilter,
                    columnFilters: this.inputData.filterTableSettings.columnFilters
                }) :
                this.filterTableViewInputData_
            );
        }
    }

    private updatePropValueMap(): void {
        if (!this.processedInput_ || this.processedInput_.dataTable.rows !== this.inputData.dataTable.rows) {
            this.propToValuesMap_ = extractPropToValuesMap(this.inputData.dataTable.rows, this.dataColumns_);
        }
    }
}
