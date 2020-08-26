import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
    DataTable, TableRow, TableColumn
} from '@app/tracing/data.model';
import {
    createPredefinedRowFilter,
    PredefinedRowFilter,
    ComplexRowFilter,
    OneTermForNColumnsRowFilter,
    getUpdatedOneTermForNColumnsRowFilter,
    getUpdatedComplexRowFilter
} from '../filter-provider';
import { filterTableRows } from '../shared';
import { InputData as FilterTableViewInputData, TableFilterChange } from '../filter-table-view/filter-table-view.component';
import * as _ from 'lodash';
import { FilterTableSettings, VisibilityFilterState, ColumnFilterSettings, ShowType, ExtendedOperationType, LogicalFilterCondition } from '../configuration.model';

export interface InputData {
    dataTable: DataTable;
    filterTableSettings: FilterTableSettings;
}

interface RowFilterMap {
    predefinedFilter: PredefinedRowFilter;
    complexFilter: ComplexRowFilter;
    standardFilter: OneTermForNColumnsRowFilter;
}

interface PropValueMap {
    [key: string]: (string | number | boolean)[];
}

@Component({
    selector: 'fcl-filter-elements-view',
    templateUrl: './filter-elements-view.component.html',
    styleUrls: ['./filter-elements-view.component.scss']
})
export class FilterElementsViewComponent {

    @Input() inputData: InputData;
    @Input() standardFilterLabel: string;

    @Output() filterSettingsChange = new EventEmitter<FilterTableSettings>();
    @Output() clearAllFilters = new EventEmitter();
    @Output() selectTableColumns = new EventEmitter();
    @Output() mouseOverTableRow = new EventEmitter<TableRow>();
    @Output() mouseLeaveTableRow = new EventEmitter<TableRow>();

    availableOperatorTypes: ExtendedOperationType[] = [
        ExtendedOperationType.EQUAL,
        ExtendedOperationType.CONTAINS,
        ExtendedOperationType.GREATER,
        ExtendedOperationType.NOT_EQUAL,
        ExtendedOperationType.LESS,
        ExtendedOperationType.REGEX_EQUAL,
        ExtendedOperationType.REGEX_NOT_EQUAL,
        ExtendedOperationType.REGEX_EQUAL_IGNORE_CASE,
        ExtendedOperationType.REGEX_NOT_EQUAL_IGNORE_CASE
    ];

    get standardFilterSettings(): string {
        return this.inputData.filterTableSettings.standardFilter;
    }

    get predefinedFilterSettings(): ShowType {
        return this.inputData.filterTableSettings.predefinedFilter;
    }

    get complexFilterSettings(): LogicalFilterCondition[] {
        return this.inputData.filterTableSettings.complexFilter.conditions;
    }

    get filterTableViewInputData(): FilterTableViewInputData {
        this.processLastInputIfNecessary();
        return this.filterTableViewInputData_;
    }

    get propToValuesMap(): PropValueMap {
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
    private propToValuesMap_: PropValueMap;
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

    onComplexFilterChange(conditions: LogicalFilterCondition[]): void {
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

    onMouseOverTableRow(row: TableRow): void {
        this.mouseOverTableRow.emit(row);
    }

    onMouseLeaveTableRow(row: TableRow): void {
        this.mouseLeaveTableRow.emit(row);
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
            this.dataColumns_ = this.inputData.dataTable.columns.filter(c => c.id !== 'highlightingInfo');
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
                    visibilityFilter: this.inputData.filterTableSettings.visibilityFilter,
                    columnFilters: this.inputData.filterTableSettings.columnFilters
                }) :
                this.filterTableViewInputData_
            );
        }
    }

    private updatePropValueMap(): void {
        if (!this.processedInput_ || this.processedInput_.dataTable.rows !== this.processedInput_.dataTable.rows) {
            const propToValuesMap: PropValueMap = {};
            for (const column of this.dataColumns_) {
                const values = _.uniq(
                    this.inputData.dataTable.rows
                        .map(r => r[column.id] as (string | number | boolean))
                        .filter(v => v !== undefined && v !== null)
                    ).sort();
                propToValuesMap[column.id] = values;
            }
            propToValuesMap[''] = _.uniq([].concat(...Object.values(propToValuesMap))).sort();
            this.propToValuesMap_ = propToValuesMap;
        }
    }
}
