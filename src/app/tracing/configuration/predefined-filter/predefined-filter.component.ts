import { Component, OnInit, Input } from '@angular/core';
import { PredefinedLabelConfig } from '../predefined-filter-view/predefined-filter-view.component';

@Component({
    selector: 'fcl-predefined-filter',
    templateUrl: './predefined-filter.component.html'
})
export class PredefinedFilterComponent implements OnInit {

    @Input() predefinedLabelConfig: PredefinedLabelConfig[];

    constructor() { }

    ngOnInit() {
    }

}
