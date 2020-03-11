import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

export interface PredefinedLabelConfig {
    value: string;
    label: string;
}

@Component({
    selector: 'fcl-predefined-filter-view',
    templateUrl: './predefined-filter-view.component.html',
    styleUrls: ['./predefined-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PredefinedFilterViewComponent implements OnInit {
    @Input() predefinedLabelConfig: PredefinedLabelConfig[];
    @Input() selected: string;

    constructor() { }

    ngOnInit() {
    }

}
