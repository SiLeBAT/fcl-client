import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'fcl-clear-all-filter-view',
    templateUrl: './clear-all-filter-view.component.html',
    styleUrls: ['./clear-all-filter-view.component.scss']
})
export class ClearAllFilterViewComponent implements OnInit {
    @Output() clearFilter = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    clearAllFilter() {
        this.clearFilter.emit();
    }

}
