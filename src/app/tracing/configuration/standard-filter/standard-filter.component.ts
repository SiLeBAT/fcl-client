import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'fcl-standard-filter',
    templateUrl: './standard-filter.component.html'
})
export class StandardFilterComponent implements OnInit {

    @Input() filterLabel: string;

    constructor() { }

    ngOnInit() {
    }

}
