import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'fcl-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    @Output() onTracingView = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    tracingView() {
        this.onTracingView.emit();
    }

}
