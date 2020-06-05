import { Component, OnInit, ViewEncapsulation, Input, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
    selector: 'fcl-station-table-view',
    templateUrl: './station-table-view.component.html',
    styleUrls: ['./station-table-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class StationTableViewComponent implements OnInit {

    @Input() rows: any[];
    @Input() columns: any[];
    @ViewChild('table', { static: true }) table: DatatableComponent;

    rowHeight: number = 18;

    constructor() { }

    ngOnInit() {
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
}
