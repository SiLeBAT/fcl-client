import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'fcl-activate',
    templateUrl: './activate.component.html',
    styleUrls: ['./activate.component.scss']
})
export class ActivateComponent implements OnInit {
    @Input() tokenValid: boolean;
    @Input() appName: string;

    constructor() { }

    ngOnInit() {

    }
}
