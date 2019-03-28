import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'fcl-main-dash',
    templateUrl: './main-dash.component.html',
    styleUrls: ['./main-dash.component.scss']
})
export class MainDashComponent implements OnInit {

    appName: string = environment.appName;
    supportContact: string = environment.supportContact;

    constructor() { }

    ngOnInit() {
    }
}
