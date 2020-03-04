import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'fcl-standard-filter-view',
    templateUrl: './standard-filter-view.component.html',
    styleUrls: ['./standard-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class StandardFilterViewComponent implements OnInit {
    @Input() filterLabel: string;

    constructor() { }

    ngOnInit() {
    }

}
