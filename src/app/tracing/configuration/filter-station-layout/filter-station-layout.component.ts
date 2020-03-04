import { Component, OnInit, Input, TemplateRef } from '@angular/core';

@Component({
    selector: 'fcl-filter-station-layout',
    templateUrl: './filter-station-layout.component.html',
    styleUrls: ['./filter-station-layout.component.scss']
})
export class FilterStationLayoutComponent implements OnInit {

    @Input() standardFilterTemplate: TemplateRef<any>;
    @Input() predefinedFilterTemplate: TemplateRef<any>;
    @Input() stationTableTemplate: TemplateRef<any>;

    moreFilterOpenState: boolean = false;
    complexFilterOpenState: boolean = false;

    constructor() { }

    ngOnInit() {
    }

}
