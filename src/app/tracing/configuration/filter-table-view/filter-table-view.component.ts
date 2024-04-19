import {
    Component, ViewEncapsulation, Input, ViewChild, TemplateRef, Output, EventEmitter,
    OnChanges, SimpleChanges, DoCheck, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, OnDestroy, AfterViewInit
} from '@angular/core';
import {
    DatatableComponent, SelectionType,
    TableColumn as NgxTableColumn,
    SortPropDir
} from '@swimlane/ngx-datatable';
import { DataTable, TableRow, TableColumn, Size, TreeStatus } from '@app/tracing/data.model';
import { createVisibilityRowFilter, VisibilityRowFilter, OneTermForEachColumnRowFilter, createOneTermForEachColumnRowFilter } from '../filter-provider';
import { filterTableRows } from '../shared';
import * as _ from 'lodash';
import { VisibilityFilterState, ColumnFilterSettings, ActivityState } from '../configuration.model';
import { concat, removeNullish, Utils } from '@app/tracing/util/non-ui-utils';
import { Observable, Subscription } from 'rxjs';
import { applySorting, highlightingComparator, sortRows, visibilityComparator } from './filter-table-utils';

const CLASS_DATATABLE_FOOTER = 'datatable-footer';

interface AsyncTask {
    id?: string;
    created: number;
    handle?: NodeJS.Timeout;
    subscription?: Subscription;
}

interface FilterMap {
    visibilityFilter: VisibilityRowFilter;
    columnFilter: OneTermForEachColumnRowFilter;
}
export interface InputData {
    dataTable: DataTable;
    filteredRows: TableRow[];
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
// eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle
export class FilterTableViewComponent implements OnChanges, DoCheck, OnInit, OnDestroy, AfterViewInit {

    get visibilityFilterState(): VisibilityFilterState | undefined {
        return this.inputData?.visibilityFilter;
    }

    get sorts(): SortPropDir[] {
        return this.sorts_;
    }


    get tableRows(): TableRow[] {
        return this.tableRows_;
    }

    get columns(): NgxTableColumn[] {
        return this.columns_;
    }

    get selectionType(): SelectionType {
        return SelectionType.multi;
    }

    get showVisibleElements(): boolean {
        const visState = this.inputData?.visibilityFilter;
        return visState === VisibilityFilterState.SHOW_ALL || visState === VisibilityFilterState.SHOW_VISIBLE_ONLY;
    }

    get showInvisibleElements(): boolean {
        const visState = this.inputData?.visibilityFilter;
        return visState === VisibilityFilterState.SHOW_ALL || visState === VisibilityFilterState.SHOW_INVISIBLE_ONLY;
    }

    get selectedRows(): TableRow[] {
        return this.selectedRows_;
    }

    get isActive(): boolean {
        return this.activityState_ !== ActivityState.INACTIVE;
    }

    get isOpening(): boolean {
        return this.activityState_ === ActivityState.OPENING;
    }

    @Input() inputData: InputData | null = null;
    @Input() activityState$: Observable<ActivityState> | null = null;
    @Input() cycleStart$: Observable<void> | null = null;
    @Input() checkTableSize$: Observable<number> | null = null;
    @Input() updateTableSize$: Observable<void> | null = null;
    @Input() useTreeMode = false;

    @Output() selectColumns = new EventEmitter();
    @Output() mouseOverRow = new EventEmitter<TableRow | null>();
    @Output() rowDblClick = new EventEmitter<TableRow>();
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

    private dtFooterElement: HTMLElement | null = null;

    private processedInput__: InputData | null = null;
    private processDataIsRequired_ = false;
    private filterMap_: FilterMap | null = null;
    private columnFilterTexts_: { [key: string]: string };
    private tableRows_: TableRow[] = [];
    private treeStatusCache: Record<string, TreeStatus> = {};

    private columns_: NgxTableColumn[];
    private sorts_: SortPropDir[] = [];

    private selectedRows_: TableRow[] = [];
    private sortedUnfilteredRows_: TableRow[] = [];

    private activityState_: ActivityState = ActivityState.INACTIVE;

    private subscriptions_: Subscription[] = [];

    private tableSizeUpdateIsRequired_ = false;
    private tableSizeCheckIsRequired_ = false;
    private positiveWrapperSizeDetectedSinceLastActivation = false;
    private waitingForPositiveWrapperSize = false;
    private asyncTasks_: AsyncTask[] = [];

    constructor(
        private hostElement: ElementRef,
        private cdRef: ChangeDetectorRef
    ) {}

    // lifecycle hooks start

    // eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.inputData !== undefined && changes.inputData.currentValue !== null) {
            this.processDataIsRequired_ = true;
        }
    }

    // eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle
    ngOnInit(): void {
        if (this.activityState$ !== undefined && this.activityState$ !== null) {
            this.subscriptions_.push(this.activityState$.subscribe(
                (activityState) => this.setActivityState(activityState),
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => {}
            ));
        }
        if (this.checkTableSize$ !== undefined && this.checkTableSize$ !== null) {
            this.subscriptions_.push(this.checkTableSize$.subscribe(
                () => this.checkTableSizeOnStableWrapperSize({ stopOnOpen: false }),
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => {}
            ));
        }
        if (this.updateTableSize$ !== undefined && this.updateTableSize$ !== null) {
            this.subscriptions_.push(this.updateTableSize$.subscribe(
                () => {
                    this.tableSizeUpdateIsRequired_ = true;
                    if (this.isActive) {
                        this.cdRef.markForCheck();
                    }
                },
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => {}
            ));
        }
    }

    // eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle
    ngDoCheck(): void {
        if (this.isActive) {
            if (this.processDataIsRequired_ || this.tableSizeUpdateIsRequired_ || this.tableSizeCheckIsRequired_) {
                // processing of the input data is delayed
                // to avoid input changes of the ngx-datatable
                // otherwise the ngx-datatable would adapt its size to non positive dimensions
                // this would cause a non visible table
                if (!this.positiveWrapperSizeDetectedSinceLastActivation) {
                    if (!this.waitingForPositiveWrapperSize) {
                        this.waitForPosWrapperSize(true);

                        if (!this.positiveWrapperSizeDetectedSinceLastActivation) {
                            return;
                        }
                    } else {
                        return;
                    }
                } else if (this.waitingForPositiveWrapperSize) {
                    return;
                }
            }
            if (this.tableSizeCheckIsRequired_ && !(this.processDataIsRequired_ || this.tableSizeUpdateIsRequired_)) {
                this.syncTableSizeCheck();
            }

            const oldRows = this.tableRows;
            let rowsChanged = false;
            if (this.processDataIsRequired_) {
                this.processInput();
                this.processDataIsRequired_ = false;
                rowsChanged = oldRows !== this.tableRows;
            }
            if (!rowsChanged && this.tableSizeUpdateIsRequired_) {
                this.updateTableSize();
                rowsChanged = true;
            }
            if (rowsChanged) {
                this.tableSizeUpdateIsRequired_ = false;
                this.tableSizeCheckIsRequired_ = false;
            }
        }
    }

    // eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle
    ngAfterViewInit(): void {
        this.dtFooterElement = this.hostElement.nativeElement.getElementsByClassName(CLASS_DATATABLE_FOOTER)[0];
    }

    // eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle
    ngOnDestroy(): void {
        this.subscriptions_.forEach(s => s.unsubscribe());
        this.subscriptions_ = [];
        this.clearAsyncJobs();
        this.dtFooterElement = null;
    }

    // lifecycle hooks end

    // template triggers start

    onSelectColumns(): void {
        this.selectColumns.emit();
    }

    onRowSelectionChange({ selected }: { selected: TableRow[] }): void {
        if (this.processedInput__) {
            const selectedRowIds = selected.map(row => row.id);
            // dblclick events trigger 3 selection change events
            // only the first one changes (usually) the selection
            // we check here the selection change to emit only true selection changes
            if (this.areSelectedRowIdsEqual(selectedRowIds, this.processedInput__.selectedRowIds)) {
                // no selection change
            } else {
                // selection change detected
                this.processedInput__.selectedRowIds = selected.map(row => row.id);

                this.selectedRows_.splice(0, this.selectedRows_.length);
                this.selectedRows_.push(...selected);

                this.rowSelectionChange.emit(this.processedInput__.selectedRowIds);

                // we need this to get rid of the text selection
                window.getSelection()?.removeAllRanges();
            }
        }
    }

    onSetColumnFilterText(prop: string, filterTerm: string) {
        if (this.inputData) {
            this.columnFilterTexts_[prop] = filterTerm;
            this.filterChange.emit({
                columnFilters: this.inputData.columnOrder
                    .map(p => ({ filterProp: p, filterTerm: this.columnFilterTexts_[p] }))
                    .filter(f => f.filterTerm)
            });
        }
    }

    onToggleVisibilityFilterState(): void {
        if (this.visibilityFilterState !== undefined) {
            this.filterChange.emit({ visibilityFilter: this.getToggledVisibilityState(this.visibilityFilterState) });
        }
    }

    onRowOver(row: TableRow | null): void {
        this.mouseOverRow.emit(row);
    }

    onRowDblClick(row: TableRow): void {
        // we need this to get rid of the text selection
        window.getSelection()?.removeAllRanges();
        this.rowDblClick.emit(row);
    }

    onTreeAction(row: TableRow) {
        if (row.treeStatus === 'collapsed') {
            row.treeStatus = 'expanded';
        } else {
            row.treeStatus = 'collapsed';
        }
        this.treeStatusCache[row.id] = row.treeStatus;

        this.updateTableSize();
    }

    onColumnReorder(e: { column: any; newValue: number; prevValue: number }): void {
        if (!this.isColumnOrderOk()) {
            this.fixColumnOrder();
        }
        this.columnOrderChange.emit(this.getColumnOrdering());
    }

    onSort(event: {
        sorts: SortPropDir[];
        column: NgxTableColumn;
        prevValue: SortPropDir | undefined;
        newValue: SortPropDir;
    }): void {

        this.sorts_ = event.sorts;
        // setting the rows triggers the resorting
        // the sort order needed to be set before
        this.sortedUnfilteredRows_ = sortRows(
            this.sortedUnfilteredRows_,
            this.sortedUnfilteredRows_,
            this.columns_,
            this.sorts_
        );

        const newTableRows = applySorting(this.sortedUnfilteredRows_, this.tableRows_);
        this.tableRows_ = newTableRows;
    }

    // template triggers end

    private addMissingRowParents(rows: TableRow[]): void {
        const availableRows: Record<string, boolean> = {};
        rows.forEach(row => availableRows[row.id] = true);

        const missingParents: TableRow[] = [];
        for (const row of rows) {
            if (row.parentRow !== undefined && !availableRows[row.parentRowId!]) {
                missingParents.push(row.parentRow);
                availableRows[row.parentRowId!] = true;
            }
        }
        if (missingParents.length > 0) {
            rows.concat(missingParents);
        }
    }

    private getWrapperSize(): Size {
        return this.tableWrapper.nativeElement.getBoundingClientRect();
    }

    private getTableSize(): Size | null {
        if (this.table && this.dtFooterElement) {
            const ts = this.table.element.getBoundingClientRect();
            const fs = this.dtFooterElement.getBoundingClientRect();
            return { width: fs.width, height: fs.bottom - ts.top };
        } else {
            return null;
        }
    }

    private isSizeDifferent(a: Size, b: Size, epsilon: number): boolean {
        return (
            Math.abs(a.width - b.width) > epsilon ||
            Math.abs(a.height - b.height) > epsilon
        );
    }

    private stopTask(id: string): void {
        const obsoleteTasks = this.asyncTasks_.filter(t => t.id === id);
        if (obsoleteTasks.length > 0) {
            obsoleteTasks.forEach(task => {
                if (task.handle !== undefined) {
                    clearTimeout(task.handle);
                    delete task.handle;
                }
                if (task.subscription !== undefined) {
                    task.subscription.unsubscribe();
                    delete task.subscription;
                }
                this.asyncTasks_ = this.asyncTasks_.filter(t => t !== task);
            });
        }
    }

    private waitForPosWrapperSize(stopOnOpen: boolean): void {
        if (this.cycleStart$) {
            this.waitForPosWrapperSizeBasedOnTick(stopOnOpen);
        } else {
            this.waitForPosWrapperSizeBasedOnTimeout(stopOnOpen);
        }
    }

    private waitForPosWrapperSizeBasedOnTimeout(stopOnOpen: boolean, maxTimeSpan?: number): void {
        this.waitingForPositiveWrapperSize = true;
        const asyncTask: Partial<AsyncTask> = {
            id: 'waitForPosWrapperSizeBasedOnTimeout',
            created: (new Date()).valueOf()
        };
        this.stopTask(asyncTask.id!);

        if (this.getWrapperSize().width > 0) {
            this.positiveWrapperSizeDetectedSinceLastActivation = true;
            this.waitingForPositiveWrapperSize = false;
            return;
        }

        if (maxTimeSpan === undefined) {
            maxTimeSpan = Number.POSITIVE_INFINITY;
        }
        const endTime = asyncTask.created! + maxTimeSpan;
        const timeoutSpan = 10;

        const callBack = () => {
            delete asyncTask.handle;
            if (
                this.activityState_ !== ActivityState.INACTIVE &&
                (!stopOnOpen || this.activityState_ === ActivityState.OPENING)
            ) {
                const curTime = (new Date()).valueOf();
                if (endTime !== Number.POSITIVE_INFINITY || endTime >= curTime) {
                    const wrapperSize = this.getWrapperSize();
                    if (wrapperSize.width > 0) {
                        this.positiveWrapperSizeDetectedSinceLastActivation = true;
                    } else {
                        asyncTask.handle = setTimeout(callBack, timeoutSpan);
                    }
                }
            }
            if (asyncTask.handle === undefined) {
                this.waitingForPositiveWrapperSize = false;
                this.asyncTasks_ = this.asyncTasks_.filter(t => t !== asyncTask);
            }
        };
        asyncTask.handle = setTimeout(callBack, 0);
        this.asyncTasks_.push(asyncTask as AsyncTask);
    }

    private waitForPosWrapperSizeBasedOnTick(stopOnOpen: boolean): void {
        this.waitingForPositiveWrapperSize = true;
        const asyncTask: AsyncTask = {
            id: 'waitForPosWrapperSizeBasedOnTick',
            created: (new Date()).valueOf()
        };
        this.stopTask(asyncTask.id!);

        if (this.getWrapperSize().width > 0) {
            this.positiveWrapperSizeDetectedSinceLastActivation = true;
            this.waitingForPositiveWrapperSize = false;
            return;
        }

        const callBack = () => {
            let cancelTask = true;
            if (
                this.activityState_ !== ActivityState.INACTIVE &&
                (!stopOnOpen || this.activityState_ === ActivityState.OPENING)
            ) {
                const wrapperSize = this.getWrapperSize();
                if (wrapperSize.width > 0) {
                    this.positiveWrapperSizeDetectedSinceLastActivation = true;
                    this.cdRef.markForCheck();
                } else {
                    cancelTask = false;
                }
            }
            if (cancelTask) {
                this.waitingForPositiveWrapperSize = false;
                asyncTask.subscription!.unsubscribe();
                delete asyncTask.subscription;
                this.asyncTasks_ = this.asyncTasks_.filter(t => t !== asyncTask);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        asyncTask.subscription = this.cycleStart$!.subscribe(callBack, () => {});
        this.asyncTasks_.push(asyncTask as AsyncTask);
    }

    private checkTableSizeOnStableWrapperSize(options: {
        stopOnOpen?: boolean;
        maxTimeSpan?: number;
        timeoutSpan?: number;
        minStableTimeSpan?: number;
    }): void {
        const asyncTask: AsyncTask = {
            id: 'checkTableSizeOnStableWrapperSize',
            created: (new Date()).valueOf()
        };
        this.stopTask(asyncTask.id!);

        let refWrapperSize: Size | null = null;
        const stopOnOpen = options.stopOnOpen === undefined ? false : options.stopOnOpen;
        const maxTimeSpan = options.maxTimeSpan === undefined ? Number.POSITIVE_INFINITY : options.maxTimeSpan;
        const endTime = asyncTask.created + maxTimeSpan;
        const timeoutSpan = options.timeoutSpan === undefined ? 50 : options.timeoutSpan;
        const minStableTimeSpan = options.minStableTimeSpan === undefined ? (2.5 * timeoutSpan) : options.minStableTimeSpan;
        let lastUnmatchTime = asyncTask.created;

        const callBack = () => {
            const oldHandle = asyncTask.handle;
            if (
                this.activityState_ !== ActivityState.INACTIVE &&
                (!stopOnOpen || this.activityState_ === ActivityState.OPENING)
            ) {
                const curTime = (new Date()).valueOf();
                if (endTime !== Number.POSITIVE_INFINITY || endTime >= curTime) {
                    const wrapperSize = this.getWrapperSize();

                    if (refWrapperSize === null || this.isSizeDifferent(wrapperSize, refWrapperSize, 1)) {
                        refWrapperSize = wrapperSize;
                        lastUnmatchTime = curTime;
                        asyncTask.handle = setTimeout(callBack, timeoutSpan);
                    } else {
                        if (curTime - lastUnmatchTime < minStableTimeSpan) {
                            asyncTask.handle = setTimeout(callBack, timeoutSpan);
                        }
                    }
                }
            }
            if (oldHandle === asyncTask.handle) {
                this.syncTableSizeCheck();
                this.asyncTasks_ = this.asyncTasks_.filter(t => t !== asyncTask);
            }
        };
        asyncTask.handle = setTimeout(callBack, timeoutSpan);
        this.asyncTasks_.push(asyncTask as AsyncTask);
    }

    private setActivityState(state: ActivityState): void {
        if (state !== this.activityState_) {
            const wasActive = this.activityState_ !== ActivityState.INACTIVE;
            if (!wasActive) {
                this.positiveWrapperSizeDetectedSinceLastActivation = false;
            }
            this.activityState_ = state;
            if (state === ActivityState.INACTIVE) {
                this.clearAsyncJobs();
                this.waitingForPositiveWrapperSize = false;
            } else {
                if (this.tableSizeUpdateIsRequired_ || this.processDataIsRequired_) {
                    this.cdRef.markForCheck();
                } else if (state === ActivityState.OPEN || this.tableSizeCheckIsRequired_) {
                    this.syncTableSizeCheck();
                }
            }
        }
    }

    private areSelectedRowIdsEqual(rowIds1: string[], rowIds2: string[]): boolean {
        if (rowIds1.length !== rowIds2.length) {
            return false;
        } else {
            const idSet1 = new Set<string>(rowIds1);
            return rowIds2.every(id => idSet1.has(id));
        }
    }

    getColumnFilterText(columnId: string): string {
        return this.columnFilterTexts_[columnId] || '';
    }

    rowIdentity(row: TableRow): string {
        return row.id;
    }

    private clearAsyncJobs(): void {
        this.asyncTasks_.forEach(asyncTask => {
            if (asyncTask.handle !== undefined) {
                clearTimeout(asyncTask.handle);
                delete asyncTask.handle;
            }
            if (asyncTask.subscription !== undefined) {
                asyncTask.subscription.unsubscribe();
                delete asyncTask.subscription;
            }
        });
        this.asyncTasks_ = [];
    }

    private updateTableSize(): void {
        // force table refresh by changing the table input
        this.tableRows_ = this.tableRows_.slice();
        this.cdRef.markForCheck();
    }

    private syncTableSizeCheck(): void {
        const EPSILON = 1;
        if (this.isActive && !this.tableSizeUpdateIsRequired_) {
            const wrapperSize = this.getWrapperSize();
            if (wrapperSize.width > 0) {
                const tableSize = this.getTableSize();
                if (tableSize !== null) {
                    this.tableSizeCheckIsRequired_ = false;
                    if (this.isSizeDifferent(wrapperSize, tableSize, EPSILON)) {
                        this.tableSizeUpdateIsRequired_ = true;
                        this.cdRef.markForCheck();
                    }
                }
            }
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

    private processInput(): void {
        this.processDataIsRequired_ = false;
        this.updateColumns();
        this.updateRows();

        this.processedInput__ = this.inputData;
    }

    private updateColumns(): void {
        const didModelChange = this.inputData!.dataTable.modelFlag !== this.processedInput__?.dataTable?.modelFlag;
        const newDataColumns = this.inputData!.dataTable.columns;
        const newColumnOrder = this.inputData!.columnOrder.filter(prop => this.inputData!.dataTable.columns.some(c => c.id === prop));

        if (didModelChange) {
            // new model was loaded
            this.columns_ = concat(
                this.createFixedColumns(),
                removeNullish(
                    newColumnOrder.map(p => this.createNgxTableDataColumn(newDataColumns, p))
                )
            );
            this.treeStatusCache = {};
            this.sorts_ = [];
            this.sortedUnfilteredRows_ = [];
        } else {
            const currentColumnOrder = this.getColumnOrdering();
            const columnVisChanged =
                currentColumnOrder.length !== newColumnOrder.length ||
                !currentColumnOrder.every(p => newColumnOrder.includes(p));

            if (columnVisChanged) {
                this.columns_ = concat(
                    this.createFixedColumns(),
                    removeNullish(
                        newColumnOrder.map(p => {
                            const cols = this.columns_.filter(c => c.prop === p);
                            return cols.length === 1 ? cols[0] : this.createNgxTableDataColumn(newDataColumns, p);
                        })
                    )
                );
                this.adaptSortOrderToAvailableColumns();
            } else {
                const orderChanged = !_.isEqual(currentColumnOrder, newColumnOrder);
                if (orderChanged) {
                    this.applyColumnOrder(newColumnOrder);
                }
            }
        }
        // eslint-disable-next-line no-empty
        if (this.processedInput__ !== this.inputData) {}
    }

    private applyTreeStatusFromCache(rows: TableRow[]): void {
        if (this.useTreeMode) {
            const hasVisibleMember: Record<string, boolean> = {};
            for (const row of rows) {
                if (row.parentRowId !== undefined) {
                    hasVisibleMember[row.parentRowId] = true;
                }
            }
            for (const row of rows) {
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

    private adaptSortOrderToAvailableColumns(): void {
        const availableSortProps = this.sorts_.filter(s => this.columns_.some(c => c.prop === s.prop));
        if (availableSortProps.length !== this.sorts_.length) {
            this.sorts_ = this.sorts_.filter(s => availableSortProps.includes(s));
        }
    }

    private updateRows(): void {
        const oldPrefilteredRows = this.processedInput__ ? this.processedInput__.filteredRows : undefined;
        const newPrefilteredRows = this.inputData!.filteredRows;

        const filterMap: FilterMap = {
            visibilityFilter: (
                !this.processedInput__ || this.processedInput__.visibilityFilter !== this.inputData!.visibilityFilter ?
                    createVisibilityRowFilter(this.inputData!.visibilityFilter) :
                    this.filterMap_!.visibilityFilter
            ),
            columnFilter: (
                !this.processedInput__ || this.processedInput__.columnFilters !== this.inputData!.columnFilters ?
                    createOneTermForEachColumnRowFilter(this.inputData!.columnFilters) :
                    this.filterMap_!.columnFilter
            )
        };

        if (
            oldPrefilteredRows !== newPrefilteredRows ||
            filterMap.visibilityFilter !== this.filterMap_?.visibilityFilter ||
            filterMap.columnFilter !== this.filterMap_?.columnFilter
        ) {
            const tableWasEmptyBefore = this.tableRows_.length === 0;
            this.filterMap_ = filterMap;

            const unsortedFilteredRows = filterTableRows(newPrefilteredRows, [filterMap.visibilityFilter, filterMap.columnFilter]);
            this.addMissingRowParents(unsortedFilteredRows);

            const oldUnfilteredRows = this.processedInput__ ? this.processedInput__.dataTable.rows : undefined;
            const newUnfilteredRows = this.inputData!.dataTable.rows;

            if (oldUnfilteredRows !== newUnfilteredRows) {
                // sort unfiltered data
                this.applyTreeStatusFromCache(newUnfilteredRows);
                this.sortedUnfilteredRows_ = sortRows(
                    newUnfilteredRows,
                    this.sortedUnfilteredRows_,
                    this.columns_,
                    this.sorts_
                );
            }

            const sortedFilteredRows = applySorting(this.sortedUnfilteredRows_, unsortedFilteredRows);
            this.tableRows_ = sortedFilteredRows;

            this.updateColumnFilterTexts();
            if (
                tableWasEmptyBefore &&
                this.tableRows_.length > 0 &&
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
            this.processedInput__ === null ||
            this.processedInput__.selectedRowIds !== this.inputData!.selectedRowIds
        ) {
            const idToIsSelectedMap = Utils.createSimpleStringSet(this.inputData!.selectedRowIds);
            this.selectedRows_ = this.tableRows_.filter(row => idToIsSelectedMap[row.id]);
        }
    }

    private updateColumnFilterTexts(): void {
        const newTexts: { [key: string]: string } = {};
        for (const filter of this.inputData!.columnFilters) {
            newTexts[filter.filterProp] = filter.filterTerm;
        }
        this.columnFilterTexts_ = newTexts;
    }

    private createNgxTableDataColumn(dataColumns: TableColumn[], prop: string): NgxTableColumn | undefined {
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

    private getCellClass({ row }: { row: TableRow; column: NgxTableColumn; value: any}): any {
        return {
            'fcl-row-cell-invisible': row['invisible'] || (row.parentRow !== undefined && row.parentRow['invisible']),
            'fcl-font-style-italic': row.parentRowId !== undefined
        };
    }

    private recalculateTable() {
        this.table.recalculate();
    }

    private getColumnOrdering(): string[] {
        // eslint-disable-next-line no-underscore-dangle
        return this.table._internalColumns.filter(c => c.draggable).map(c => c.prop + '');
    }

    private isColumnOrderOk(): boolean {
        // checks whether all draggable columns are behind undraggable columns
        // eslint-disable-next-line no-underscore-dangle
        return this.table._internalColumns.every(
            (value, index, arr) => index === 0 || !arr[index - 1].draggable || value.draggable
        );
    }

    private fixColumnOrder(): void {
        // puts undraggable columns in front of draggable columns
        // eslint-disable-next-line no-underscore-dangle
        this.table._internalColumns = concat(
            // eslint-disable-next-line no-underscore-dangle
            this.table._internalColumns.filter(c => !c.draggable),
            // eslint-disable-next-line no-underscore-dangle
            this.table._internalColumns.filter(c => c.draggable)
        );
    }

    private applyColumnOrder(newColumnOrder: string[]) {
        // eslint-disable-next-line no-underscore-dangle
        const fixedColumns = this.table._internalColumns.filter(c => !c.draggable);
        // eslint-disable-next-line no-underscore-dangle
        const filterColumns = this.table._internalColumns.filter(c => c.draggable);
        const orderedFilterColumns = removeNullish(
            newColumnOrder.map(p => filterColumns.find(c => c.prop === p))
        );

        // eslint-disable-next-line no-underscore-dangle
        this.table._internalColumns = concat(
            fixedColumns,
            orderedFilterColumns,
            filterColumns.filter(c => !orderedFilterColumns.includes(c))
        );
    }
}
