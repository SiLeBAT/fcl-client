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
}
