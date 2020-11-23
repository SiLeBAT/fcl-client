import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'fcl-admin-activate',
    templateUrl: './admin-activate.component.html',
    styleUrls: ['./admin-activate.component.scss']
})
export class AdminActivateComponent implements OnInit {
    @Input() adminTokenValid: boolean;
    @Input() name: string;
    @Input() appName: string;

    constructor() { }

    ngOnInit() {
    }

}
