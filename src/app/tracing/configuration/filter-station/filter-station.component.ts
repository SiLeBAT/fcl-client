import { PredefinedLabelConfig } from './../predefined-filter-view/predefined-filter-view.component';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'fcl-filter-station',
    templateUrl: './filter-station.component.html',
    styleUrls: ['./filter-station.component.scss']
})
export class FilterStationComponent implements OnInit {
    predefinedLabelConfig: PredefinedLabelConfig[];
    selected: string;

    constructor() { }

    ngOnInit() {
        this.predefinedLabelConfig = [
            {
                value: 'all',
                label: 'Show all'
            },
            {
                value: 'selected',
                label: 'Show only selected'
            },
            {
                value: 'traced',
                label: 'Show only traced'
            }
        ];

        this.selected = 'all';
    }

}
