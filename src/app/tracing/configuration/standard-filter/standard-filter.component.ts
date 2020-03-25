import { Component, OnInit, Input } from '@angular/core';
import { FilterService } from '../services/filter.service';

@Component({
    selector: 'fcl-standard-filter',
    templateUrl: './standard-filter.component.html'
})
export class StandardFilterComponent implements OnInit {

    @Input() filterLabel: string;

    constructor(
        private filterService: FilterService
    ) { }

    ngOnInit() {
    }

    processStandardFilterTerm(standardFilterTerm) {
        this.filterService.processStandardFilterTerm(standardFilterTerm);
    }
}
