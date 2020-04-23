import { Component, OnInit } from '@angular/core';
import { FilterService } from '../services/filter.service';

@Component({
    selector: 'fcl-clear-all-filter',
    templateUrl: './clear-all-filter.component.html',
    styleUrls: ['./clear-all-filter.component.scss']
})
export class ClearAllFilterComponent implements OnInit {

    constructor(
        private filterService: FilterService
    ) { }

    ngOnInit() {
    }

    clearAllFilter() {
        this.filterService.clearAllFilters();
    }

}
