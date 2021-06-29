import { Component, ViewEncapsulation, Input, ViewChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { DatatableComponent, SelectionType, TableColumn as NgxTableColumn } from '@swimlane/ngx-datatable';
import { DataTable, NodeShapeType, TableRow, TableColumn, Size, TreeStatus } from '@app/tracing/data.model';
import { createVisibilityRowFilter, VisibilityRowFilter, OneTermForEachColumnRowFilter, createOneTermForEachColumnRowFilter } from '../filter-provider';
import { filterTableRows } from '../shared';
import * as _ from 'lodash';
import { VisibilityFilterState, ColumnFilterSettings } from '../configuration.model';
import { Utils } from '@app/tracing/util/non-ui-utils';

interface FilterMap {
    visibilityFilter: VisibilityRowFilter;
    columnFilter: OneTermForEachColumnRowFilter;
}

const shapeTypePriorities: NodeShapeType[] = [NodeShapeType.CIRCLE, NodeShapeType.TRIANGLE];
const shapePrioMap: { [key in NodeShapeType]: number } = {
    [NodeShapeType.CIRCLE]: shapeTypePriorities.indexOf(NodeShapeType.CIRCLE),
    [NodeShapeType.TRIANGLE]: shapeTypePriorities.indexOf(NodeShapeType.TRIANGLE),
    [NodeShapeType.SQUARE]: shapeTypePriorities.indexOf(NodeShapeType.SQUARE),
    [NodeShapeType.DIAMOND]: shapeTypePriorities.indexOf(NodeShapeType.DIAMOND),
    [NodeShapeType.PENTAGON]: shapeTypePriorities.indexOf(NodeShapeType.PENTAGON),
    [NodeShapeType.HEXAGON]: shapeTypePriorities.indexOf(NodeShapeType.HEXAGON),
    [NodeShapeType.OCTAGON]: shapeTypePriorities.indexOf(NodeShapeType.OCTAGON),
    [NodeShapeType.STAR]: shapeTypePriorities.indexOf(NodeShapeType.STAR)
};

function visibilityComparator(valueA, valueB, rowA, rowB, sortDirection): number {
    let result: number = 0;

    if (rowA['invisible'] === true && rowB['invisible'] === false) {
        result = -1;
    }
    if (rowA['invisible'] === false && rowB['invisible'] === true) {
        result = 1;
    }

    return result;
}

function highlightingComparator(valueA, valueB, rowA, rowB, sortDirection): number {

    if (rowA['invisible'] !== rowB['invisible']) {
        return rowA['invisible'] ? -1 : 1;
    } else {
        const hIA = rowA['highlightingInfo'];
        const hIB = rowB['highlightingInfo'];
        const shapeA: NodeShapeType = hIA['shape'] || NodeShapeType.CIRCLE;
        const shapeB: NodeShapeType = hIB['shape'] || NodeShapeType.CIRCLE;

        if (shapeA !== shapeB) {
            return shapePrioMap[shapeA] - shapePrioMap[shapeB];
        } else {
            const colorsA = hIA['color'];
            const colorsB = hIB['color'];
            // todo: use color priorities instead
            if (colorsA.length !== colorsB.length) {
                return colorsA.length - colorsB.length;
            } else {
                const n = colorsA.length;
                for (let i = 0; i < n; i++) {
                    for (let k = 0; k < 3; k++) {
                        if (colorsA[i][k] !== colorsB[i][k]) {
                            return colorsB[i][k] - colorsA[i][k];
                        }
                    }
                }
            }
        }
    }

    return 0;
}

export interface InputData {
    dataTable: DataTable;
    columnOrder: string[];
    selectedRowIds: string[];
    columnFilters: ColumnFilterSettings[];
    visibilityFilter: VisibilityFilterState;
}

export interface TableFilterChange {
    visibilityFilter?: VisibilityFilterState;
    columnFilters?: ColumnFilterSettings[];
}

@Component({
    selector: 'fcl-filter-table-view',
    templateUrl: './filter-table-view.component.html',
    styleUrls: ['./filter-table-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FilterTableViewComponent {

    get visibilityFilterState(): VisibilityFilterState {
        return this.inputData.visibilityFilter;
    }

    private set filteredRows(filteredRows: TableRow[]) {
        this.filteredRows_ = filteredRows;
        this.updateTreeRows();
    }

    private get filteredRows(): TableRow[] {
        return this.filteredRows_;
    }

    private get treeRows(): TableRow[] {
        return this.treeRows_;
    }

    private set treeRows(treeRows: TableRow[]) {
        this.treeRows_ = treeRows;
        this.updateTreeStatusFromCache();
    }

    get tableRows(): TableRow[] {
        this.processInputIfNecessary();
        return !this.useTreeMode ?
            this.filteredRows : this.treeRows;
    }

    get columns(): NgxTableColumn[] {
        this.processInputIfNecessary();
        return this.columns_;
    }

    get selectionType(): SelectionType {
        return SelectionType.multi;
    }

    get showVisibleElements(): boolean {
        const visState = this.inputData.visibilityFilter;
        return visState === VisibilityFilterState.SHOW_ALL || visState === VisibilityFilterState.SHOW_VISIBLE_ONLY;
    }

    get showInvisibleElements(): boolean {
        const visState = this.inputData.visibilityFilter;
        return visState === VisibilityFilterState.SHOW_ALL || visState === VisibilityFilterState.SHOW_INVISIBLE_ONLY;
    }

    get selectedRows(): TableRow[] {
        return this.selectedRows_;
    }

    @Input() inputData: InputData | null = null;
    @Input() useTreeMode = false;

    @Output() selectColumns = new EventEmitter();
    @Output() mouseOverRow = new EventEmitter<TableRow | null>();
    @Output() columnOrderChange = new EventEmitter<string[]>();
    @Output() filterChange = new EventEmitter<TableFilterChange>();
    @Output() rowSelectionChange = new EventEmitter<string[]>();

    @ViewChild('buttonColTpl', { static: true }) buttonColTpl: TemplateRef<any>;
    @ViewChild('patternColTpl', { static: true }) patternColTpl: TemplateRef<any>;
    @ViewChild('visibilityColTpl', { static: true }) visibilityColTpl: TemplateRef<any>;
    @ViewChild('treeColTpl', { static: true }) treeColTpl: TemplateRef<any>;
    @ViewChild('dataColTpl', { static: true }) dataColTpl: TemplateRef<any>;
    @ViewChild('patternRowTpl', { static: true }) patternRowTpl: TemplateRef<any>;
    @ViewChild('visibilityRowTpl', { static: true }) visibilityRowTpl: TemplateRef<any>;
    @ViewChild('dataRowTpl', { static: true }) dataRowTpl: TemplateRef<any>;
    @ViewChild('treeRowTpl', { static: true }) treeRowTpl: TemplateRef<any>;
    @ViewChild('table', { static: true }) table: DatatableComponent;
    @ViewChild('tableWrapper', { static: true }) tableWrapper: any;

    private processedInput_: InputData = null;
    private filterMap_: FilterMap = null;
    private columnFilterTexts_: { [key: string]: string };
    private filteredRows_: TableRow[] = [];
    private treeRows_: TableRow[] = [];
    private treeStatusCache: Record<string, TreeStatus> = {};

    private triggerTableRefreshTimeoutHandle: number | null = null;

    private columns_: NgxTableColumn[];

    private selectedRows_: TableRow[] = [];

    private updateTreeRows(): void {
        if (this.useTreeMode) {
            const availableRows: Record<string, boolean> = {};
            this.filteredRows_.forEach(row => availableRows[row.id] = true);

            const missingParents: TableRow[] = [];
            for (const row of this.filteredRows_) {
                if (row.parentRow !== undefined && !availableRows[row.parentRowId]) {
                    missingParents.push(row.parentRow);
                    availableRows[row.parentRowId] = true;
                }
            }
            this.treeRows =
                missingParents.length > 0 ?
                this.filteredRows.concat(missingParents) :
                this.filteredRows;
        }
    }

    onSelectColumns(): void {
        this.selectColumns.emit();
    }

    onRowSelectionChange({ selected }: { selected: TableRow[] }): void {
        this.processedInput_.selectedRowIds = selected.map(row => row.id);

        this.selectedRows_.splice(0, this.selectedRows_.length);
        this.selectedRows_.push(...selected);

        this.rowSelectionChange.emit(this.processedInput_.selectedRowIds);

        // we need this to get rid of the text selection
        window.getSelection().removeAllRanges();
    }

    getColumnFilterText(columnId: string): string {
        this.processInputIfNecessary();
        return this.columnFilterTexts_[columnId] || '';
    }

    onSetColumnFilterText(prop: string, filterTerm: string) {
        this.columnFilterTexts_[prop] = filterTerm;
        this.filterChange.emit({
            columnFilters: this.inputData.columnOrder
                .map(p => ({ filterProp: p, filterTerm: this.columnFilterTexts_[p] }))
                .filter(f => f.filterTerm)
        });
    }

    onToggleVisibilityFilterState(): void {
        this.filterChange.emit({ visibilityFilter: this.getToggledVisibilityState(this.visibilityFilterState) });
    }

    onRowOver(row: TableRow | null): void {
        this.mouseOverRow.emit(row);
    }

    onTreeAction(row: TableRow) {
        if (row.treeStatus === 'collapsed') {
            row.treeStatus = 'expanded';
        } else {
            row.treeStatus = 'collapsed';
        }
        this.treeStatusCache[row.id] = row.treeStatus;

        this.triggerTableRefresh();
    }

    rowIdentity(row: TableRow): string {
        return row.id;
    }

    private triggerTableRefresh(): void {
        // force table refresh by changing the table input
        if (this.useTreeMode) {
            this.treeRows_ = this.treeRows_.slice();
        } else {
            this.filteredRows_ = this.filteredRows_.slice();
        }
    }

    onComponentResized(): void {
        if (this.table) {
            if (this.triggerTableRefreshTimeoutHandle !== null) {
                clearTimeout(this.triggerTableRefreshTimeoutHandle);
            }
            this.triggerTableRefreshTimeoutHandle = window.setTimeout(() => {
                this.triggerTableRefreshTimeoutHandle = null;
                this.triggerTableRefresh();
            }, 20);
        }
    }

    private getToggledVisibilityState(state: VisibilityFilterState): VisibilityFilterState {
        switch (state) {
            case VisibilityFilterState.SHOW_ALL:
                return VisibilityFilterState.SHOW_VISIBLE_ONLY;
            case VisibilityFilterState.SHOW_VISIBLE_ONLY:
                return VisibilityFilterState.SHOW_INVISIBLE_ONLY;
            default:
                return VisibilityFilterState.SHOW_ALL;
        }
    }

    private processInputIfNecessary(): void {
        if (this.inputData !== this.processedInput_) {
            this.processInput();
        }
    }

    private processInput(): void {
        this.updateColumns();
        this.updateRows();

        this.processedInput_ = this.inputData;
    }

    private updateColumns(): void {
        const newDataColumns = this.inputData.dataTable.columns;
        const oldDataColumns = this.processedInput_ ? this.processedInput_.dataTable.columns : undefined;
        const newColumnOrder = this.inputData.columnOrder;
        if (newDataColumns !== oldDataColumns) {
            // new model was model
            this.columns_ = [].concat(
                this.createFixedColumns(),
                newColumnOrder.map(p => this.createNgxTableDataColumn(newDataColumns, p)).filter(c => !!c)
            );
            this.treeStatusCache = {};
        } else {
            const currentColumnOrder = this.getColumnOrdering();
            const columnVisChanged =
                currentColumnOrder.length !== newColumnOrder.length ||
                !currentColumnOrder.every(p => newColumnOrder.includes(p));

            if (columnVisChanged) {
                this.columns_ = [].concat(
                    this.createFixedColumns(),
                    newColumnOrder.map(p => {
                        const cols = this.columns_.filter(c => c.prop === p);
                        return cols.length === 1 ? cols[0] : this.createNgxTableDataColumn(newDataColumns, p);
                    }).filter(c => !!c)
                );
            } else {
                const orderChanged = !_.isEqual(currentColumnOrder, newColumnOrder);
                if (orderChanged) {
                    this.applyColumnOrder(newColumnOrder);
                }
            }
        }
        if (this.processedInput_ !== this.inputData) {}
    }

    private updateTreeStatusFromCache(): void {
        if (this.useTreeMode) {
            const hasVisibleMember: Record<string, boolean> = {};
            for (const row of this.treeRows_) {
                if (row.parentRowId !== undefined) {
                    hasVisibleMember[row.parentRowId] = true;
                }
            }
            for (const row of this.treeRows_) {
                if (row.parentRowId === undefined) {
                    if (hasVisibleMember[row.id]) {
                        row.treeStatus = this.treeStatusCache[row.id] || 'collapsed';
                    } else {
                        row.treeStatus = undefined;
                    }
                }
            }
        }
    }

    private updateRows(): void {
        const oldDataRows = this.processedInput_ ? this.processedInput_.dataTable.rows : undefined;
        const newDataRows = this.inputData.dataTable.rows;

        const filterMap: FilterMap = {
            visibilityFilter: (
                !this.processedInput_ || this.processedInput_.visibilityFilter !== this.inputData.visibilityFilter ?
                createVisibilityRowFilter(this.inputData.visibilityFilter) :
                this.filterMap_.visibilityFilter
            ),
            columnFilter: (
                !this.processedInput_ || this.processedInput_.columnFilters !== this.inputData.columnFilters ?
                createOneTermForEachColumnRowFilter(this.inputData.columnFilters) :
                this.filterMap_.columnFilter
            )
        };

        if (
            oldDataRows !== newDataRows ||
            filterMap.visibilityFilter !== this.filterMap_.visibilityFilter ||
            filterMap.columnFilter !== this.filterMap_.columnFilter
        ) {
            const tableWasEmptyBefore = this.filteredRows_.length === 0;
            this.filterMap_ = filterMap;
            this.filteredRows = filterTableRows(newDataRows, [filterMap.visibilityFilter, filterMap.columnFilter]);

            this.updateColumnFilterTexts();
            if (
                tableWasEmptyBefore &&
                this.filteredRows_.length > 0 &&
                this.table.bodyComponent !== undefined &&
                this.table.bodyComponent.offsetY > 0
             ) {
                // we need to to this here because the ngx-datatable shows artefacts if the vertical scroll offset was > 0 before
                // 'No data available'
                this.table.bodyComponent.offsetY = 0;
                this.table.offset = 0;
            }
            this.recalculateTable();
        }
        if (
            this.processedInput_ === null ||
            this.processedInput_.selectedRowIds !== this.inputData.selectedRowIds
        ) {
            const idToIsSelectedMap = Utils.createSimpleStringSet(this.inputData.selectedRowIds);
            this.selectedRows_ = this.filteredRows_.filter(row => idToIsSelectedMap[row.id]);
        }
    }

    private updateColumnFilterTexts(): void {
        const newTexts: { [key: string]: string } = {};
        for (const filter of this.inputData.columnFilters) {
            newTexts[filter.filterProp] = filter.filterTerm;
        }
        this.columnFilterTexts_ = newTexts;
    }

    private createNgxTableDataColumn(dataColumns: TableColumn[], prop: string): NgxTableColumn {
        const dataColumn = dataColumns.find(c => c.id === prop);
        const ngxColumn = (
            !dataColumn ?
            undefined :
            ({
                name: dataColumn.name,
                prop: dataColumn.id,
                resizeable: true,
                draggable: true,
                headerTemplate: this.dataColTpl,
                cellClass: this.getCellClass,
                cellTemplate: this.dataRowTpl
            })
        );
        return ngxColumn;
    }

    private createButtonColumn(): NgxTableColumn {
        return {
            name: ' ',
            prop: 'moreCol',
            resizeable: false,
            draggable: false,
            width: 20,
            headerTemplate: this.buttonColTpl,
            cellTemplate: this.treeRowTpl,
            headerClass: 'fcl-more-columns-header-cell',
            cellClass: 'fcl-more-column-row-cell',
            frozenLeft: true
        };
    }

    private createSymbolColumn(): NgxTableColumn {
        return {
            name: ' ',
            prop: 'patternCol',
            resizeable: false,
            draggable: false,
            width: 30,
            headerTemplate: this.patternColTpl,
            cellTemplate: this.patternRowTpl,
            headerClass: 'fcl-visibility-column-header-cell',
            cellClass: 'fcl-visibility-column-row-cell',
            comparator: highlightingComparator.bind(this)
        };
    }

    private createVisibilityColumn(): NgxTableColumn {
        return {
            name: ' ',
            prop: 'visCol',
            resizeable: false,
            draggable: false,
            width: 30,
            headerTemplate: this.visibilityColTpl,
            cellTemplate: this.visibilityRowTpl,
            headerClass: 'fcl-visibility-column-header-cell',
            cellClass: 'fcl-visibility-column-row-cell',
            comparator: visibilityComparator
        };
    }

    private createFixedColumns(): NgxTableColumn[] {
        return [
            this.createButtonColumn(),
            this.createSymbolColumn(),
            this.createVisibilityColumn()
        ];
    }

    private getCellClass({ row }: { row: TableRow, column: NgxTableColumn, value: any}): any {
        return {
            'fcl-row-cell-invisible': row['invisible'] || (row.parentRow !== undefined && row.parentRow['invisible']),
            'fcl-font-style-italic': row.parentRowId !== undefined
        };
    }

    recalculateTable() {
        this.table.recalculate();
    }

    recalculatePages() {
        this.table.recalculatePages();
    }

    onColumnReorder(e: { column: any, newValue: number, prevValue: number }): void {
        if (!this.isColumnOrderOk()) {
            this.fixColumnOrder();
        }
        this.columnOrderChange.emit(this.getColumnOrdering());
    }

    private getColumnOrdering(): string[] {
        return this.table._internalColumns.filter(c => c.draggable).map(c => c.prop + '');
    }

    private isColumnOrderOk(): boolean {
        // checks whether all draggable columns are behind undraggable columns
        return this.table._internalColumns.every(
            (value, index, arr) => index === 0 || !arr[index - 1].draggable || value.draggable
        );
    }

    private fixColumnOrder(): void {
        // puts undraggable columns in front of draggable columns
        this.table._internalColumns = [].concat(
            this.table._internalColumns.filter(c => !c.draggable),
            this.table._internalColumns.filter(c => c.draggable)
        );
    }

    private applyColumnOrder(newColumnOrder: string[]) {
        const fixedColumns = this.table._internalColumns.filter(c => !c.draggable);
        const filterColumns = this.table._internalColumns.filter(c => c.draggable);
        const orderedFilterColumns = newColumnOrder.map(p => filterColumns.find(c => c.prop === p)).filter(c => !!c);

        this.table._internalColumns = [].concat(
            fixedColumns,
            orderedFilterColumns,
            filterColumns.filter(c => !orderedFilterColumns.includes(c))
        );
    }
}
