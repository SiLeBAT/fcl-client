import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'fcl-anonymous-button-view',
    templateUrl: './anonymous-button-view.component.html',
    styleUrls: ['./anonymous-button-view.component.scss']
})
export class AnonymousButtonViewComponent implements OnInit {

    @Input() tooltip = '';

    constructor() { }

    ngOnInit() {
    }

    onAnonymize() { }

}
