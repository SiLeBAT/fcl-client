import { Component, ViewChild, Inject, OnDestroy } from "@angular/core";
import {
    MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";
import { DatatableComponent } from "@siemens/ngx-datatable";
import { Subscription, timer } from "rxjs";
import { concat, Utils } from "@app/tracing/util/non-ui-utils";
import { TableService } from "@app/tracing/services/table.service";
import { Store } from "@ngrx/store";
import * as fromTracing from "../../state/tracing.reducers";
import * as tracingSelectors from "../../state/tracing.selectors";
import { AlertService } from "@app/shared/services/alert.service";
import { SetSelectedElementsSOA } from "@app/tracing/state/tracing.actions";
import {
    Color,
    DataServiceInputState,
    TableRow,
} from "@app/tracing/data.model";

interface DeliveriesPropertiesData {
    deliveryIds: string[];
}

interface Column {
    id: string;
    prop: string;
    name: string;

    comparator?: <T>(a: T, b: T) => number;
}

interface Filter {
    filterText: string;
    filteredOptions?: string[];
    filterProps: string[];
}

interface FilterColumn extends Column, Filter {}

@Component({
    selector: "fcl-deliveries-properties",
    templateUrl: "./deliveries-properties.component.html",
    styleUrls: ["./deliveries-properties.component.scss"],
})
export class DeliveriesPropertiesComponent implements OnDestroy {
    private readonly MAX_COUNT_SORT_OPTIONS = 100;
    readonly ROW_HEIGHT = 30;

    private selectedRows_: TableRow[] = [];

    get selectedRows(): TableRow[] {
        return this.selectedRows_;
    }

    columns: FilterColumn[] = [];
    propToColumnMap: { [key: string]: FilterColumn } = {};

    private _unfilteredRows: TableRow[] = [];

    filteredRows: TableRow[] = [];

    rootFilter: Filter = { filterText: "", filterProps: [] };

    private deliveryIds: string[];

    stateSubscription: Subscription | null = null;

    private readonly columnOrdering = [
        "id",
        "name",
        "lot",
        "score",
        "source.name",
        "target.name",
        "source",
        "target",
        "weight",
        "crossContamination",
        "killContamination",
        "observed",
        "forward",
        "backward",
        "selected",
    ];

    @ViewChild(DatatableComponent, { static: true }) table: DatatableComponent;

    constructor(
        private tableService: TableService,
        private store: Store<fromTracing.State>,
        private alertService: AlertService,
        public dialogRef: MatDialogRef<DeliveriesPropertiesComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DeliveriesPropertiesData,
    ) {
        this.deliveryIds = data.deliveryIds;

        this.stateSubscription = this.store
            .select(tracingSelectors.selectDataServiceInputState)
            .subscribe(
                (graphState) => this.applyState(graphState),
                (err) =>
                    this.alertService.error(
                        `getTableData store subscription failed: ${err}`,
                    ),
            );
    }

    ngOnDestroy() {
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    onRowSelectionChange({ selected }: { selected: TableRow[] }): void {
        this.selectedRows_.splice(0, this.selectedRows_.length);
        this.selectedRows_.push(...selected);

        // we need this to get rid of the text selection
        window.getSelection()?.removeAllRanges();
    }

    private applyState(state: DataServiceInputState) {
        timer(200).subscribe(
            () => {
                const newData = this.tableService.getDeliveryTable(
                    state,
                    false,
                    this.deliveryIds,
                );
                const columns: FilterColumn[] = newData.columns.map((c, i) => ({
                    id: "c" + i,
                    prop: c.id,
                    name: c.name,
                    filterText: "",
                    filterProps: [c.id],
                }));
                this.orderColumns(columns);
                const propToColumnMap: { [key: string]: FilterColumn } =
                    columns.reduce(
                        (prevValue, currValue) => {
                            prevValue[currValue.prop] = currValue;
                            return prevValue;
                        },
                        {} as { [key: string]: FilterColumn },
                    );

                this.rootFilter.filterProps = columns.map((c) => c.prop);
                this._unfilteredRows = newData.rows;
                this.setRowColors();

                const filters = concat(columns, [this.rootFilter]);
                const filteredRows = this.filterRows(filters);
                this.filterOptions(filteredRows, columns);

                this.propToColumnMap = propToColumnMap;
                this.columns = columns;
                this.filteredRows = filteredRows;
            },
            () => this.alertService.error("Could not load properties."),
        );
    }

    private orderColumns(columns: FilterColumn[]): void {
        const propPrios = {};
        this.columnOrdering.forEach((prop, i) => (propPrios[prop] = i + 1));
        columns.sort((colA, colB) => {
            const prioColAProp = propPrios[colA.prop] || Number.MAX_VALUE;
            const prioColBProp = propPrios[colB.prop] || Number.MAX_VALUE;
            return Utils.compareNumbers(prioColAProp, prioColBProp);
        });
    }

    private setRowColors() {
        this._unfilteredRows.forEach((row) => {
            const colors =
                row.highlightingInfo.color.length === 0
                    ? [{ r: 0, g: 0, b: 0 }]
                    : row.highlightingInfo.color;

            row.hColor = `${this.colorToBackgroundString(colors)}`;
        });
    }

    private colorToBackgroundString(colors: Color[]): string {
        const nColors = colors.length;
        if (nColors === 1) {
            return Utils.colorToCss(colors[0]);
        } else {
            return (
                "linear-gradient(to right, " +
                colors
                    .map((color) => Utils.colorToCss(color))
                    .map(
                        (cssColor, index) =>
                            `${cssColor} ${(index / nColors) * 100}%, ${cssColor} ${((index + 1) / nColors) * 100}%`,
                    )
                    .join(", ") +
                ")"
            );
        }
    }

    resetFilter() {
        this.updateRowsAndOptions();
    }

    updateRowsAndOptions() {
        const tableWasEmptyBefore = this.filteredRows.length === 0;
        const filters = concat<Filter>(this.columns, [this.rootFilter]);
        const filteredRows = this.filterRows(filters);

        if (this.haveRowsChanged(filteredRows)) {
            this.filterOptions(filteredRows, filters);

            if (this.table) {
                this.table.offset = 0;
            }
            this.filteredRows = filteredRows;
        }
        if (
            tableWasEmptyBefore &&
            this.filteredRows.length > 0 &&
            this.table.bodyComponent !== undefined &&
            this.table.bodyComponent.offsetY > 0
        ) {
            // we need to to this here because the ngx-datatable shows artefacts if the vertical scroll offset was > 0 before
            // 'No data available'
            this.table.bodyComponent.offsetY = 0;
            this.table.offset = 0;
        }
        this.table.recalculate();
    }

    private haveRowsChanged(rows: any[]) {
        if (rows.length !== this.filteredRows.length) {
            return true;
        }
        const oldRowIds = Utils.createSimpleStringSet(
            this.filteredRows.map((r) => r.id),
        );
        return rows.some((r) => oldRowIds[r.id] === undefined);
    }

    private filterRows(filters: Filter[]): any[] {
        const filteredRows = this._unfilteredRows.filter((row) =>
            filters.every((filter) => {
                if (filter.filterText === null || filter.filterText === "") {
                    // filter is inactive
                    return true;
                } else {
                    const filterText = filter.filterText.toLowerCase();

                    return filter.filterProps.some((p) => {
                        const propValue = row[p];
                        if (propValue === undefined || propValue === null) {
                            return false;
                        } else {
                            const strValue: string =
                                typeof propValue === "string"
                                    ? propValue.toLowerCase()
                                    : propValue.toString();
                            return strValue.includes(filterText);
                        }
                    });
                }
            }),
        );

        return filteredRows;
    }

    private filterOptions(
        rows: any[],
        columns: Pick<FilterColumn, "filterProps" | "filteredOptions">[],
    ) {
        columns.forEach((column) => {
            if (column.filterProps.length === 1) {
                const prop = column.filterProps[0];
                const values = rows
                    .map((row) => row[prop])
                    .filter((p) => p !== undefined && p !== null);
                const filteredOptions = this.getSortedUniqueValues(values);

                column.filteredOptions =
                    filteredOptions.length > this.MAX_COUNT_SORT_OPTIONS
                        ? []
                        : filteredOptions;
            }
        });
    }

    private getSortedUniqueValues<T extends boolean | string | number>(
        values: T[],
        comparator?: (a: T, b: T) => number,
    ): string[] {
        if (values.length > 0) {
            const map: { [key: string]: T } =
                typeof values[0] === "string"
                    ? Utils.createObjectFromArray(values, (x) =>
                          (x as string).toLocaleLowerCase(),
                      )
                    : Utils.createObjectFromArray(values, (x) => x.toString());
            values = Object.keys(map).map((x) => map[x]);
            if (comparator) {
                values.sort(comparator);
            } else {
                values.sort();
            }
            return typeof values[0] === "string"
                ? (values as string[])
                : values.map((x) => x.toString());
        } else {
            return [];
        }
    }

    applySelection() {
        this.store.dispatch(
            new SetSelectedElementsSOA({
                selectedElements: {
                    stations: [],
                    deliveries: this.selectedRows.map((row) => row.id),
                },
            }),
        );
    }
}
